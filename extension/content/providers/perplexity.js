// ─────────────────────────────────────────────────────────────────────────────
// ArGen — Perplexity Provider Detector
// Supports: perplexity.ai
// ─────────────────────────────────────────────────────────────────────────────

(function () {
  'use strict';

  function detectModel() {
    // Perplexity shows model in the model selector dropdown
    const modelEl = document.querySelector('[class*="model-selector"], [data-model]');
    if (modelEl) {
      const text = modelEl.textContent.toLowerCase();
      if (text.includes('claude')) return 'claude-3-5-sonnet';
      if (text.includes('gpt')) return 'gpt-4o';
      if (text.includes('sonar')) return 'sonar-large';
      if (text.includes('llama')) return 'llama-3.1-70b';
    }
    return 'perplexity';
  }

  function extractLastExchange() {
    // Perplexity query container
    const userMsgs = document.querySelectorAll(
      '[class*="query-text"], [data-testid="query"], h2[class*="query"]'
    );
    // Answer content
    const assistantMsgs = document.querySelectorAll(
      '[class*="prose"], [data-testid="answer"], [class*="answer-text"], .markdown-content'
    );

    if (assistantMsgs.length === 0) return null;

    const lastAssistant = assistantMsgs[assistantMsgs.length - 1];
    const lastUser = userMsgs[userMsgs.length - 1];

    // Check for loading
    const loading = document.querySelector('[class*="skeleton"], [class*="generating"]');
    if (loading) return null;

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
          provider: 'perplexity',
          model: data.model,
          eventType: 'search',
          prompt: data.prompt.slice(0, 20000),
          completion: data.completion.slice(0, 20000),
          inputTokens: Math.round(data.prompt.length / 4),
          outputTokens: Math.round(data.completion.length / 4),
        }
      });
    }, 1200); // Perplexity takes a while to load full answers
  }

  function startObserver() {
    const target = document.querySelector('main, body') || document.body;
    const observer = new MutationObserver(tryCapture);
    observer.observe(target, { childList: true, subtree: true });
    console.log('[ArGen] Perplexity detector active');
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
