# Test Agent

The Test Agent automatically runs tests, generates missing test stubs, and tracks coverage metrics whenever files are saved in the ThemeSmith project.

## Features

- 🧪 **Automatic Test Execution**: Runs relevant tests when files change
- 📝 **Test Stub Generation**: Creates test files for new functions and classes
- 📊 **Coverage Tracking**: Monitors and reports coverage metrics
- 🔄 **Auto-Commit**: Commits test files and coverage updates automatically
- 🎯 **Smart Test Selection**: Runs only relevant tests based on file changes
- 🛡️ **Rate Limiting**: Prevents commit spam with configurable limits

## Usage

### Start the Test Agent

```bash
# Using npm script
npm run test:agent

# Or directly
node test_agent.js
```

### Stop the Test Agent

Press `Ctrl+C` to gracefully stop the agent.

## Configuration

The test agent watches these file patterns:

- `api/**/*.js` - API files (runs API tests)
- `core/**/*.js` - Core files (runs core tests)
- `platforms/**/*.js` - Platform files (runs platform tests)
- `scripts/**/*.js` - Script files (runs script tests)
- `tests/**/*.{js,jsx}` - Test files (runs all tests)

### Test Commands

- **API Tests**: `npm test -- --testPathPattern=api`
- **Core Tests**: `npm test -- --testPathPattern=core`
- **Platform Tests**: `npm test -- --testPathPattern=platforms`
- **Script Tests**: `npm test -- --testPathPattern=scripts`
- **All Tests**: `npm test`

### Coverage Commands

- **API Coverage**: `npm test -- --coverage --testPathPattern=api`
- **Core Coverage**: `npm test -- --coverage --testPathPattern=core`
- **Platform Coverage**: `npm test -- --coverage --testPathPattern=platforms`
- **Script Coverage**: `npm test -- --coverage --testPathPattern=scripts`
- **All Coverage**: `npm test -- --coverage`

### Auto-Commit Settings

```javascript
autoCommit: {
  enabled: true,                    // Enable/disable auto-committing
  commitMessage: 'test: auto-generated tests and coverage updates',
  maxCommitsPerHour: 15,           // Higher limit for test generation
  dryRun: false                    // Set to true for testing
}
```

### Test Generation Settings

```javascript
testGeneration: {
  enabled: true,                   // Enable/disable test stub generation
  generateForNewFiles: true,       // Generate tests for new files
  generateForNewFunctions: true,   // Generate tests for new functions
  templateDir: 'tests/templates'  // Template directory
}
```

## How It Works

1. **File Change Detection**: Watches for changes to source and test files
2. **Test Stub Generation**: Creates test files for new functions/classes
3. **Test Execution**: Runs relevant tests based on file location
4. **Coverage Analysis**: Analyzes test coverage and extracts metrics
5. **Commit**: Automatically commits test files and coverage updates

## Test Stub Generation

The agent automatically generates test stubs for:

- **New Functions**: Detects function declarations and exports
- **New Classes**: Detects class declarations and exports
- **New Files**: Creates comprehensive test files for new modules

### Generated Test Structure

```javascript
import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';

describe('moduleName', () => {
  beforeEach(() => {
    // Setup before each test
  });

  afterEach(() => {
    // Cleanup after each test
    jest.clearAllMocks();
  });

  describe('functionName', () => {
    it('should be defined', () => {
      expect(functionName).toBeDefined();
    });

    it('should work correctly', () => {
      // TODO: Add specific test cases
      expect(true).toBe(true);
    });
  });

  // TODO: Add integration tests
  describe('Integration Tests', () => {
    it('should work end-to-end', () => {
      // TODO: Add integration test cases
      expect(true).toBe(true);
    });
  });
});
```

## Coverage Tracking

The agent tracks and reports:

- **Statement Coverage**: Percentage of statements executed
- **Branch Coverage**: Percentage of branches executed
- **Function Coverage**: Percentage of functions called
- **Line Coverage**: Percentage of lines executed

### Coverage Thresholds

```javascript
coverageThreshold: {
  global: {
    branches: 70,
    functions: 70,
    lines: 70,
    statements: 70
  }
}
```

## Output

The agent provides color-coded output:

- 🔵 **Blue**: Running tests
- 🟢 **Green**: Tests passed / Coverage completed
- 🔴 **Red**: Test failures / Coverage failures
- 🟡 **Yellow**: Warnings / Rate limit warnings
- 🟣 **Magenta**: File change detected
- 🔵 **Cyan**: Coverage analysis / Status messages
- ⚪ **Gray**: No changes to commit

## Example Output

```
[14:30:15] 🚀 Starting Test Agent...
[14:30:15] Watching for file changes and auto-testing...
[14:30:15] ✅ Test Agent is now active and watching files
[14:30:15] Press Ctrl+C to stop
[14:30:22] File changed: api/index.js
[14:30:24] Generated test stub: tests/api/index.test.js
[14:30:25] Running tests for api/index.js...
[14:30:26] ✓ Tests passed for api/index.js
[14:30:27] Running coverage analysis for api/index.js...
[14:30:28] ✓ Coverage analysis completed for api/index.js
[14:30:29] ✓ Committed test updates (1/15 this hour)
```

## Integration

The test agent integrates seamlessly with:

- **Jest Framework**: Uses Jest for test execution and coverage
- **Git Workflow**: Automatically commits test files and coverage reports
- **CI/CD**: Complements automated CI testing processes
- **Development Workflow**: Provides real-time test feedback

## Best Practices

### Development Environment

1. **Start Test Agent Early**: Run the agent during development
2. **Review Generated Tests**: Customize auto-generated test stubs
3. **Monitor Coverage**: Keep track of coverage metrics
4. **Fix Failing Tests**: Address test failures promptly

### Production Environment

1. **Use Dry Run**: Test with dry run mode first
2. **Adjust Rate Limits**: Set appropriate commit limits
3. **Monitor Performance**: Watch for test execution overhead
4. **Review Commits**: Ensure test commits are meaningful

## Troubleshooting

### Tests Not Running

1. **Check Jest Config**: Ensure Jest configuration is correct
2. **Verify Scripts**: Confirm test scripts exist in package.json
3. **Check Dependencies**: Ensure Jest and testing libraries are installed
4. **Review Patterns**: Verify watch patterns match your file structure

### Test Generation Issues

1. **File Permissions**: Ensure write permissions for test directory
2. **Template Directory**: Check if template directory exists
3. **Function Detection**: Verify function detection regex patterns
4. **Path Resolution**: Check file path resolution logic

### Coverage Problems

1. **Coverage Config**: Verify Jest coverage configuration
2. **File Patterns**: Check coverage collection patterns
3. **Thresholds**: Adjust coverage thresholds if needed
4. **Output Format**: Ensure coverage output format is correct

## Advanced Configuration

### Custom Test Templates

Create custom test templates in `tests/templates/`:

```javascript
// tests/templates/api.test.template.js
import { describe, it, expect } from '@jest/globals';

describe('{{moduleName}}', () => {
  {{#each functions}}
  describe('{{name}}', () => {
    it('should work correctly', () => {
      // Custom test implementation
    });
  });
  {{/each}}
});
```

### Selective Test Execution

Configure selective test execution:

```javascript
testCommands: {
  'api': 'npm test -- --testPathPattern=api --verbose',
  'core': 'npm test -- --testPathPattern=core --silent',
  'platforms': 'npm test -- --testPathPattern=platforms --coverage'
}
```

### Coverage Reporting

Configure detailed coverage reporting:

```javascript
coverageReporters: ['text', 'lcov', 'html', 'json', 'text-summary'],
coverageDirectory: 'coverage',
coverageReporters: ['text', 'lcov', 'html', 'json']
```

This comprehensive test agent provides complete automation of the testing workflow, ensuring code quality and maintaining high test coverage throughout development.
