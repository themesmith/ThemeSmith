#!/usr/bin/env node

/**
 * Complexity Agent - Monitors code complexity and suggests refactoring
 */

import chokidar from 'chokidar';
import { exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const CONFIG = {
  watchPatterns: ['api/**/*.js', 'core/**/*.js', 'platforms/**/*.js'],
  debounceDelay: 2000,
  autoCommit: { enabled: true, commitMessage: 'refactor: complexity improvements', maxCommitsPerHour: 10, dryRun: false },
  colors: { reset: '\x1b[0m', bright: '\x1b[1m', red: '\x1b[31m', green: '\x1b[32m', yellow: '\x1b[33m', blue: '\x1b[34m', magenta: '\x1b[35m', cyan: '\x1b[36m' }
};

class ComplexityAgent {
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

  async analyzeComplexity(filePath) {
    this.log(`Analyzing complexity: ${filePath}...`, 'blue');
    
    return new Promise((resolve) => {
      exec(`npm run lint:api`, { cwd: projectRoot }, (error, stdout, stderr) => {
        if (error) this.log(`Complexity issues found`, 'yellow');
        else this.log(`✓ Complexity acceptable`, 'green');
        resolve(!error);
      });
    });
  }

  async start() {
    if (this.isRunning) {
      this.log('Complexity agent is already running', 'yellow');
      return;
    }

    this.log('🚀 Starting Complexity Agent...', 'bright');
    
    this.watcher = chokidar.watch(CONFIG.watchPatterns, {
      cwd: projectRoot,
      ignoreInitial: true,
      persistent: true
    });

    this.watcher.on('change', (filePath) => {
      this.debouncedAnalyze(filePath);
    });

    this.watcher.on('ready', () => {
      this.log('✅ Complexity Agent is now active', 'green');
      this.log('Press Ctrl+C to stop', 'cyan');
    });

    this.isRunning = true;
  }

  debouncedAnalyze(filePath) {
    const timer = setTimeout(async () => {
      await this.analyzeComplexity(filePath);
    }, CONFIG.debounceDelay);

    this.debounceTimers.set(filePath, timer);
  }

  stop() {
    if (!this.isRunning) return;
    this.log('🛑 Stopping Complexity Agent...', 'yellow');
    this.debounceTimers.forEach(timer => clearTimeout(timer));
    if (this.watcher) this.watcher.close();
    this.isRunning = false;
  }
}

const complexityAgent = new ComplexityAgent();
process.on('SIGINT', () => { complexityAgent.stop(); process.exit(0); });
complexityAgent.start().catch(error => { console.error('Failed to start complexity agent:', error); process.exit(1); });

export default ComplexityAgent;
