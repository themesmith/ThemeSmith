#!/usr/bin/env node

/**
 * Changelog Agent - Automatically generates and updates CHANGELOG.md
 */

import { exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const CONFIG = {
  autoCommit: { enabled: true, commitMessage: 'changelog: auto-generated changelog updates', maxCommitsPerHour: 5, dryRun: false },
  colors: { reset: '\x1b[0m', bright: '\x1b[1m', red: '\x1b[31m', green: '\x1b[32m', yellow: '\x1b[33m', blue: '\x1b[34m', magenta: '\x1b[35m', cyan: '\x1b[36m' }
};

class ChangelogAgent {
  constructor() {
    this.isRunning = false;
    this.commitCount = 0;
    this.lastCommitReset = Date.now();
  }

  log(message, color = 'reset') {
    const timestamp = new Date().toISOString().substr(11, 8);
    console.log(`${CONFIG.colors[color]}[${timestamp}] ${message}${CONFIG.colors.reset}`);
  }

  async generateChangelog() {
    this.log('Generating changelog...', 'blue');
    
    return new Promise((resolve) => {
      exec('npm run changelog', { cwd: projectRoot }, (error, stdout, stderr) => {
        if (error) {
          this.log(`Changelog generation failed: ${error.message}`, 'red');
          resolve(false);
        } else {
          this.log(`✓ Changelog generated`, 'green');
          resolve(true);
        }
      });
    });
  }

  async start() {
    if (this.isRunning) {
      this.log('Changelog agent is already running', 'yellow');
      return;
    }

    this.log('🚀 Starting Changelog Agent...', 'bright');
    
    // Generate changelog periodically
    this.interval = setInterval(async () => {
      await this.generateChangelog();
    }, 3600000); // Every hour

    this.log('✅ Changelog Agent is now active', 'green');
    this.log('Press Ctrl+C to stop', 'cyan');
    
    this.isRunning = true;
  }

  stop() {
    if (!this.isRunning) return;
    this.log('🛑 Stopping Changelog Agent...', 'yellow');
    if (this.interval) clearInterval(this.interval);
    this.isRunning = false;
    this.log('✅ Changelog Agent stopped', 'green');
  }
}

const changelogAgent = new ChangelogAgent();
process.on('SIGINT', () => { changelogAgent.stop(); process.exit(0); });
changelogAgent.start().catch(error => { console.error('Failed to start changelog agent:', error); process.exit(1); });

export default ChangelogAgent;
