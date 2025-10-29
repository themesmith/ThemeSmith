#!/usr/bin/env node

/**
 * Documentation Agent - Automatically generates JSDoc comments, API docs, and maintains documentation
 * 
 * This script watches for file changes and automatically generates JSDoc comments,
 * updates API documentation, and maintains project documentation.
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
    'scripts/**/*.js'
  ],
  
  // Documentation commands
  docCommands: {
    'api': 'npx jsdoc api/ -c jsdoc.config.json',
    'core': 'npx jsdoc core/ -c jsdoc.config.json',
    'platforms': 'npx jsdoc platforms/ -c jsdoc.config.json',
    'scripts': 'npx jsdoc scripts/ -c jsdoc.config.json',
    'all': 'npx jsdoc -c jsdoc.config.json'
  },
  
  // Debounce delay (ms) to avoid running docs too frequently
  debounceDelay: 3000,
  
  // Auto-commit settings
  autoCommit: {
    enabled: true,
    commitMessage: 'docs: auto-generated documentation updates',
    maxCommitsPerHour: 8, // Lower limit for documentation
    dryRun: false
  },
  
  // JSDoc generation settings
  jsdocGeneration: {
    enabled: true,
    generateForNewFiles: true,
    generateForNewFunctions: true,
    updateExistingDocs: true
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

class DocumentationAgent {
  constructor() {
    this.watcher = null;
    this.debounceTimers = new Map();
    this.isRunning = false;
    this.commitCount = 0;
    this.lastCommitReset = Date.now();
    this.documentedFiles = new Set();
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

  getDocCommand(filePath) {
    const dir = this.getDirectoryFromPath(filePath);
    return CONFIG.docCommands[dir] || CONFIG.docCommands.all;
  }

  shouldDocumentFile(filePath) {
    const ext = path.extname(filePath);
    const relativePath = path.relative(projectRoot, filePath);
    
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

  async generateJSDoc(filePath) {
    const docCommand = this.getDocCommand(filePath);
    this.log(`Generating JSDoc for ${path.relative(projectRoot, filePath)}...`, 'blue');
    
    return new Promise((resolve) => {
      exec(docCommand, { cwd: projectRoot }, (error, stdout, stderr) => {
        if (error) {
          this.log(`JSDoc generation failed for ${path.relative(projectRoot, filePath)}:`, 'red');
          console.log(stderr || stdout);
          resolve(false);
        } else {
          this.log(`✓ JSDoc generated for ${path.relative(projectRoot, filePath)}`, 'green');
          this.documentedFiles.add(filePath);
          resolve(true);
        }
      });
    });
  }

  async addJSDocComments(filePath) {
    if (!CONFIG.jsdocGeneration.enabled) return false;

    try {
      const fileContent = await fs.readFile(filePath, 'utf8');
      const updatedContent = this.addJSDocToFile(fileContent, filePath);
      
      if (updatedContent !== fileContent) {
        await fs.writeFile(filePath, updatedContent, 'utf8');
        this.log(`Added JSDoc comments to: ${path.relative(projectRoot, filePath)}`, 'magenta');
        return true;
      }
      
      return false;
    } catch (error) {
      this.log(`Failed to add JSDoc to ${path.relative(projectRoot, filePath)}: ${error.message}`, 'red');
      return false;
    }
  }

  addJSDocToFile(content, filePath) {
    const fileName = path.basename(filePath, '.js');
    const relativePath = path.relative(projectRoot, filePath);
    
    // Extract function declarations and exports
    const functionMatches = content.match(/^(export\s+)?(async\s+)?function\s+(\w+)/gm) || [];
    const classMatches = content.match(/^(export\s+)?class\s+(\w+)/gm) || [];
    const constMatches = content.match(/^(export\s+)?const\s+(\w+)\s*=/gm) || [];
    
    let updatedContent = content;
    let hasChanges = false;
    
    // Add JSDoc for functions
    functionMatches.forEach(match => {
      const functionName = match.match(/function\s+(\w+)/)?.[1];
      if (functionName && !this.hasJSDoc(updatedContent, functionName)) {
        const jsdoc = this.generateFunctionJSDoc(functionName, relativePath);
        updatedContent = updatedContent.replace(match, `${jsdoc}\n${match}`);
        hasChanges = true;
      }
    });
    
    // Add JSDoc for classes
    classMatches.forEach(match => {
      const className = match.match(/class\s+(\w+)/)?.[1];
      if (className && !this.hasJSDoc(updatedContent, className)) {
        const jsdoc = this.generateClassJSDoc(className, relativePath);
        updatedContent = updatedContent.replace(match, `${jsdoc}\n${match}`);
        hasChanges = true;
      }
    });
    
    // Add JSDoc for constants
    constMatches.forEach(match => {
      const constName = match.match(/const\s+(\w+)/)?.[1];
      if (constName && !this.hasJSDoc(updatedContent, constName)) {
        const jsdoc = this.generateConstJSDoc(constName, relativePath);
        updatedContent = updatedContent.replace(match, `${jsdoc}\n${match}`);
        hasChanges = true;
      }
    });
    
    return hasChanges ? updatedContent : content;
  }

  hasJSDoc(content, name) {
    // Check if JSDoc already exists for this function/class/const
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(name)) {
        // Check previous lines for JSDoc
        for (let j = Math.max(0, i - 5); j < i; j++) {
          if (lines[j].includes('/**') || lines[j].includes('@')) {
            return true;
          }
        }
      }
    }
    return false;
  }

  generateFunctionJSDoc(functionName, filePath) {
    return `/**
 * ${functionName} - Brief description of what this function does
 * 
 * @description Detailed description of the function's purpose and behavior
 * @param {*} param1 - Description of parameter 1
 * @param {*} param2 - Description of parameter 2
 * @returns {*} Description of return value
 * @throws {Error} Description of when this function throws an error
 * @example
 * // Example usage
 * const result = ${functionName}(param1, param2);
 * console.log(result);
 */`;
  }

  generateClassJSDoc(className, filePath) {
    return `/**
 * ${className} - Brief description of what this class represents
 * 
 * @description Detailed description of the class's purpose and functionality
 * @class ${className}
 * @example
 * // Example usage
 * const instance = new ${className}();
 * instance.someMethod();
 */`;
  }

  generateConstJSDoc(constName, filePath) {
    return `/**
 * ${constName} - Brief description of what this constant represents
 * 
 * @description Detailed description of the constant's purpose and value
 * @constant {*} ${constName}
 * @example
 * // Example usage
 * console.log(${constName});
 */`;
  }

  async updateReadme() {
    try {
      const readmePath = path.join(projectRoot, 'README.md');
      const readmeContent = await fs.readFile(readmePath, 'utf8');
      
      // Check if API documentation section exists
      if (!readmeContent.includes('## 📚 API Documentation')) {
        const apiDocSection = `

## 📚 API Documentation

Auto-generated API documentation is available in the [docs/api/](docs/api/) directory.

### Quick Links
- [API Reference](docs/api/)
- [Core Functions](docs/api/module-core.html)
- [Platform Builders](docs/api/module-platforms.html)

*Documentation is automatically updated when code changes.*
`;
        
        const updatedContent = readmeContent + apiDocSection;
        await fs.writeFile(readmePath, updatedContent, 'utf8');
        this.log('Updated README.md with API documentation section', 'cyan');
        return true;
      }
      
      return false;
    } catch (error) {
      this.log(`Failed to update README: ${error.message}`, 'red');
      return false;
    }
  }

  async commitChanges() {
    if (!CONFIG.autoCommit.enabled || this.documentedFiles.size === 0) {
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
        this.log('No documentation changes to commit', 'gray');
        return;
      }

      // Add all changes
      await this.execPromise('git add .');
      
      // Create commit message with list of documented files
      const fileList = Array.from(this.documentedFiles)
        .map(f => path.relative(projectRoot, f))
        .join(', ');
      
      const commitMessage = `${CONFIG.autoCommit.commitMessage}\n\nDocumented files: ${fileList}`;
      
      if (CONFIG.autoCommit.dryRun) {
        this.log(`[DRY RUN] Would commit: ${commitMessage}`, 'cyan');
      } else {
        await this.execPromise(`git commit -m "${commitMessage}"`);
        this.commitCount++;
        this.log(`✓ Committed documentation updates (${this.commitCount}/${CONFIG.autoCommit.maxCommitsPerHour} this hour)`, 'green');
      }
      
      // Clear the documented files set
      this.documentedFiles.clear();
      
    } catch (error) {
      this.log(`Failed to commit documentation changes: ${error.message}`, 'red');
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

  debouncedDocument(filePath) {
    // Clear existing timer for this file
    if (this.debounceTimers.has(filePath)) {
      clearTimeout(this.debounceTimers.get(filePath));
    }

    // Set new timer
    const timer = setTimeout(async () => {
      // Add JSDoc comments if needed
      const addedComments = await this.addJSDocComments(filePath);
      
      // Generate JSDoc documentation
      const generatedDocs = await this.generateJSDoc(filePath);
      
      // Update README if needed
      await this.updateReadme();
      
      if (addedComments || generatedDocs) {
        // Wait a bit for file system to settle, then commit
        setTimeout(() => this.commitChanges(), 1000);
      }
      
      this.debounceTimers.delete(filePath);
    }, CONFIG.debounceDelay);

    this.debounceTimers.set(filePath, timer);
  }

  async start() {
    if (this.isRunning) {
      this.log('Documentation agent is already running', 'yellow');
      return;
    }

    this.log('🚀 Starting Documentation Agent...', 'bright');
    this.log('Watching for file changes and auto-generating documentation...', 'cyan');
    
    if (CONFIG.autoCommit.dryRun) {
      this.log('⚠ DRY RUN MODE: No actual commits will be made', 'yellow');
    }

    // Ensure docs directory exists
    await fs.mkdir(path.join(projectRoot, 'docs', 'api'), { recursive: true });

    // Create watcher with chokidar
    this.watcher = chokidar.watch(CONFIG.watchPatterns, {
      cwd: projectRoot,
      ignored: [
        '**/node_modules/**',
        '**/.git/**',
        '**/output/**',
        '**/.next/**',
        '**/coverage/**',
        '**/docs/**'
      ],
      ignoreInitial: true,
      persistent: true
    });

    // Handle file changes
    this.watcher.on('change', (filePath) => {
      const fullPath = path.join(projectRoot, filePath);
      
      if (this.shouldDocumentFile(fullPath)) {
        this.log(`File changed: ${filePath}`, 'magenta');
        this.debouncedDocument(fullPath);
      }
    });

    // Handle errors
    this.watcher.on('error', (error) => {
      this.log(`Watcher error: ${error.message}`, 'red');
    });

    // Handle ready event
    this.watcher.on('ready', () => {
      this.log('✅ Documentation Agent is now active and watching files', 'green');
      this.log('Press Ctrl+C to stop', 'cyan');
    });

    this.isRunning = true;
  }

  stop() {
    if (!this.isRunning) {
      return;
    }

    this.log('🛑 Stopping Documentation Agent...', 'yellow');

    // Clear all debounce timers
    this.debounceTimers.forEach(timer => clearTimeout(timer));
    this.debounceTimers.clear();

    // Close watcher
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }

    this.isRunning = false;
    this.log('✅ Documentation Agent stopped', 'green');
  }
}

// Handle graceful shutdown
const documentationAgent = new DocumentationAgent();

process.on('SIGINT', () => {
  documentationAgent.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  documentationAgent.stop();
  process.exit(0);
});

// Start the documentation agent
documentationAgent.start().catch(error => {
  console.error('Failed to start documentation agent:', error);
  process.exit(1);
});

export default DocumentationAgent;
