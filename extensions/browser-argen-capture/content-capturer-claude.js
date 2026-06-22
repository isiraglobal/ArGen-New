// ArGen AI Usage Capture — Claude content script

let lastCapturedPrompt = '';

function extractMessages() {
  const articles = document.querySelectorAll('[data-testid="message"]');
  if (articles.length < 2) return;

  const promptEl = articles[articles.length - 2];
  const completionEl = articles[articles.length - 1];

  const promptText = promptEl?.querySelector('.font-claude-message, .whitespace-pre-wrap')?.textContent?.trim();
  const completionText = completionEl?.querySelector('.font-claude-message, .whitespace-pre-wrap')?.textContent?.trim();

  if (promptText && completionText) {
    sendToArGen({
      provider: 'claude',
      model: 'claude-web',
      eventType: 'chat',
      prompt: promptText,
      completion: completionText,
      context: {
        url: window.location.href,
        intent: 'chat'
      }
    });
  }
}

async function sendToArGen(data) {
  try {
    const result = await chrome.storage.sync.get(['argenApiKey', 'argenApiUrl']);
    const apiKey = result.argenApiKey;
    const apiUrl = result.argenApiUrl || 'https://argen.isira.club/api';
    if (!apiKey) return;

    await fetch(`${apiUrl}/capture/interaction`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'x-source': 'browser-extension',
        'x-agent-version': '1.0.0'
      },
      body: JSON.stringify({ ...data, timestamp: new Date().toISOString() })
    });
  } catch (err) {
    console.error('[ArGen] Claude capture failed:', err.message);
  }
}

const observer = new MutationObserver(() => extractMessages());
observer.observe(document.body, { childList: true, subtree: true });

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'CAPTURE_MANUAL') { extractMessages(); sendResponse({ success: true }); }
});

console.log('[ArGen] Claude capturer loaded');