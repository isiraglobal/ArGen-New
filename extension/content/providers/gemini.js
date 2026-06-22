// ─────────────────────────────────────────────────────────────────────────────
// ArGen — Google Gemini Provider Detector
// Supports: gemini.google.com
// ─────────────────────────────────────────────────────────────────────────────

(function () {
  'use strict';

  function detectModel() {
    // Gemini shows model in header/selector
    const selector = document.querySelector('[aria-label*="model"], [data-model-name], mat-select');
    if (selector) {
      const text = selector.textContent.trim().toLowerCase();
      if (text.includes('ultra')) return 'gemini-ultra';
      if (text.includes('pro')) return 'gemini-pro';
      if (text.includes('flash')) return 'gemini-flash';
      if (text.includes('1.5')) return 'gemini-1.5-pro';
      if (text.includes('2.0')) return 'gemini-2.0-flash';
      if (text.includes('2.5')) return 'gemini-2.5-pro';
    }
    return 'gemini-pro';
  }

  function extractLastExchange() {
    // Gemini uses custom web components: user-query and model-response
    const userMsgs = document.querySelectorAll('user-query, [class*="user-query"], .user-query-text');
    const assistantMsgs = document.querySelectorAll('model-response, [class*="model-response"], .response-content');

    if (assistantMsgs.length === 0) return null;

    const lastAssistant = assistantMsgs[assistantMsgs.length - 1];
    const lastUser = userMsgs[userMsgs.length - 1];

    // Check streaming indicator
    const generating = lastAssistant.querySelector('[class*="loading"], [class*="generating"], mat-spinner');
    if (generating) return null;

    const prompt = lastUser?.innerText?.trim() || '';
    const completion = lastAssistant?.innerText?.trim() || '';

    if (!completion || completion.length < 10) return null;
    return { prompt, completion, model: detectModel() };
  }

  let debounceTimer = null;
  let lastHash = '';
  let enabled = true;

  chrome.storage.sync.get({ enabled: true }, (s) => { enabled = s.enabled; });
  chrome.storage.onChanged.addListener((c) => { if (c.enabled) enabled = c.enabled.newValue; });

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

      chrome.runtime.sendMessage({
        type: 'INTERACTION_CAPTURED',
        payload: {
          provider: 'gemini',
          model: data.model,
          eventType: 'chat',
          prompt: data.prompt.slice(0, 20000),
          completion: data.completion.slice(0, 20000),
          inputTokens: Math.round(data.prompt.length / 4),
          outputTokens: Math.round(data.completion.length / 4),
        }
      });
    }, 900);
  }

  function startObserver() {
    const target = document.querySelector('chat-window, main, body') || document.body;
    const observer = new MutationObserver(tryCapture);
    observer.observe(target, { childList: true, subtree: true });
    console.log('[ArGen] Gemini detector active');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startObserver);
  } else {
    startObserver();
  }

  let lastPath = window.location.pathname;
  setInterval(() => {
    if (window.location.pathname !== lastPath) {
      lastPath = window.location.pathname;
      lastHash = '';
    }
  }, 1000);
})();
