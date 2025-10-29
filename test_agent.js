#!/usr/bin/env node

/**
 * Test Agent - Automatically runs tests, generates missing tests, and tracks coverage
 * 
 * This script watches for file changes and automatically runs relevant tests,
 * generates test stubs for new functions/classes, and tracks coverage metrics.
 */

import chokidar from 'chokidar';
import { exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// Configuration
const CONFIG = {
  // File patterns to watch
  watchPatterns: [
    'api/**/*.js',
    'core/**/*.js',
    'platforms/**/*.js',
    'scripts/**/*.js',
    'tests/**/*.{js,jsx}'
  ],
  
  // Test commands for different directories
  testCommands: {
    'api': 'npm test -- --testPathPattern=api',
    'core': 'npm test -- --testPathPattern=core',
    'platforms': 'npm test -- --testPathPattern=platforms',
    'scripts': 'npm test -- --testPathPattern=scripts',
    'all': 'npm test'
  },
  
  // Coverage commands
  coverageCommands: {
    'api': 'npm test -- --coverage --testPathPattern=api',
    'core': 'npm test -- --coverage --testPathPattern=core',
    'platforms': 'npm test -- --coverage --testPathPattern=platforms',
    'scripts': 'npm test -- --coverage --testPathPattern=scripts',
    'all': 'npm test -- --coverage'
  },
  
  // Debounce delay (ms) to avoid running tests too frequently
  debounceDelay: 2000,
  
  // Auto-commit settings
  autoCommit: {
    enabled: true,
    commitMessage: 'test: auto-generated tests and coverage updates',
    maxCommitsPerHour: 15, // Higher limit for test generation
    dryRun: false
  },
  
  // Test generation settings
  testGeneration: {
    enabled: true,
    generateForNewFiles: true,
    generateForNewFunctions: true,
    templateDir: 'tests/templates'
  },
  
  // Colors for console output
  colors: {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    gray: '\x1b[90m'
  }
};

class TestAgent {
  constructor() {
    this.watcher = null;
    this.debounceTimers = new Map();
    this.isRunning = false;
    this.commitCount = 0;
    this.lastCommitReset = Date.now();
    this.testedFiles = new Set();
    this.coverageData = new Map();
  }

  log(message, color = 'reset') {
    const timestamp = new Date().toISOString().substr(11, 8);
    console.log(`${CONFIG.colors[color]}[${timestamp}] ${message}${CONFIG.colors.reset}`);
  }

  getDirectoryFromPath(filePath) {
    const relativePath = path.relative(projectRoot, filePath);
    const parts = relativePath.split(path.sep);
    return parts[0];
  }

  getTestCommand(filePath) {
    const dir = this.getDirectoryFromPath(filePath);
    return CONFIG.testCommands[dir] || CONFIG.testCommands.all;
  }

  getCoverageCommand(filePath) {
    const dir = this.getDirectoryFromPath(filePath);
    return CONFIG.coverageCommands[dir] || CONFIG.coverageCommands.all;
  }

  shouldTestFile(filePath) {
    const ext = path.extname(filePath);
    const relativePath = path.relative(projectRoot, filePath);
    
    // Skip test files themselves, but watch for changes
    if (relativePath.includes('/tests/') || relativePath.includes('/__tests__/')) {
      return true;
    }
    
    // Check if file matches watch patterns
    return CONFIG.watchPatterns.some(pattern => {
      const regex = pattern
        .replace(/\*\*/g, '.*')
        .replace(/\*/g, '[^/]*')
        .replace(/\{([^}]+)\}/g, (match, group) => {
          const extensions = group.split(',').map(ext => ext.trim());
          return `(${extensions.map(ext => ext.replace('.', '\\.')).join('|')})`;
        });
      return new RegExp(`^${regex}$`).test(relativePath);
    });
  }

  async runTests(filePath) {
    const testCommand = this.getTestCommand(filePath);
    this.log(`Running tests for ${path.relative(projectRoot, filePath)}...`, 'blue');
    
    return new Promise((resolve) => {
      exec(testCommand, { cwd: projectRoot }, (error, stdout, stderr) => {
        if (error) {
          this.log(`Test failures in ${path.relative(projectRoot, filePath)}:`, 'red');
          console.log(stderr || stdout);
          resolve(false);
        } else {
          this.log(`✓ Tests passed for ${path.relative(projectRoot, filePath)}`, 'green');
          this.testedFiles.add(filePath);
          resolve(true);
        }
      });
    });
  }

  async runCoverage(filePath) {
    const coverageCommand = this.getCoverageCommand(filePath);
    this.log(`Running coverage analysis for ${path.relative(projectRoot, filePath)}...`, 'cyan');
    
    return new Promise((resolve) => {
      exec(coverageCommand, { cwd: projectRoot }, (error, stdout, stderr) => {
        if (error) {
          this.log(`Coverage analysis failed for ${path.relative(projectRoot, filePath)}:`, 'red');
          console.log(stderr || stdout);
          resolve(false);
        } else {
          this.log(`✓ Coverage analysis completed for ${path.relative(projectRoot, filePath)}`, 'green');
          this.parseCoverageOutput(stdout);
          resolve(true);
        }
      });
    });
  }

  parseCoverageOutput(output) {
    // Parse Jest coverage output to extract metrics
    const lines = output.split('\n');
    const coverageMatch = lines.find(line => line.includes('All files'));
    
    if (coverageMatch) {
      const metrics = coverageMatch.match(/(\d+\.?\d*)%/g);
      if (metrics) {
        this.coverageData.set('lastRun', {
          statements: parseFloat(metrics[0]),
          branches: parseFloat(metrics[1]),
          functions: parseFloat(metrics[2]),
          lines: parseFloat(metrics[3]),
          timestamp: new Date().toISOString()
        });
      }
    }
  }

  async generateTestStub(filePath) {
    if (!CONFIG.testGeneration.enabled) return false;

    const relativePath = path.relative(projectRoot, filePath);
    const testPath = path.join(projectRoot, 'tests', relativePath.replace('.js', '.test.js'));
    
    // Check if test file already exists
    try {
      await fs.access(testPath);
      return false; // Test file already exists
    } catch {
      // Test file doesn't exist, generate it
    }

    try {
      const fileContent = await fs.readFile(filePath, 'utf8');
      const testContent = this.createTestStub(filePath, fileContent);
      
      // Ensure test directory exists
      await fs.mkdir(path.dirname(testPath), { recursive: true });
      
      // Write test file
      await fs.writeFile(testPath, testContent, 'utf8');
      
      this.log(`Generated test stub: ${path.relative(projectRoot, testPath)}`, 'magenta');
      return true;
    } catch (error) {
      this.log(`Failed to generate test stub for ${relativePath}: ${error.message}`, 'red');
      return false;
    }
  }

  createTestStub(filePath, fileContent) {
    const fileName = path.basename(filePath, '.js');
    const relativePath = path.relative(projectRoot, filePath);
    
    // Extract function names from file content
    const functionMatches = fileContent.match(/function\s+(\w+)/g) || [];
    const exportMatches = fileContent.match(/export\s+(?:const|function|class)\s+(\w+)/g) || [];
    
    const functions = [
      ...functionMatches.map(match => match.replace('function ', '')),
      ...exportMatches.map(match => match.replace(/export\s+(?:const|function|class)\s+/, ''))
    ];

    const testTemplate = `import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';

describe('${fileName}', () => {
  beforeEach(() => {
    // Setup before each test
  });

  afterEach(() => {
    // Cleanup after each test
    jest.clearAllMocks();
  });

${functions.map(func => `  describe('${func}', () => {
    it('should be defined', () => {
      expect(${func}).toBeDefined();
    });

    it('should work correctly', () => {
      // TODO: Add specific test cases
      expect(true).toBe(true);
    });
  });`).join('\n\n')}

  // TODO: Add integration tests
  describe('Integration Tests', () => {
    it('should work end-to-end', () => {
      // TODO: Add integration test cases
      expect(true).toBe(true);
    });
  });
});
`;

    return testTemplate;
  }

  async commitChanges() {
    if (!CONFIG.autoCommit.enabled || this.testedFiles.size === 0) {
      return;
    }

    // Reset commit count every hour
    const now = Date.now();
    if (now - this.lastCommitReset > 3600000) { // 1 hour
      this.commitCount = 0;
      this.lastCommitReset = now;
    }

    // Check commit rate limit
    if (this.commitCount >= CONFIG.autoCommit.maxCommitsPerHour) {
      this.log(`⚠ Commit rate limit reached (${CONFIG.autoCommit.maxCommitsPerHour}/hour)`, 'yellow');
      return;
    }

    try {
      // Check if there are any changes to commit
      const { stdout } = await this.execPromise('git status --porcelain');
      if (!stdout.trim()) {
        this.log('No test changes to commit', 'gray');
        return;
      }

      // Add all changes
      await this.execPromise('git add .');
      
      // Create commit message with list of tested files
      const fileList = Array.from(this.testedFiles)
        .map(f => path.relative(projectRoot, f))
        .join(', ');
      
      const coverageInfo = this.coverageData.get('lastRun');
      const coverageText = coverageInfo ? 
        `\n\nCoverage: ${coverageInfo.statements}% statements, ${coverageInfo.branches}% branches, ${coverageInfo.functions}% functions, ${coverageInfo.lines}% lines` : '';
      
      const commitMessage = `${CONFIG.autoCommit.commitMessage}\n\nTested files: ${fileList}${coverageText}`;
      
      if (CONFIG.autoCommit.dryRun) {
        this.log(`[DRY RUN] Would commit: ${commitMessage}`, 'cyan');
      } else {
        await this.execPromise(`git commit -m "${commitMessage}"`);
        this.commitCount++;
        this.log(`✓ Committed test updates (${this.commitCount}/${CONFIG.autoCommit.maxCommitsPerHour} this hour)`, 'green');
      }
      
      // Clear the tested files set
      this.testedFiles.clear();
      
    } catch (error) {
      this.log(`Failed to commit test changes: ${error.message}`, 'red');
    }
  }

  execPromise(command) {
    return new Promise((resolve, reject) => {
      exec(command, { cwd: projectRoot }, (error, stdout, stderr) => {
        if (error) {
          reject(error);
        } else {
          resolve({ stdout, stderr });
        }
      });
    });
  }

  debouncedTest(filePath) {
    // Clear existing timer for this file
    if (this.debounceTimers.has(filePath)) {
      clearTimeout(this.debounceTimers.get(filePath));
    }

    // Set new timer
    const timer = setTimeout(async () => {
      // Generate test stub if needed
      if (CONFIG.testGeneration.enabled && !filePath.includes('/tests/')) {
        await this.generateTestStub(filePath);
      }

      // Run tests
      const testsPassed = await this.runTests(filePath);
      
      // Run coverage if tests passed
      if (testsPassed) {
        await this.runCoverage(filePath);
        
        // Wait a bit for file system to settle, then commit
        setTimeout(() => this.commitChanges(), 1000);
      }
      
      this.debounceTimers.delete(filePath);
    }, CONFIG.debounceDelay);

    this.debounceTimers.set(filePath, timer);
  }

  async start() {
    if (this.isRunning) {
      this.log('Test agent is already running', 'yellow');
      return;
    }

    this.log('🚀 Starting Test Agent...', 'bright');
    this.log('Watching for file changes and auto-testing...', 'cyan');
    
    if (CONFIG.autoCommit.dryRun) {
      this.log('⚠ DRY RUN MODE: No actual commits will be made', 'yellow');
    }

    // Create watcher with chokidar
    this.watcher = chokidar.watch(CONFIG.watchPatterns, {
      cwd: projectRoot,
      ignored: [
        '**/node_modules/**',
        '**/.git/**',
        '**/output/**',
        '**/.next/**',
        '**/coverage/**'
      ],
      ignoreInitial: true,
      persistent: true
    });

    // Handle file changes
    this.watcher.on('change', (filePath) => {
      const fullPath = path.join(projectRoot, filePath);
      
      if (this.shouldTestFile(fullPath)) {
        this.log(`File changed: ${filePath}`, 'magenta');
        this.debouncedTest(fullPath);
      }
    });

    // Handle errors
    this.watcher.on('error', (error) => {
      this.log(`Watcher error: ${error.message}`, 'red');
    });

    // Handle ready event
    this.watcher.on('ready', () => {
      this.log('✅ Test Agent is now active and watching files', 'green');
      this.log('Press Ctrl+C to stop', 'cyan');
    });

    this.isRunning = true;
  }

  stop() {
    if (!this.isRunning) {
      return;
    }

    this.log('🛑 Stopping Test Agent...', 'yellow');

    // Clear all debounce timers
    this.debounceTimers.forEach(timer => clearTimeout(timer));
    this.debounceTimers.clear();

    // Close watcher
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }

    this.isRunning = false;
    this.log('✅ Test Agent stopped', 'green');
  }
}

// Handle graceful shutdown
const testAgent = new TestAgent();

process.on('SIGINT', () => {
  testAgent.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  testAgent.stop();
  process.exit(0);
});

// Start the test agent
testAgent.start().catch(error => {
  console.error('Failed to start test agent:', error);
  process.exit(1);
});

export default TestAgent;
