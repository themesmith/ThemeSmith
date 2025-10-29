# Auto-Correction Agent

The Auto-Correction Agent automatically fixes linting errors and commits the corrected code to the repository. It works alongside the Lint Agent to provide a complete automated code quality workflow.

## Features

- 🔧 **Automatic Error Fixing**: Runs ESLint with `--fix` flag to automatically correct fixable issues
- 📝 **Smart Commit Management**: Automatically commits fixes with descriptive messages
- ⏱️ **Rate Limiting**: Prevents commit spam with configurable hourly limits
- 🎯 **Intelligent Detection**: Only fixes files that actually have linting errors
- 🛡️ **Safety Features**: Dry-run mode and error handling for safe operation
- 🎨 **Colored Output**: Clear, color-coded console output for easy monitoring

## Usage

### Start the Auto-Correction Agent

```bash
# Using npm script
npm run auto:fix

# Or directly
node auto_correction_agent.js
```

### Stop the Auto-Correction Agent

Press `Ctrl+C` to gracefully stop the agent.

## Configuration

The auto-correction agent watches the same file patterns as the lint agent:

- `api/**/*.js` - API files (runs `npm --prefix api run lint:fix`)
- `frontend/**/*.{js,jsx}` - Frontend files (runs `npm --prefix frontend run lint:fix`)
- `core/**/*.js` - Core files (runs `npm run lint:fix:api`)
- `platforms/**/*.js` - Platform files (runs `npm run lint:fix:api`)
- `scripts/**/*.js` - Script files (runs `npm run lint:fix:api`)

### Auto-Commit Settings

```javascript
autoCommit: {
  enabled: true,                    // Enable/disable auto-committing
  commitMessage: 'fix: auto-correct linting errors',
  maxCommitsPerHour: 10,           // Prevent spam commits
  dryRun: false                    // Set to true for testing
}
```

### Debounce Delay

The agent waits 2000ms after a file change before running fixes to avoid excessive executions during rapid saves.

## How It Works

1. **File Change Detection**: Watches for changes to relevant source files
2. **Lint Error Check**: Checks if the file has any linting errors
3. **Auto-Fix Application**: Runs ESLint with `--fix` flag if errors are found
4. **Verification**: Checks if all errors were resolved after fixing
5. **Commit**: Automatically commits the fixes with a descriptive message

## Output

The agent provides color-coded output:

- 🔵 **Blue**: Running fix command
- 🟢 **Green**: Fix applied successfully / All errors resolved
- 🔴 **Red**: Fix command failed
- 🟡 **Yellow**: Some errors remain / Rate limit warnings
- 🟣 **Magenta**: File change detected
- 🔵 **Cyan**: Status messages / Dry run notifications
- ⚪ **Gray**: No changes to commit

## Example Output

```
[14:30:15] 🚀 Starting Auto-Correction Agent...
[14:30:15] Watching for linting errors and auto-fixing...
[14:30:15] ✅ Auto-Correction Agent is now active and watching files
[14:30:15] Press Ctrl+C to stop
[14:30:22] File changed: frontend/pages/index.jsx
[14:30:24] Running auto-fix for frontend/pages/index.jsx...
[14:30:25] ✓ Auto-fix applied for frontend/pages/index.jsx
[14:30:25] ✓ All lint errors resolved for frontend/pages/index.jsx
[14:30:26] ✓ Committed auto-fixes (1/10 this hour)
```

## Safety Features

### Rate Limiting

- **Default Limit**: 10 commits per hour
- **Automatic Reset**: Counter resets every hour
- **Warning**: Shows warning when limit is reached

### Dry Run Mode

Enable dry run mode to test without making actual commits:

```javascript
// In auto_correction_agent.js
autoCommit: {
  dryRun: true  // Shows what would be committed
}
```

### Error Handling

- **Graceful Failures**: Continues operation if individual fixes fail
- **Git Safety**: Checks for changes before attempting to commit
- **File Verification**: Verifies fixes were successful before committing

## Integration

The auto-correction agent integrates seamlessly with:

- **Lint Agent**: Works alongside the lint agent for complete automation
- **Git Workflow**: Automatically commits fixes with conventional commit messages
- **CI/CD**: Complements automated CI processes
- **Development Workflow**: Provides real-time error correction

## Best Practices

### Development Environment

1. **Start Both Agents**: Run both lint and auto-correction agents together
2. **Monitor Output**: Watch for any failed fixes or commit issues
3. **Review Commits**: Periodically review auto-generated commits

### Production Environment

1. **Use Dry Run**: Test with dry run mode first
2. **Adjust Rate Limits**: Set appropriate commit limits for your workflow
3. **Monitor Git History**: Ensure auto-commits don't clutter your history

## Troubleshooting

### Fixes Not Applied

1. **Check ESLint Config**: Ensure ESLint is configured with fixable rules
2. **Verify Scripts**: Confirm `lint:fix` scripts exist in package.json files
3. **Check Permissions**: Ensure write permissions for file modifications

### Commits Not Working

1. **Git Status**: Check if repository is in a clean state
2. **Git Config**: Verify git user name and email are configured
3. **Rate Limits**: Check if hourly commit limit is reached

### Performance Issues

1. **Debounce Delay**: Increase debounce delay for slower systems
2. **File Patterns**: Reduce watch patterns to fewer directories
3. **Ignore Patterns**: Add more directories to ignore list

## Configuration Examples

### Conservative Settings

```javascript
autoCommit: {
  enabled: true,
  maxCommitsPerHour: 5,  // Lower limit
  dryRun: false
},
debounceDelay: 3000  // Longer delay
```

### Aggressive Settings

```javascript
autoCommit: {
  enabled: true,
  maxCommitsPerHour: 20,  // Higher limit
  dryRun: false
},
debounceDelay: 1000  // Shorter delay
```

### Testing Mode

```javascript
autoCommit: {
  enabled: true,
  maxCommitsPerHour: 100,  // High limit for testing
  dryRun: true  // No actual commits
}
```

## Advanced Usage

### Custom Commit Messages

Modify the commit message format in the configuration:

```javascript
commitMessage: 'style: auto-fix ESLint errors',
```

### Selective File Processing

Add custom logic to process only specific files:

```javascript
shouldFixFile(filePath) {
  // Add custom logic here
  return this.shouldFixFile(filePath) && 
         !filePath.includes('test') && 
         !filePath.includes('spec');
}
```

### Integration with Pre-commit Hooks

The auto-correction agent can work alongside pre-commit hooks:

```bash
# In .husky/pre-commit
npm run lint:fix:api
npm --prefix frontend run lint:fix
```

This ensures that fixes are applied before manual commits as well.
