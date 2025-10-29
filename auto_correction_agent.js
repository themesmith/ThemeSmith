#!/usr/bin/env node

/**
 * Auto-Correction Agent - Automatically fixes linting errors and commits changes
 * 
 * This script watches for linting errors and automatically applies fixes,
 * then commits the corrected code to the repository.
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
    'frontend/**/*.{js,jsx}',
    'core/**/*.js',
    'platforms/**/*.js',
    'scripts/**/*.js'
  ],
  
  // Fix commands for different directories
  fixCommands: {
    'api': 'npm --prefix api run lint:fix',
    'frontend': 'npm --prefix frontend run lint:fix',
    'core': 'npm run lint:fix:api',
    'platforms': 'npm run lint:fix:api',
    'scripts': 'npm run lint:fix:api'
  },
  
  // Debounce delay (ms) to avoid running fixes too frequently
  debounceDelay: 2000,
  
  // Auto-commit settings
  autoCommit: {
    enabled: true,
    commitMessage: 'fix: auto-correct linting errors',
    maxCommitsPerHour: 10, // Prevent spam commits
    dryRun: false // Set to true to see what would be committed without actually committing
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

class AutoCorrectionAgent {
  constructor() {
    this.watcher = null;
    this.debounceTimers = new Map();
    this.isRunning = false;
    this.commitCount = 0;
    this.lastCommitReset = Date.now();
    this.fixedFiles = new Set();
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

  getFixCommand(filePath) {
    const dir = this.getDirectoryFromPath(filePath);
    return CONFIG.fixCommands[dir] || null;
  }

  shouldFixFile(filePath) {
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

  async checkLintErrors(filePath) {
    const dir = this.getDirectoryFromPath(filePath);
    const lintCommand = dir === 'frontend' 
      ? 'npm --prefix frontend run lint'
      : 'npm --prefix api run lint';
    
    return new Promise((resolve) => {
      exec(lintCommand, { cwd: projectRoot }, (error, stdout, stderr) => {
        // If there's an error, there are likely lint issues
        resolve(error !== null);
      });
    });
  }

  async runFix(filePath) {
    const fixCommand = this.getFixCommand(filePath);
    if (!fixCommand) {
      this.log(`No fix command configured for ${filePath}`, 'yellow');
      return false;
    }

    this.log(`Running auto-fix for ${path.relative(projectRoot, filePath)}...`, 'blue');
    
    return new Promise((resolve) => {
      exec(fixCommand, { cwd: projectRoot }, async (error, stdout, stderr) => {
        if (error) {
          this.log(`Fix command failed for ${path.relative(projectRoot, filePath)}:`, 'red');
          console.log(stderr || stdout);
          resolve(false);
        } else {
          this.log(`✓ Auto-fix applied for ${path.relative(projectRoot, filePath)}`, 'green');
          
          // Check if there are still lint errors after fix
          const stillHasErrors = await this.checkLintErrors(filePath);
          if (!stillHasErrors) {
            this.fixedFiles.add(filePath);
            this.log(`✓ All lint errors resolved for ${path.relative(projectRoot, filePath)}`, 'green');
            resolve(true);
          } else {
            this.log(`⚠ Some lint errors remain for ${path.relative(projectRoot, filePath)}`, 'yellow');
            resolve(false);
          }
        }
      });
    });
  }

  async commitChanges() {
    if (!CONFIG.autoCommit.enabled || this.fixedFiles.size === 0) {
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
        this.log('No changes to commit', 'gray');
        return;
      }

      // Add all changes
      await this.execPromise('git add .');
      
      // Create commit message with list of fixed files
      const fileList = Array.from(this.fixedFiles)
        .map(f => path.relative(projectRoot, f))
        .join(', ');
      
      const commitMessage = `${CONFIG.autoCommit.commitMessage}\n\nFixed files: ${fileList}`;
      
      if (CONFIG.autoCommit.dryRun) {
        this.log(`[DRY RUN] Would commit: ${commitMessage}`, 'cyan');
      } else {
        await this.execPromise(`git commit -m "${commitMessage}"`);
        this.commitCount++;
        this.log(`✓ Committed auto-fixes (${this.commitCount}/${CONFIG.autoCommit.maxCommitsPerHour} this hour)`, 'green');
      }
      
      // Clear the fixed files set
      this.fixedFiles.clear();
      
    } catch (error) {
      this.log(`Failed to commit changes: ${error.message}`, 'red');
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

  debouncedFix(filePath) {
    // Clear existing timer for this file
    if (this.debounceTimers.has(filePath)) {
      clearTimeout(this.debounceTimers.get(filePath));
    }

    // Set new timer
    const timer = setTimeout(async () => {
      const hasErrors = await this.checkLintErrors(filePath);
      if (hasErrors) {
        const fixed = await this.runFix(filePath);
        if (fixed) {
          // Wait a bit for file system to settle, then commit
          setTimeout(() => this.commitChanges(), 1000);
        }
      }
      this.debounceTimers.delete(filePath);
    }, CONFIG.debounceDelay);

    this.debounceTimers.set(filePath, timer);
  }

  async start() {
    if (this.isRunning) {
      this.log('Auto-correction agent is already running', 'yellow');
      return;
    }

    this.log('🚀 Starting Auto-Correction Agent...', 'bright');
    this.log('Watching for linting errors and auto-fixing...', 'cyan');
    
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
      
      if (this.shouldFixFile(fullPath)) {
        this.log(`File changed: ${filePath}`, 'magenta');
        this.debouncedFix(fullPath);
      }
    });

    // Handle errors
    this.watcher.on('error', (error) => {
      this.log(`Watcher error: ${error.message}`, 'red');
    });

    // Handle ready event
    this.watcher.on('ready', () => {
      this.log('✅ Auto-Correction Agent is now active and watching files', 'green');
      this.log('Press Ctrl+C to stop', 'cyan');
    });

    this.isRunning = true;
  }

  stop() {
    if (!this.isRunning) {
      return;
    }

    this.log('🛑 Stopping Auto-Correction Agent...', 'yellow');

    // Clear all debounce timers
    this.debounceTimers.forEach(timer => clearTimeout(timer));
    this.debounceTimers.clear();

    // Close watcher
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }

    this.isRunning = false;
    this.log('✅ Auto-Correction Agent stopped', 'green');
  }
}

// Handle graceful shutdown
const autoCorrectionAgent = new AutoCorrectionAgent();

process.on('SIGINT', () => {
  autoCorrectionAgent.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  autoCorrectionAgent.stop();
  process.exit(0);
});

// Start the auto-correction agent
autoCorrectionAgent.start().catch(error => {
  console.error('Failed to start auto-correction agent:', error);
  process.exit(1);
});

export default AutoCorrectionAgent;
