#!/usr/bin/env node

/**
 * Performance Agent - Tracks build times, bundle sizes, and performance metrics
 * 
 * This script monitors performance metrics including build times, bundle sizes,
 * theme generation speed, and alerts on performance regressions.
 */

import chokidar from 'chokidar';
import { exec } from 'child_process';
import { performance } from 'perf_hooks';
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
    'frontend/**/*.{js,jsx}'
  ],
  
  // Performance check intervals (ms)
  checkInterval: 300000, // 5 minutes
  
  // Debounce delay (ms) to avoid running checks too frequently
  debounceDelay: 2000,
  
  // Auto-commit settings
  autoCommit: {
    enabled: true,
    commitMessage: 'perf: performance metrics and optimization updates',
    maxCommitsPerHour: 10,
    dryRun: false
  },
  
  // Performance thresholds
  thresholds: {
    frontendBuildTime: 60000,    // 60 seconds
    frontendBundleSize: 1000000, // 1MB
    themeGenerationTime: 5000,   // 5 seconds
    apiResponseTime: 1000        // 1 second
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

class PerformanceAgent {
  constructor() {
    this.watcher = null;
    this.debounceTimers = new Map();
    this.isRunning = false;
    this.commitCount = 0;
    this.lastCommitReset = Date.now();
    this.performanceData = new Map();
    this.metrics = {
      buildTimes: [],
      bundleSizes: [],
      generationTimes: [],
      responseTimes: []
    };
  }

  log(message, color = 'reset') {
    const timestamp = new Date().toISOString().substr(11, 8);
    console.log(`${CONFIG.colors[color]}[${timestamp}] ${message}${CONFIG.colors.reset}`);
  }

  async measureBuildTime() {
    this.log('Measuring frontend build time...', 'blue');
    
    const startTime = performance.now();
    
    try {
      await this.execPromise('npm --prefix frontend run build');
      const endTime = performance.now();
      const buildTime = endTime - startTime;
      
      this.metrics.buildTimes.push(buildTime);
      
      if (buildTime > CONFIG.thresholds.frontendBuildTime) {
        this.log(`⚠ Build time exceeded threshold: ${buildTime}ms > ${CONFIG.thresholds.frontendBuildTime}ms`, 'yellow');
      } else {
        this.log(`✓ Build time: ${buildTime.toFixed(2)}ms`, 'green');
      }
      
      return buildTime;
    } catch (error) {
      this.log(`Failed to measure build time: ${error.message}`, 'red');
      return null;
    }
  }

  async measureBundleSize() {
    this.log('Measuring bundle size...', 'blue');
    
    try {
      const buildDir = path.join(projectRoot, 'frontend', '.next');
      const files = await this.getDirectorySize(buildDir);
      
      const totalSize = files.reduce((sum, file) => sum + file.size, 0);
      this.metrics.bundleSizes.push(totalSize);
      
      if (totalSize > CONFIG.thresholds.frontendBundleSize) {
        this.log(`⚠ Bundle size exceeded threshold: ${(totalSize / 1024 / 1024).toFixed(2)}MB > ${(CONFIG.thresholds.frontendBundleSize / 1024 / 1024).toFixed(2)}MB`, 'yellow');
      } else {
        this.log(`✓ Bundle size: ${(totalSize / 1024 / 1024).toFixed(2)}MB`, 'green');
      }
      
      return totalSize;
    } catch (error) {
      this.log(`Failed to measure bundle size: ${error.message}`, 'red');
      return null;
    }
  }

  async getDirectorySize(dirPath) {
    const files = [];
    
    async function readDir(dir) {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          await readDir(fullPath);
        } else {
          const stats = await fs.stat(fullPath);
          files.push({ path: fullPath, size: stats.size });
        }
      }
    }
    
    await readDir(dirPath);
    return files;
  }

  async measureThemeGeneration() {
    this.log('Measuring theme generation time...', 'blue');
    
    const startTime = performance.now();
    
    try {
      await this.execPromise('node scripts/build-theme.mjs');
      const endTime = performance.now();
      const generationTime = endTime - startTime;
      
      this.metrics.generationTimes.push(generationTime);
      
      if (generationTime > CONFIG.thresholds.themeGenerationTime) {
        this.log(`⚠ Theme generation time exceeded threshold: ${generationTime}ms > ${CONFIG.thresholds.themeGenerationTime}ms`, 'yellow');
      } else {
        this.log(`✓ Theme generation time: ${generationTime.toFixed(2)}ms`, 'green');
      }
      
      return generationTime;
    } catch (error) {
      this.log(`Failed to measure theme generation time: ${error.message}`, 'red');
      return null;
    }
  }

  async analyzePerformance() {
    this.log('Analyzing performance metrics...', 'cyan');
    
    const buildTime = await this.measureBuildTime();
    const bundleSize = await this.measureBundleSize();
    const generationTime = await this.measureThemeGeneration();
    
    const report = {
      timestamp: new Date().toISOString(),
      buildTime: buildTime,
      bundleSize: bundleSize,
      generationTime: generationTime,
      thresholds: CONFIG.thresholds
    };
    
    this.performanceData.set(Date.now(), report);
    await this.saveMetrics();
    
    return report;
  }

  async saveMetrics() {
    try {
      const metricsPath = path.join(projectRoot, 'performance-metrics.json');
      const metrics = {
        lastUpdated: new Date().toISOString(),
        buildTimes: this.metrics.buildTimes.slice(-20), // Keep last 20
        bundleSizes: this.metrics.bundleSizes.slice(-20),
        generationTimes: this.metrics.generationTimes.slice(-20),
        averages: {
          buildTime: this.getAverage(this.metrics.buildTimes),
          bundleSize: this.getAverage(this.metrics.bundleSizes),
          generationTime: this.getAverage(this.metrics.generationTimes)
        }
      };
      
      await fs.writeFile(metricsPath, JSON.stringify(metrics, null, 2), 'utf8');
      this.log(`Performance metrics saved`, 'cyan');
      
    } catch (error) {
      this.log(`Failed to save metrics: ${error.message}`, 'red');
    }
  }

  getAverage(array) {
    if (array.length === 0) return 0;
    return array.reduce((sum, val) => sum + val, 0) / array.length;
  }

  detectPerformanceRegression(recent, previous) {
    const regressions = [];
    
    if (recent.buildTime > previous.buildTime * 1.2) {
      regressions.push({
        metric: 'buildTime',
        change: ((recent.buildTime - previous.buildTime) / previous.buildTime * 100).toFixed(2) + '%',
        impact: 'high'
      });
    }
    
    if (recent.bundleSize > previous.bundleSize * 1.2) {
      regressions.push({
        metric: 'bundleSize',
        change: ((recent.bundleSize - previous.bundleSize) / previous.bundleSize * 100).toFixed(2) + '%',
        impact: 'high'
      });
    }
    
    if (recent.generationTime > previous.generationTime * 1.2) {
      regressions.push({
        metric: 'generationTime',
        change: ((recent.generationTime - previous.generationTime) / previous.generationTime * 100).toFixed(2) + '%',
        impact: 'medium'
      });
    }
    
    return regressions;
  }

  async commitChanges() {
    if (!CONFIG.autoCommit.enabled) return;

    // Reset commit count every hour
    const now = Date.now();
    if (now - this.lastCommitReset > 3600000) {
      this.commitCount = 0;
      this.lastCommitReset = now;
    }

    // Check commit rate limit
    if (this.commitCount >= CONFIG.autoCommit.maxCommitsPerHour) {
      this.log(`⚠ Commit rate limit reached (${CONFIG.autoCommit.maxCommitsPerHour}/hour)`, 'yellow');
      return;
    }

    try {
      const { stdout } = await this.execPromise('git status --porcelain');
      if (!stdout.trim()) {
        this.log('No performance changes to commit', 'gray');
        return;
      }

      await this.execPromise('git add performance-metrics.json');
      
      const commitMessage = CONFIG.autoCommit.commitMessage;
      
      if (CONFIG.autoCommit.dryRun) {
        this.log(`[DRY RUN] Would commit: ${commitMessage}`, 'cyan');
      } else {
        await this.execPromise(`git commit -m "${commitMessage}"`);
        this.commitCount++;
        this.log(`✓ Committed performance updates (${this.commitCount}/${CONFIG.autoCommit.maxCommitsPerHour} this hour)`, 'green');
      }
      
    } catch (error) {
      this.log(`Failed to commit performance changes: ${error.message}`, 'red');
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

  debouncedPerformanceCheck(filePath) {
    if (this.debounceTimers.has(filePath)) {
      clearTimeout(this.debounceTimers.get(filePath));
    }

    const timer = setTimeout(async () => {
      await this.analyzePerformance();
      
      setTimeout(() => this.commitChanges(), 2000);
      
      this.debounceTimers.delete(filePath);
    }, CONFIG.debounceDelay);

    this.debounceTimers.set(filePath, timer);
  }

  async start() {
    if (this.isRunning) {
      this.log('Performance agent is already running', 'yellow');
      return;
    }

    this.log('🚀 Starting Performance Agent...', 'bright');
    this.log('Monitoring performance metrics...', 'cyan');
    
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
      this.log(`File changed: ${filePath}`, 'magenta');
      this.debouncedPerformanceCheck(fullPath);
    });

    // Periodic performance checks
    this.performanceInterval = setInterval(async () => {
      await this.analyzePerformance();
    }, CONFIG.checkInterval);

    this.watcher.on('error', (error) => {
      this.log(`Watcher error: ${error.message}`, 'red');
    });

    this.watcher.on('ready', () => {
      this.log('✅ Performance Agent is now active and monitoring', 'green');
      this.log('Press Ctrl+C to stop', 'cyan');
    });

    this.isRunning = true;
  }

  stop() {
    if (!this.isRunning) return;

    this.log('🛑 Stopping Performance Agent...', 'yellow');

    this.debounceTimers.forEach(timer => clearTimeout(timer));
    this.debounceTimers.clear();

    if (this.performanceInterval) {
      clearInterval(this.performanceInterval);
    }

    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }

    this.isRunning = false;
    this.log('✅ Performance Agent stopped', 'green');
  }
}

// Handle graceful shutdown
const performanceAgent = new PerformanceAgent();

process.on('SIGINT', () => {
  performanceAgent.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  performanceAgent.stop();
  process.exit(0);
});

// Start the performance agent
performanceAgent.start().catch(error => {
  console.error('Failed to start performance agent:', error);
  process.exit(1);
});

export default PerformanceAgent;
