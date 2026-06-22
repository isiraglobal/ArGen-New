// Safari uses the same WebExtensions API
const browserApi = typeof browser !== 'undefined' ? browser : chrome;

// Generate a unique session ID
function generateSessionId() {
  return 'saf-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
}

browserApi.runtime.onInstalled.addListener(() => {
  browserApi.storage.sync.set({
    argenSessionId: generateSessionId(),
    argenCaptureCount: 0,
    argenLastSync: new Date().toISOString()
  });
});

browserApi.runtime.onStartup.addListener(() => {
  browserApi.storage.sync.set({ argenSessionId: generateSessionId() });
});

// Heartbeat every 5 minutes
setInterval(async () => {
  try {
    const result = await browserApi.storage.sync.get(['argenApiKey', 'argenApiUrl', 'argenSessionId', 'argenCaptureCount']);
    if (!result.argenApiKey) return;
    const apiUrl = result.argenApiUrl || 'https://argen.isira.club/api';
    await fetch(apiUrl + '/capture/heartbeat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': result.argenApiKey },
      body: JSON.stringify({
        sessionId: result.argenSessionId,
        capturedCount: result.argenCaptureCount || 0,
        extension: 'safari',
        version: '1.0.0',
        timestamp: new Date().toISOString()
      })
    });
  } catch (e) {
    console.warn('[ArGen Safari] Heartbeat failed:', e);
  }
}, 300000);

// Track tab URL changes for AI site detection
browserApi.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url) {
    const aiSites = ['chatgpt.com', 'chat.openai.com', 'claude.ai', 'perplexity.ai', 'gemini.google.com', 'github.com/copilot'];
    const isAISite = aiSites.some(site => changeInfo.url.includes(site));
    if (isAISite) {
      browserApi.storage.sync.set({ argenCurrentSite: changeInfo.url });
    }
  }
});

browserApi.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_CAPTURE_COUNT') {
    browserApi.storage.sync.get(['argenCaptureCount'], (result) => {
      sendResponse({ count: result.argenCaptureCount || 0 });
    });
    return true;
  }
  if (message.type === 'INTERACTION_CAPTURED') {
    browserApi.storage.sync.get(['argenCaptureCount'], (result) => {
      const count = (result.argenCaptureCount || 0) + 1;
      browserApi.storage.sync.set({ argenCaptureCount: count, argenLastSync: new Date().toISOString() });
    });
  }
});
