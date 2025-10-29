# Lint Agent

The Lint Agent automatically runs linting whenever files are saved in the ThemeSmith project. It watches for changes to JavaScript and JSX files and runs the appropriate linting commands based on the file location.

## Features

- 🔍 **File Watching**: Monitors all relevant source files for changes
- ⚡ **Smart Linting**: Runs appropriate lint commands based on file location
- 🎯 **Debounced Execution**: Prevents excessive lint runs during rapid file changes
- 🎨 **Colored Output**: Clear, color-coded console output for easy monitoring
- 🛡️ **Error Handling**: Graceful error handling and recovery
- 🚀 **Easy Start/Stop**: Simple commands to start and stop the agent

## Usage

### Start the Lint Agent

```bash
# Using npm script
npm run lint:agent

# Or directly
node lint_agent.js
```

### Stop the Lint Agent

Press `Ctrl+C` to gracefully stop the agent.

## Configuration

The lint agent watches the following file patterns:

- `api/**/*.js` - API files (runs `npm --prefix api run lint`)
- `frontend/**/*.{js,jsx}` - Frontend files (runs `npm --prefix frontend run lint`)
- `core/**/*.js` - Core files (runs `npm run lint:api`)
- `platforms/**/*.js` - Platform files (runs `npm run lint:api`)
- `scripts/**/*.js` - Script files (runs `npm run lint:api`)

### Ignored Directories

The agent automatically ignores:
- `node_modules/`
- `.git/`
- `output/`
- `.next/`
- `coverage/`

### Debounce Delay

The agent waits 1000ms after a file change before running linting to avoid excessive executions during rapid saves.

## Output

The agent provides color-coded output:

- 🔵 **Blue**: Running lint command
- 🟢 **Green**: Lint passed successfully
- 🔴 **Red**: Lint errors found
- 🟡 **Yellow**: Warnings or info messages
- 🟣 **Magenta**: File change detected
- 🔵 **Cyan**: Status messages

## Example Output

```
[14:30:15] 🚀 Starting Lint Agent...
[14:30:15] Watching for file changes and auto-linting...
[14:30:15] ✅ Lint Agent is now active and watching files
[14:30:15] Press Ctrl+C to stop
[14:30:22] File changed: frontend/pages/index.jsx
[14:30:23] Running lint for frontend/pages/index.jsx...
[14:30:24] ✓ Lint passed for frontend/pages/index.jsx
```

## Development

The lint agent is built with:

- **chokidar**: Robust file watching library
- **Node.js**: Native child_process for running lint commands
- **ES6 Modules**: Modern JavaScript module system

## Troubleshooting

### Agent Won't Start

1. Ensure Node.js 18+ is installed
2. Run `npm install` to install dependencies
3. Check that lint commands are available in package.json

### Files Not Being Watched

1. Verify file paths match the watch patterns
2. Check that files are not in ignored directories
3. Ensure file extensions are correct (.js, .jsx)

### Lint Commands Failing

1. Verify that the appropriate npm scripts exist
2. Check that ESLint configurations are valid
3. Ensure all dependencies are installed

## Integration

The lint agent integrates seamlessly with:

- **VS Code**: Works with any editor that saves files
- **Git Hooks**: Can be used alongside pre-commit hooks
- **CI/CD**: Complements automated CI linting
- **Development Workflow**: Provides real-time feedback during development
