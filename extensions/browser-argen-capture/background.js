// ArGen AI Usage Capture — Background Service Worker
// Handles: storage sync, periodic check-ins, session management, API fallback

const DEFAULT_API_URL = 'https://argen.isira.club/api';
let heartbeatInterval = null;
let sessionId = null;

function generateSessionId() {
  return 'sess_' + crypto.randomUUID().replace(/-/g, '').slice(0, 16);
}

// Initialize on install
chrome.runtime.onInstalled.addListener(() => {
  sessionId = generateSessionId();
  chrome.storage.sync.set({
    argenSessionId: sessionId,
    argenApiUrl: DEFAULT_API_URL,
    argenAutoCapture: true,
    argenCaptureCount: 0,
    argenLastSync: null
  });
});

// Start heartbeat on startup
chrome.runtime.onStartup.addListener(() => {
  sessionId = generateSessionId();
  chrome.storage.sync.set({ argenSessionId: sessionId });
  startHeartbeat();
});

function startHeartbeat() {
  if (heartbeatInterval) clearInterval(heartbeatInterval);
  heartbeatInterval = setInterval(sendHeartbeat, 5 * 60 * 1000); // every 5 min
}

async function sendHeartbeat() {
  try {
    const result = await chrome.storage.sync.get(['argenApiKey', 'argenApiUrl', 'argenSessionId', 'argenCaptureCount']);
    const apiKey = result.argenApiKey;
    const apiUrl = result.argenApiUrl || DEFAULT_API_URL;
    const sessionId = result.argenSessionId;
    const captureCount = result.argenCaptureCount || 0;

    if (!apiKey) return;

    await fetch(`${apiUrl}/capture/session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'x-source': 'browser-extension',
        'x-agent-version': '1.0.0'
      },
      body: JSON.stringify({
        action: 'heartbeat',
        sessionId,
        totalCaptured: captureCount,
        timestamp: new Date().toISOString()
      })
    });
  } catch (err) {
    console.error('[ArGen] Heartbeat failed:', err.message);
  }
}

// Listen for tab updates to inject context
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    const aiDomains = [
      'chatgpt.com', 'chat.openai.com',
      'claude.ai',
      'perplexity.ai',
      'gemini.google.com',
      'copilot.microsoft.com'
    ];
    const isAISite = aiDomains.some(d => tab.url.includes(d));
    chrome.storage.sync.set({ argenCurrentSite: isAISite ? tab.url : null });
  }
});

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'CAPTURED') {
    chrome.storage.sync.get(['argenCaptureCount'], (result) => {
      const count = (result.argenCaptureCount || 0) + 1;
      chrome.storage.sync.set({ argenCaptureCount: count, argenLastSync: new Date().toISOString() });
    });
  }
  sendResponse({ success: true });
});

console.log('[ArGen] Background service worker loaded');