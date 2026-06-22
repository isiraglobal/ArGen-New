// ArGen AI Usage Capture — Generic AI platform content script
// Covers Perplexity, Gemini, Copilot, and similar web-based AI tools

const PLATFORM_RULES = [
  {
    name: 'Perplexity',
    match: /perplexity\.ai/,
    prompts: '.prompt-text, [data-testid="user-message"], .user-message',
    completions: '.completion-text, [data-testid="assistant-message"], .prose',
    inputField: 'textarea[placeholder*="Ask"], textarea[placeholder*="Search"]'
  },
  {
    name: 'Gemini',
    match: /gemini\.google\.com/,
    prompts: '.user-query, [data-testid="user-message"], .query-text',
    completions: '.model-response, [data-testid="assistant-message"], .response-text',
    inputField: 'textarea[placeholder*="Enter"], .input-field'
  },
  {
    name: 'Copilot',
    match: /copilot\.microsoft\.com/,
    prompts: '.user-message, .user-question',
    completions: '.assistant-message, .response-message',
    inputField: 'textarea, .input-area'
  }
];

function detectPlatform() {
  const url = window.location.href;
  for (const rule of PLATFORM_RULES) {
    if (rule.match.test(url)) return rule;
  }
  return null;
}

function captureGeneric() {
  const platform = detectPlatform();
  if (!platform) return;

  const prompts = document.querySelectorAll(platform.prompts);
  const completions = document.querySelectorAll(platform.completions);

  if (prompts.length > 0 && completions.length > 0) {
    const prompt = prompts[prompts.length - 1]?.textContent?.trim();
    const completion = completions[completions.length - 1]?.textContent?.trim();
    if (prompt && completion) {
      sendToArGen({
        provider: platform.name.toLowerCase(),
        model: `${platform.name.toLowerCase()}-web`,
        eventType: 'chat',
        prompt,
        completion,
        context: { url, intent: 'chat' }
      });
    }
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
    console.error(`[ArGen] Capture failed for ${data.provider}:`, err.message);
  }
}

const observer = new MutationObserver(() => captureGeneric());
observer.observe(document.body, { childList: true, subtree: true });

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'CAPTURE_MANUAL') { captureGeneric(); sendResponse({ success: true }); }
});

console.log('[ArGen] Generic AI capturer loaded');