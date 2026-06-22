# ArGen VS Code Extension

Capture AI tool usage in VS Code for ArGen workflow intelligence scoring.

## Features

- **Manual Capture**: Select text and run "ArGen: Capture AI Selection" to log interactions
- **Auto-Capture**: Automatically detects and captures AI-generated code/paste events
- **Session Tracking**: Tracks work sessions with all interactions
- **API Key Configuration**: Securely configure your company API key via command palette

## Installation

1. Open VS Code
2. Press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows/Linux)
3. Select "ArGen: Configure API Key"
4. Enter your company API key

## Usage

### Manual Capture
1. Select any text in your editor
2. Press `Cmd+Shift+P` or `Ctrl+Shift+P`
3. Type "ArGen: Capture AI Selection"
4. The selection will be captured to ArGen

### Auto-Capture
- Automatically enabled by default
- Detects AI-generated content patterns (code blocks, function definitions, etc.)
- Captures when you paste AI output into your editor

### Disable Auto-Capture
1. Go to Settings (`Cmd+,` or `Ctrl+,`)
2. Search for "ArGen Capture"
3. Uncheck "Auto Capture"

## API Endpoints

Captures are sent to: `POST /api/capture/interaction`

Payload includes:
- `type`: selection, insertion, deletion, navigation
- `content`: The actual text/code
- `language`: Programming language
- `filePath`: File being edited
- `action`: selected, pasted, deleted, etc.
- `timestamp`: ISO timestamp
- `sessionId`: Unique session identifier

## Development

```bash
# Install dependencies
npm install

# Run linting
npm run lint

# Package extension
npm run package
```

## License

MIT