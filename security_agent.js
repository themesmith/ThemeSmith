#!/usr/bin/env node

/**
 * Security Agent - Monitors dependencies for vulnerabilities and auto-updates
 * 
 * This script watches for dependency changes and automatically runs security audits,
 * checks for outdated packages, and updates non-breaking security patches.
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
    'package.json',
    'package-lock.json',
    'api/package.json',
    'api/package-lock.json',
    'frontend/package.json',
    'frontend/package-lock.json'
  ],
  
  // Security commands
  securityCommands: {
    'root': 'npm audit --audit-level=moderate',
    'api': 'npm --prefix api audit --audit-level=moderate',
    'frontend': 'npm --prefix frontend audit --audit-level=moderate'
  },
  
  // Update commands
  updateCommands: {
    'root': 'npm update',
    'api': 'npm --prefix api update',
    'frontend': 'npm --prefix frontend update'
  },
  
  // Check outdated packages
  outdatedCommands: {
    'root': 'npm outdated',
    'api': 'npm --prefix api outdated',
    'frontend': 'npm --prefix frontend outdated'
  },
  
  // Debounce delay (ms) to avoid running security checks too frequently
  debounceDelay: 5000,
  
  // Auto-commit settings
  autoCommit: {
    enabled: true,
    commitMessage: 'security: auto-updated dependencies and security patches',
    maxCommitsPerHour: 5, // Lower limit for security updates
    dryRun: false
  },
  
  // Security update settings
  securityUpdate: {
    enabled: true,
    autoUpdateMinor: true,
    autoUpdatePatch: true,
    autoUpdateSecurity: true,
    requireApproval: false
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

class SecurityAgent {
  constructor() {
    this.watcher = null;
    this.debounceTimers = new Map();
    this.isRunning = false;
    this.commitCount = 0;
    this.lastCommitReset = Date.now();
    this.updatedPackages = new Set();
    this.securityIssues = new Map();
  }

  log(message, color = 'reset') {
    const timestamp = new Date().toISOString().substr(11, 8);
    console.log(`${CONFIG.colors[color]}[${timestamp}] ${message}${CONFIG.colors.reset}`);
  }

  getDirectoryFromPath(filePath) {
    const relativePath = path.relative(projectRoot, filePath);
    const parts = relativePath.split(path.sep);
    return parts[0] || 'root';
  }

  getSecurityCommand(filePath) {
    const dir = this.getDirectoryFromPath(filePath);
    return CONFIG.securityCommands[dir] || CONFIG.securityCommands.root;
  }

  getUpdateCommand(filePath) {
    const dir = this.getDirectoryFromPath(filePath);
    return CONFIG.updateCommands[dir] || CONFIG.updateCommands.root;
  }

  getOutdatedCommand(filePath) {
    const dir = this.getDirectoryFromPath(filePath);
    return CONFIG.outdatedCommands[dir] || CONFIG.outdatedCommands.root;
  }

  shouldCheckSecurity(filePath) {
    const relativePath = path.relative(projectRoot, filePath);
    
    // Check if file matches watch patterns
    return CONFIG.watchPatterns.some(pattern => {
      const regex = pattern
        .replace(/\*\*/g, '.*')
        .replace(/\*/g, '[^/]*');
      return new RegExp(`^${regex}$`).test(relativePath);
    });
  }

  async runSecurityAudit(filePath) {
    const securityCommand = this.getSecurityCommand(filePath);
    this.log(`Running security audit for ${path.relative(projectRoot, filePath)}...`, 'blue');
    
    return new Promise((resolve) => {
      exec(securityCommand, { cwd: projectRoot }, (error, stdout, stderr) => {
        if (error) {
          this.log(`Security issues found in ${path.relative(projectRoot, filePath)}:`, 'red');
          console.log(stderr || stdout);
          this.parseSecurityIssues(stderr || stdout, filePath);
          resolve(false);
        } else {
          this.log(`✓ No security issues found in ${path.relative(projectRoot, filePath)}`, 'green');
          resolve(true);
        }
      });
    });
  }

  parseSecurityIssues(output, filePath) {
    const lines = output.split('\n');
    const issues = [];
    
    lines.forEach(line => {
      if (line.includes('vulnerabilities found') || line.includes('vulnerability')) {
        const match = line.match(/(\d+)\s+(high|moderate|low|critical)/);
        if (match) {
          issues.push({
            count: parseInt(match[1]),
            severity: match[2],
            file: path.relative(projectRoot, filePath)
          });
        }
      }
    });
    
    if (issues.length > 0) {
      this.securityIssues.set(filePath, issues);
    }
  }

  async checkOutdatedPackages(filePath) {
    const outdatedCommand = this.getOutdatedCommand(filePath);
    this.log(`Checking outdated packages for ${path.relative(projectRoot, filePath)}...`, 'cyan');
    
    return new Promise((resolve) => {
      exec(outdatedCommand, { cwd: projectRoot }, (error, stdout, stderr) => {
        if (error && error.code !== 1) { // npm outdated returns code 1 when packages are outdated
          this.log(`Failed to check outdated packages: ${error.message}`, 'red');
          resolve(false);
        } else {
          if (stdout.trim()) {
            this.log(`Outdated packages found in ${path.relative(projectRoot, filePath)}:`, 'yellow');
            console.log(stdout);
            this.parseOutdatedPackages(stdout, filePath);
          } else {
            this.log(`✓ All packages up to date in ${path.relative(projectRoot, filePath)}`, 'green');
          }
          resolve(true);
        }
      });
    });
  }

  parseOutdatedPackages(output, filePath) {
    const lines = output.split('\n');
    const outdated = [];
    
    lines.forEach(line => {
      if (line.includes('Package') && line.includes('Current') && line.includes('Wanted')) {
        return; // Skip header
      }
      
      const parts = line.trim().split(/\s+/);
      if (parts.length >= 4) {
        outdated.push({
          package: parts[0],
          current: parts[1],
          wanted: parts[2],
          latest: parts[3],
          file: path.relative(projectRoot, filePath)
        });
      }
    });
    
    if (outdated.length > 0) {
      this.updatedPackages.add(filePath);
    }
  }

  async updatePackages(filePath) {
    if (!CONFIG.securityUpdate.enabled) return false;

    const updateCommand = this.getUpdateCommand(filePath);
    this.log(`Updating packages for ${path.relative(projectRoot, filePath)}...`, 'magenta');
    
    return new Promise((resolve) => {
      exec(updateCommand, { cwd: projectRoot }, (error, stdout, stderr) => {
        if (error) {
          this.log(`Package update failed for ${path.relative(projectRoot, filePath)}:`, 'red');
          console.log(stderr || stdout);
          resolve(false);
        } else {
          this.log(`✓ Packages updated for ${path.relative(projectRoot, filePath)}`, 'green');
          console.log(stdout);
          this.updatedPackages.add(filePath);
          resolve(true);
        }
      });
    });
  }

  async generateSecurityReport() {
    try {
      const reportPath = path.join(projectRoot, 'security-audit.log');
      const timestamp = new Date().toISOString();
      
      let report = `# Security Audit Report\n`;
      report += `Generated: ${timestamp}\n\n`;
      
      if (this.securityIssues.size > 0) {
        report += `## Security Vulnerabilities\n\n`;
        this.securityIssues.forEach((issues, filePath) => {
          report += `### ${filePath}\n`;
          issues.forEach(issue => {
            report += `- ${issue.count} ${issue.severity} vulnerabilities\n`;
          });
          report += `\n`;
        });
      }
      
      if (this.updatedPackages.size > 0) {
        report += `## Updated Packages\n\n`;
        this.updatedPackages.forEach(filePath => {
          report += `- ${filePath}\n`;
        });
        report += `\n`;
      }
      
      report += `## Recommendations\n\n`;
      report += `1. Review and test all package updates\n`;
      report += `2. Address any remaining security vulnerabilities\n`;
      report += `3. Consider updating to latest versions for better security\n`;
      
      await fs.writeFile(reportPath, report, 'utf8');
      this.log(`Security report generated: ${path.relative(projectRoot, reportPath)}`, 'cyan');
      
    } catch (error) {
      this.log(`Failed to generate security report: ${error.message}`, 'red');
    }
  }

  async commitChanges() {
    if (!CONFIG.autoCommit.enabled || this.updatedPackages.size === 0) {
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
        this.log('No security changes to commit', 'gray');
        return;
      }

      // Add all changes
      await this.execPromise('git add .');
      
      // Create commit message with list of updated files
      const fileList = Array.from(this.updatedPackages)
        .map(f => path.relative(projectRoot, f))
        .join(', ');
      
      const commitMessage = `${CONFIG.autoCommit.commitMessage}\n\nUpdated files: ${fileList}`;
      
      if (CONFIG.autoCommit.dryRun) {
        this.log(`[DRY RUN] Would commit: ${commitMessage}`, 'cyan');
      } else {
        await this.execPromise(`git commit -m "${commitMessage}"`);
        this.commitCount++;
        this.log(`✓ Committed security updates (${this.commitCount}/${CONFIG.autoCommit.maxCommitsPerHour} this hour)`, 'green');
      }
      
      // Clear the updated packages set
      this.updatedPackages.clear();
      
    } catch (error) {
      this.log(`Failed to commit security changes: ${error.message}`, 'red');
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

  debouncedSecurityCheck(filePath) {
    // Clear existing timer for this file
    if (this.debounceTimers.has(filePath)) {
      clearTimeout(this.debounceTimers.get(filePath));
    }

    // Set new timer
    const timer = setTimeout(async () => {
      // Run security audit
      const hasIssues = !(await this.runSecurityAudit(filePath));
      
      // Check for outdated packages
      await this.checkOutdatedPackages(filePath);
      
      // Update packages if needed and enabled
      if (CONFIG.securityUpdate.enabled) {
        await this.updatePackages(filePath);
      }
      
      // Generate security report
      await this.generateSecurityReport();
      
      // Wait a bit for file system to settle, then commit
      setTimeout(() => this.commitChanges(), 2000);
      
      this.debounceTimers.delete(filePath);
    }, CONFIG.debounceDelay);

    this.debounceTimers.set(filePath, timer);
  }

  async start() {
    if (this.isRunning) {
      this.log('Security agent is already running', 'yellow');
      return;
    }

    this.log('🚀 Starting Security Agent...', 'bright');
    this.log('Watching for dependency changes and monitoring security...', 'cyan');
    
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
      
      if (this.shouldCheckSecurity(fullPath)) {
        this.log(`Dependency file changed: ${filePath}`, 'magenta');
        this.debouncedSecurityCheck(fullPath);
      }
    });

    // Handle errors
    this.watcher.on('error', (error) => {
      this.log(`Watcher error: ${error.message}`, 'red');
    });

    // Handle ready event
    this.watcher.on('ready', () => {
      this.log('✅ Security Agent is now active and watching files', 'green');
      this.log('Press Ctrl+C to stop', 'cyan');
    });

    this.isRunning = true;
  }

  stop() {
    if (!this.isRunning) {
      return;
    }

    this.log('🛑 Stopping Security Agent...', 'yellow');

    // Clear all debounce timers
    this.debounceTimers.forEach(timer => clearTimeout(timer));
    this.debounceTimers.clear();

    // Close watcher
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }

    this.isRunning = false;
    this.log('✅ Security Agent stopped', 'green');
  }
}

// Handle graceful shutdown
const securityAgent = new SecurityAgent();

process.on('SIGINT', () => {
  securityAgent.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  securityAgent.stop();
  process.exit(0);
});

// Start the security agent
securityAgent.start().catch(error => {
  console.error('Failed to start security agent:', error);
  process.exit(1);
});

export default SecurityAgent;
