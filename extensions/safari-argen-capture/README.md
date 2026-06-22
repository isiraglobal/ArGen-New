# ArGen Safari Extension

Safari Web Extension for capturing AI interactions (ChatGPT, Claude, Perplexity, Gemini, Copilot).

## Building for Safari

Safari web extensions must be wrapped in a macOS app using Xcode.

### Prerequisites
- macOS 12+ with Xcode 14+
- Apple Developer account (free or paid)

### Steps

1. **Create the Xcode project:**
   ```bash
   xcrun safari-web-extension-converter --app-name "ArGen Capture" --bundle-identifier com.argen.capture.safari --project-location . --no-open extensions/safari-argen-capture/
   ```

   This creates an Xcode project with a macOS app that bundles the web extension.

2. **Open the project** in Xcode and configure signing:
   - Select the target → Signing & Capabilities
   - Select your Apple Developer team

3. **Build and Run:**
   - Select "ArGen Capture" as the scheme
   - Build (Cmd+B) or Run (Cmd+R)
   - Safari will launch with the extension installed

4. **Enable in Safari:**
   - Safari → Settings → Extensions
   - Check "ArGen Capture"

### Manual Install (without Xcode)

For testing purposes, you can enable unsigned extensions:
1. Safari → Settings → Advanced → Show Develop menu
2. Develop → Allow Unsigned Extensions
3. Open the app bundle built by the converter

### Development

The content scripts (`content-capturer-*.js`) are shared with the Chrome extension. The WebExtensions API in Safari 15+ supports most Chrome extension APIs.

Key differences from Chrome:
- Use `browser.*` API (polyfilled via `const browserApi = typeof browser !== 'undefined' ? browser : chrome`)
- Storage is per-app in Safari (shared between macOS app and extension)
- Native messaging requires a native companion app (not used here)
