// ─────────────────────────────────────────────────────────────────────────────
// ArGen — Claude.ai Provider Detector
// Supports: claude.ai
// ─────────────────────────────────────────────────────────────────────────────

(function () {
  'use strict';

  // ── Model detection ────────────────────────────────────────────────────────
  function detectModel() {
    // Claude shows model in header or conversation metadata
    const headerText = document.querySelector('header')?.textContent || '';
    const bodyText = document.title || '';

    const combined = (headerText + bodyText).toLowerCase();
    if (combined.includes('claude 3.7') || combined.includes('3-7')) return 'claude-3-7-sonnet';
    if (combined.includes('claude 3.5') || combined.includes('3-5')) return 'claude-3-5-sonnet';
    if (combined.includes('opus')) return 'claude-3-opus';
    if (combined.includes('sonnet')) return 'claude-3-5-sonnet';
    if (combined.includes('haiku')) return 'claude-3-haiku';

    // Try model selector button
    const modelBtn = document.querySelector('[class*="model-selector"], button[class*="model"]');
    if (modelBtn) return modelBtn.textContent.trim() || 'claude-3-5-sonnet';

    return 'claude-3-5-sonnet';
  }

  // ── Extract last exchange ──────────────────────────────────────────────────
  function extractLastExchange() {
    // Claude uses data-testid or specific class names
    const userMsgs = document.querySelectorAll('[data-testid="user-message"], .font-user-message, [class*="human-turn"]');
    const assistantMsgs = document.querySelectorAll(
      '[data-testid="assistant-message"], .font-claude-message, [class*="assistant-turn"], [class*="claude-response"]'
    );

    if (assistantMsgs.length === 0) return null;

    const lastAssistant = assistantMsgs[assistantMsgs.length - 1];
    const lastUser = userMsgs[userMsgs.length - 1];

    // Check not streaming — Claude shows a cursor/spinner when generating
    const spinner = lastAssistant.querySelector('[class*="loading"], [class*="spinner"], svg[class*="animate"]');
    if (spinner) return null;

    const prompt = lastUser?.innerText?.trim() || '';
    const completion = lastAssistant?.innerText?.trim() || '';

    if (!completion || completion.length < 10) return null;

    return { prompt, completion, model: detectModel() };
  }

  // ── Observer setup ─────────────────────────────────────────────────────────
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
          provider: 'anthropic',
          model: data.model,
          eventType: 'chat',
          prompt: data.prompt.slice(0, 20000),
          completion: data.completion.slice(0, 20000),
          inputTokens: Math.round(data.prompt.length / 4),
          outputTokens: Math.round(data.completion.length / 4),
        }
      });
    }, 1000); // Claude streams slowly, debounce longer
  }

  function startObserver() {
    const target = document.querySelector('main') || document.body;
    const observer = new MutationObserver(tryCapture);
    observer.observe(target, { childList: true, subtree: true, characterData: true });
    console.log('[ArGen] Claude detector active');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startObserver);
  } else {
    startObserver();
  }

  // Handle SPA navigation
  let lastPath = window.location.pathname;
  setInterval(() => {
    if (window.location.pathname !== lastPath) {
      lastPath = window.location.pathname;
      lastHash = '';
    }
  }, 1000);
})();
