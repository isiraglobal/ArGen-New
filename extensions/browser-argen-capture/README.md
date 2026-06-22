# ArGen Browser Extension (Manifest V3)

Capture AI tool usage from ChatGPT, Claude, Perplexity, Gemini, and Copilot for ArGen workflow intelligence scoring.

## Supported Platforms

| Platform | Capture Method |
|----------|----------------|
| ChatGPT | DOM mutation observer — captures prompt/completion pairs |
| Claude | DOM mutation observer — captures last prompt/response |
| Perplexity | Generic observer — detects user/assistant messages |
| Gemini | Generic observer — detects query/response pairs |
| Copilot | Generic observer — detects user/assistant messages |

## How It Works

1. **Content Scripts**: Injected into AI platform pages to observe DOM changes
2. **Auto-Capture**: Automatically captures prompts and completions as you chat
3. **Background Service Worker**: Sends heartbeats every 5 minutes, manages session state
4. **Popup**: Configure API key, view capture stats, manually trigger capture

## Installation (Developer Mode)

1. Open Chrome → `chrome://extensions`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select `extensions/browser-argen-capture/`
5. Click the extension icon → enter your ArGen API key
6. Browse to ChatGPT, Claude, etc. — captures start automatically

## API Key

Get your API key from the ArGen dashboard at **Settings → API Keys** or ask your company admin.

## Permissions

- `storage`: Save API key and settings
- `webRequest` + `host_permissions`: Required for future network-based capture
- Content scripts on AI platform domains only

## Architecture

```
popup.html/js ──→ chrome.storage.sync ←── background.js (service worker)
                                                        ↕
content-capturer.js (ChatGPT) ──→ POST /api/capture/interaction
content-capturer-claude.js      ──→ POST /api/capture/interaction
content-capturer-generic.js     ──→ POST /api/capture/interaction
```

## License

MIT