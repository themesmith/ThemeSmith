#!/usr/bin/env node

/**
 * Combined Agent - Runs both Lint Agent and Auto-Correction Agent
 * 
 * This script starts both the lint agent and auto-correction agent
 * in a single process for convenience.
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  const timestamp = new Date().toISOString().substr(11, 8);
  console.log(`${colors[color]}[${timestamp}] ${message}${colors.reset}`);
}

class CombinedAgent {
  constructor() {
    this.processes = new Map();
    this.isRunning = false;
  }

  startProcess(name, script) {
    log(`Starting ${name}...`, 'blue');
    
    const process = spawn('node', [script], {
      cwd: projectRoot,
      stdio: 'pipe'
    });

    process.stdout.on('data', (data) => {
      const output = data.toString().trim();
      if (output) {
        console.log(`${colors.cyan}[${name}]${colors.reset} ${output}`);
      }
    });

    process.stderr.on('data', (data) => {
      const output = data.toString().trim();
      if (output) {
        console.log(`${colors.red}[${name}]${colors.reset} ${output}`);
      }
    });

    process.on('close', (code) => {
      if (code !== 0) {
        log(`${name} exited with code ${code}`, 'red');
      } else {
        log(`${name} stopped`, 'yellow');
      }
      this.processes.delete(name);
    });

    process.on('error', (error) => {
      log(`Error starting ${name}: ${error.message}`, 'red');
    });

    this.processes.set(name, process);
    return process;
  }

  async start() {
    if (this.isRunning) {
      log('Combined agent is already running', 'yellow');
      return;
    }

    log('🚀 Starting Combined Agent (Lint + Auto-Correction)...', 'bright');
    log('This will start both the lint agent and auto-correction agent', 'cyan');

    // Start lint agent
    this.startProcess('Lint Agent', path.join(projectRoot, 'lint_agent.js'));

    // Wait a moment, then start auto-correction agent
    setTimeout(() => {
      this.startProcess('Auto-Correction Agent', path.join(projectRoot, 'auto_correction_agent.js'));
    }, 1000);

    this.isRunning = true;
    log('✅ Combined Agent is now active', 'green');
    log('Press Ctrl+C to stop all agents', 'cyan');
  }

  stop() {
    if (!this.isRunning) {
      return;
    }

    log('🛑 Stopping Combined Agent...', 'yellow');

    this.processes.forEach((process, name) => {
      log(`Stopping ${name}...`, 'yellow');
      process.kill('SIGTERM');
    });

    this.processes.clear();
    this.isRunning = false;
    log('✅ Combined Agent stopped', 'green');
  }
}

// Handle graceful shutdown
const combinedAgent = new CombinedAgent();

process.on('SIGINT', () => {
  combinedAgent.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  combinedAgent.stop();
  process.exit(0);
});

// Start the combined agent
combinedAgent.start().catch(error => {
  console.error('Failed to start combined agent:', error);
  process.exit(1);
});

export default CombinedAgent;
