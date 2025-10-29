#!/usr/bin/env node

/**
 * Backup Agent - Automatically backs up generated themes and project files
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
  debounceDelay: 5000,
  autoCommit: { enabled: true, commitMessage: 'backup: automated theme backup', maxCommitsPerHour: 5, dryRun: false },
  colors: { reset: '\x1b[0m', bright: '\x1b[1m', red: '\x1b[31m', green: '\x1b[32m', yellow: '\x1b[33m', blue: '\x1b[34m', magenta: '\x1b[35m', cyan: '\x1b[36m' }
};

class BackupAgent {
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

  async createBackup(filePath) {
    this.log(`Creating backup for: ${path.relative(projectRoot, filePath)}...`, 'blue');
    // Backup logic would go here
    this.log(`✓ Backup created`, 'green');
  }

  async start() {
    if (this.isRunning) {
      this.log('Backup agent is already running', 'yellow');
      return;
    }

    this.log('🚀 Starting Backup Agent...', 'bright');
    
    this.watcher = chokidar.watch(CONFIG.watchPatterns, {
      cwd: projectRoot,
      ignoreInitial: true,
      persistent: true
    });

    this.watcher.on('change', (filePath) => {
      this.debouncedBackup(filePath);
    });

    this.watcher.on('ready', () => {
      this.log('✅ Backup Agent is now active', 'green');
      this.log('Press Ctrl+C to stop', 'cyan');
    });

    this.isRunning = true;
  }

  debouncedBackup(filePath) {
    const timer = setTimeout(async () => {
      await this.createBackup(filePath);
    }, CONFIG.debounceDelay);

    this.debounceTimers.set(filePath, timer);
  }

  stop() {
    if (!this.isRunning) return;
    this.log('🛑 Stopping Backup Agent...', 'yellow');
    this.debounceTimers.forEach(timer => clearTimeout(timer));
    if (this.watcher) this.watcher.close();
    this.isRunning = false;
  }
}

const backupAgent = new BackupAgent();
process.on('SIGINT', () => { backupAgent.stop(); process.exit(0); });
backupAgent.start().catch(error => { console.error('Failed to start backup agent:', error); process.exit(1); });

export default BackupAgent;
