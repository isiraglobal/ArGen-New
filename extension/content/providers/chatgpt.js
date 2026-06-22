// ─────────────────────────────────────────────────────────────────────────────
// ArGen — ChatGPT Provider Detector
// Supports: chat.openai.com, chatgpt.com
// ─────────────────────────────────────────────────────────────────────────────

(function () {
  'use strict';

  // Inject fetch interceptor for real token data
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL('content/interceptor.js');
  (document.head || document.documentElement).appendChild(script);

  // ── Selectors (ChatGPT DOM as of 2025-2026) ────────────────────────────────
  const SELECTORS = {
    // Conversation container
    conversation: 'main',
    // User message
    userMsg: '[data-message-author-role="user"] .whitespace-pre-wrap',
    // Assistant response (markdown rendered)
    assistantMsg: '[data-message-author-role="assistant"] .markdown',
    // Model selector button
    modelBtn: '[data-testid="model-switcher-dropdown-button"], button[class*="model"]',
    // Alternative: model shown in header
    modelHeader: 'span[class*="truncate"]:first-child',
  };

  // ── Model detection ────────────────────────────────────────────────────────
  function detectModel() {
    const btn = document.querySelector(SELECTORS.modelBtn);
    if (btn) {
      const text = btn.textContent.trim().toLowerCase();
      if (text.includes('4o')) return 'gpt-4o';
      if (text.includes('o3')) return 'o3';
      if (text.includes('o1')) return 'o1';
      if (text.includes('4') && text.includes('turbo')) return 'gpt-4-turbo';
      if (text.includes('4')) return 'gpt-4';
      if (text.includes('3.5')) return 'gpt-3.5-turbo';
      return text || 'gpt-4o';
    }
    return 'gpt-4o';
  }

  // ── Extract last prompt + completion pair ──────────────────────────────────
  function extractLastExchange() {
    const userMsgs = document.querySelectorAll('[data-message-author-role="user"]');
    const assistantMsgs = document.querySelectorAll('[data-message-author-role="assistant"]');

    if (assistantMsgs.length === 0) return null;

    const lastAssistant = assistantMsgs[assistantMsgs.length - 1];
    const lastUser = userMsgs[userMsgs.length - 1];

    // Check response is complete (not still streaming)
    const streamingIndicator = lastAssistant.querySelector('[class*="streaming"], [class*="result-streaming"]');
    if (streamingIndicator) return null;

    const promptEl = lastUser?.querySelector('.whitespace-pre-wrap');
    const completionEl = lastAssistant.querySelector('.markdown, .prose');

    const prompt = promptEl?.innerText?.trim() || '';
    const completion = completionEl?.innerText?.trim() || '';

    if (!completion || completion.length < 10) return null;

    return {
      prompt,
      completion,
      model: detectModel(),
    };
  }

  // ── Watch for new responses ────────────────────────────────────────────────
  let debounceTimer = null;
  let lastHash = '';
  let enabled = true;

  // Read initial enabled state
  chrome.storage.sync.get({ enabled: true }, (s) => { enabled = s.enabled; });
  chrome.storage.onChanged.addListener((changes) => {
    if (changes.enabled) enabled = changes.enabled.newValue;
  });

  function simpleHash(str) {
    let h = 0;
    for (let i = 0; i < Math.min(str.length, 300); i++) {
      h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
    }
    return Math.abs(h).toString(16);
  }

  function tryCapture() {
    if (!enabled) return;
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      const data = extractLastExchange();
      if (!data) return;

      const hash = simpleHash(data.prompt + data.completion);
      if (hash === lastHash) return;
      lastHash = hash;

      const payload = {
        provider: 'openai',
        model: data.model,
        eventType: 'chat',
        prompt: data.prompt.slice(0, 20000),
        completion: data.completion.slice(0, 20000),
        inputTokens: Math.round(data.prompt.length / 4),
        outputTokens: Math.round(data.completion.length / 4),
      };

      chrome.runtime.sendMessage({ type: 'INTERACTION_CAPTURED', payload });
    }, 800);
  }

  // Wait for the main chat container to load
  function startObserver() {
    const main = document.querySelector('main') || document.body;
    const observer = new MutationObserver(tryCapture);
    observer.observe(main, { childList: true, subtree: true, characterData: true });
    console.log('[ArGen] ChatGPT detector active');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startObserver);
  } else {
    startObserver();
  }

  // Handle SPA navigation (ChatGPT is a SPA)
  let lastPathname = window.location.pathname;
  setInterval(() => {
    if (window.location.pathname !== lastPathname) {
      lastPathname = window.location.pathname;
      lastHash = ''; // reset on new conversation
    }
  }, 1000);
})();
