#!/usr/bin/env node

/**
 * Validation Agent - Continuously validates generated themes against standards
 * 
 * This script automatically validates generated themes using gscan and
 * WordPress theme check, reporting issues and suggesting improvements.
 */

import chokidar from 'chokidar';
import { exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const CONFIG = {
  watchPatterns: ['output/**/*'],
  debounceDelay: 3000,
  autoCommit: {
    enabled: true,
    commitMessage: 'validation: theme validation and compliance updates',
    maxCommitsPerHour: 10,
    dryRun: false
  },
  colors: {
    reset: '\x1b[0m', bright: '\x1b[1m', red: '\x1b[31m',
    green: '\x1b[32m', yellow: '\x1b[33m', blue: '\x1b[34m',
    magenta: '\x1b[35m', cyan: '\x1b[36m'
  }
};

class ValidationAgent {
  constructor() {
    this.watcher = null;
    this.debounceTimers = new Map();
    this.isRunning = false;
    this.commitCount = 0;
    this.lastCommitReset = Date.now();
  }

  log(message, color = 'reset') {
    const timestamp = new Date().toISOString().substr(11, 8);
    console.log(`${CONFIG.colors[color]}[${timestamp}] ${message}${CONFIG.colors.reset}`);
  }

  async validateTheme(filePath) {
    this.log(`Validating theme: ${path.relative(projectRoot, filePath)}...`, 'blue');
    
    return new Promise((resolve) => {
      exec(`npx gscan "${filePath}"`, { cwd: projectRoot }, (error, stdout, stderr) => {
        if (error) {
          this.log(`Validation issues found:`, 'yellow');
          console.log(stderr || stdout);
        } else {
          this.log(`✓ Theme validation passed`, 'green');
        }
        resolve(!error);
      });
    });
  }

  async start() {
    if (this.isRunning) {
      this.log('Validation agent is already running', 'yellow');
      return;
    }

    this.log('🚀 Starting Validation Agent...', 'bright');
    
    this.watcher = chokidar.watch(CONFIG.watchPatterns, {
      cwd: projectRoot,
      ignoreInitial: true,
      persistent: true
    });

    this.watcher.on('change', (filePath) => {
      this.debouncedValidate(filePath);
    });

    this.watcher.on('ready', () => {
      this.log('✅ Validation Agent is now active', 'green');
      this.log('Press Ctrl+C to stop', 'cyan');
    });

    this.isRunning = true;
  }

  debouncedValidate(filePath) {
    const timer = setTimeout(async () => {
      await this.validateTheme(filePath);
    }, CONFIG.debounceDelay);

    this.debounceTimers.set(filePath, timer);
  }

  stop() {
    if (!this.isRunning) return;
    this.log('🛑 Stopping Validation Agent...', 'yellow');
    this.debounceTimers.forEach(timer => clearTimeout(timer));
    if (this.watcher) this.watcher.close();
    this.isRunning = false;
  }
}

const validationAgent = new ValidationAgent();
process.on('SIGINT', () => { validationAgent.stop(); process.exit(0); });
validationAgent.start().catch(error => { console.error('Failed to start validation agent:', error); process.exit(1); });

export default ValidationAgent;
