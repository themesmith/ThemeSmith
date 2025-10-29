// Jest setup file for ThemeSmith tests
// Note: @testing-library/jest-dom is for React testing, not needed for Node.js tests

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock process.exit to prevent tests from exiting
const originalExit = process.exit;
process.exit = jest.fn();

// Restore process.exit after all tests
afterAll(() => {
  process.exit = originalExit;
});

// Global test timeout
jest.setTimeout(10000);
