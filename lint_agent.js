#!/usr/bin/env node

/**
 * Lint Agent - Automatically runs linting when files are saved
 * 
 * This script watches for file changes and automatically runs appropriate
 * linting commands based on the file type and location.
 */

import chokidar from 'chokidar';
import { exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

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
  
  // Lint commands for different directories
  lintCommands: {
    'api': 'npm --prefix api run lint',
    'frontend': 'npm --prefix frontend run lint',
    'core': 'npm run lint:api', // Use API linting for core files
    'platforms': 'npm run lint:api', // Use API linting for platform files
    'scripts': 'npm run lint:api' // Use API linting for script files
  },
  
  // Debounce delay (ms) to avoid running lint too frequently
  debounceDelay: 1000,
  
  // Colors for console output
  colors: {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
  }
};

class LintAgent {
  constructor() {
    this.watcher = null;
    this.debounceTimers = new Map();
    this.isRunning = false;
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

  getLintCommand(filePath) {
    const dir = this.getDirectoryFromPath(filePath);
    return CONFIG.lintCommands[dir] || null;
  }

  shouldLintFile(filePath) {
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

  async runLint(filePath) {
    const lintCommand = this.getLintCommand(filePath);
    if (!lintCommand) {
      this.log(`No lint command configured for ${filePath}`, 'yellow');
      return;
    }

    this.log(`Running lint for ${path.relative(projectRoot, filePath)}...`, 'blue');
    
    return new Promise((resolve) => {
      exec(lintCommand, { cwd: projectRoot }, (error, stdout, stderr) => {
        if (error) {
          this.log(`Lint errors in ${path.relative(projectRoot, filePath)}:`, 'red');
          console.log(stderr || stdout);
        } else {
          this.log(`✓ Lint passed for ${path.relative(projectRoot, filePath)}`, 'green');
        }
        resolve();
      });
    });
  }

  debouncedLint(filePath) {
    // Clear existing timer for this file
    if (this.debounceTimers.has(filePath)) {
      clearTimeout(this.debounceTimers.get(filePath));
    }

    // Set new timer
    const timer = setTimeout(async () => {
      await this.runLint(filePath);
      this.debounceTimers.delete(filePath);
    }, CONFIG.debounceDelay);

    this.debounceTimers.set(filePath, timer);
  }

  async start() {
    if (this.isRunning) {
      this.log('Lint agent is already running', 'yellow');
      return;
    }

    this.log('🚀 Starting Lint Agent...', 'bright');
    this.log('Watching for file changes and auto-linting...', 'cyan');

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
      
      if (this.shouldLintFile(fullPath)) {
        this.log(`File changed: ${filePath}`, 'magenta');
        this.debouncedLint(fullPath);
      }
    });

    // Handle errors
    this.watcher.on('error', (error) => {
      this.log(`Watcher error: ${error.message}`, 'red');
    });

    // Handle ready event
    this.watcher.on('ready', () => {
      this.log('✅ Lint Agent is now active and watching files', 'green');
      this.log('Press Ctrl+C to stop', 'cyan');
    });

    this.isRunning = true;
  }

  stop() {
    if (!this.isRunning) {
      return;
    }

    this.log('🛑 Stopping Lint Agent...', 'yellow');

    // Clear all debounce timers
    this.debounceTimers.forEach(timer => clearTimeout(timer));
    this.debounceTimers.clear();

    // Close watcher
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }

    this.isRunning = false;
    this.log('✅ Lint Agent stopped', 'green');
  }
}

// Handle graceful shutdown
const lintAgent = new LintAgent();

process.on('SIGINT', () => {
  lintAgent.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  lintAgent.stop();
  process.exit(0);
});

// Start the lint agent
lintAgent.start().catch(error => {
  console.error('Failed to start lint agent:', error);
  process.exit(1);
});

export default LintAgent;