// ArGen AI Usage Capture — ChatGPT content script
// Detects and captures prompts and completions from chat.openai.com/chatgpt.com

const CHATGPT_SELECTORS = {
  conversationContainer: '[data-testid="conversation-turn-"]',
  userMessage: '[data-message-author-role="user"]',
  assistantMessage: '[data-message-author-role="assistant"]',
  messageContent: '.markdown, .whitespace-pre-wrap',
  inputTextarea: '#prompt-textarea, textarea[placeholder*="Message"]',
  submitButton: '[data-testid="send-button"]',
  modelSelector: '[data-testid="model-selector"]',
  modelLabel: '.model-selector-item__label, .text-token-text-primary'
};

let lastCapturedPrompt = '';
let lastCapturedCompletion = '';
let currentConversationId = null;

function extractModelInfo() {
  const el = document.querySelector(CHATGPT_SELECTORS.modelLabel);
  return el ? el.textContent.trim() : 'chatgpt-web';
}

function captureConversationTurn() {
  const turns = document.querySelectorAll(CHATGPT_SELECTORS.conversationContainer);
  if (turns.length === 0) return;

  const lastTurn = turns[turns.length - 1];
  const role = lastTurn.getAttribute('data-message-author-role');

  if (role === 'user') {
    const text = lastTurn.querySelector(CHATGPT_SELECTORS.messageContent);
    if (text) {
      lastCapturedPrompt = text.textContent.trim();
    }
  } else if (role === 'assistant') {
    const text = lastTurn.querySelector(CHATGPT_SELECTORS.messageContent);
    if (text) {
      lastCapturedCompletion = text.textContent.trim();
      // Send both prompt and completion
      sendToArGen({
        provider: 'chatgpt',
        model: extractModelInfo(),
        eventType: 'chat',
        prompt: lastCapturedPrompt,
        completion: lastCapturedCompletion,
        context: {
          url: window.location.href,
          intent: 'chat'
        }
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
      body: JSON.stringify({
        ...data,
        timestamp: new Date().toISOString()
      })
    });
  } catch (err) {
    console.error('[ArGen] Capture failed:', err.message);
  }
}

// Observe DOM changes for new messages
const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    if (mutation.addedNodes.length > 0) {
      captureConversationTurn();
    }
  }
});

function startObserving() {
  const container = document.body;
  if (container) {
    observer.observe(container, {
      childList: true,
      subtree: true
    });
  }
}

// Start immediately
startObserving();

// Listen for manual capture commands from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'CAPTURE_MANUAL') {
    captureConversationTurn();
    sendResponse({ success: true });
  }
  if (message.type === 'GET_CONVERSATION_ID') {
    sendResponse({ conversationId: currentConversationId });
  }
});

console.log('[ArGen] ChatGPT capturer loaded');