// ─────────────────────────────────────────────────────────────────────────────
// ArGen — Microsoft Copilot Provider Detector
// Supports: copilot.microsoft.com, bing.com/chat
// ─────────────────────────────────────────────────────────────────────────────

(function () {
  'use strict';

  function detectModel() {
    // Copilot shows style (Balanced/Creative/Precise) in UI
    const styleBtn = document.querySelector('[data-tone], [aria-label*="Conversation style"], [class*="tone-"]');
    if (styleBtn) {
      const text = styleBtn.textContent.toLowerCase();
      if (text.includes('creative')) return 'copilot-creative';
      if (text.includes('precise')) return 'copilot-precise';
    }
    return 'copilot';
  }

  function extractLastExchange() {
    // Copilot uses cib-chat-turn or specific classes
    const userMsgs = document.querySelectorAll(
      'cib-chat-turn[source-attribution-type="user"] cib-message-group, ' +
      '[data-testid="user-message"], .user-message, [class*="user-bubble"]'
    );
    const assistantMsgs = document.querySelectorAll(
      'cib-chat-turn[source-attribution-type="bot"] cib-message-group, ' +
      '[data-testid="ai-message"], .ai-message, [class*="bot-response"]'
    );

    if (assistantMsgs.length === 0) return null;

    const lastAssistant = assistantMsgs[assistantMsgs.length - 1];
    const lastUser = userMsgs[userMsgs.length - 1];

    // Check for loading state
    const loading = lastAssistant.querySelector('[class*="typing"], [class*="loading"]');
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
          provider: 'microsoft',
          model: data.model,
          eventType: 'chat',
          prompt: data.prompt.slice(0, 20000),
          completion: data.completion.slice(0, 20000),
          inputTokens: Math.round(data.prompt.length / 4),
          outputTokens: Math.round(data.completion.length / 4),
        }
      });
    }, 800);
  }

  function startObserver() {
    const target = document.querySelector('cib-serp, main, body') || document.body;
    const observer = new MutationObserver(tryCapture);
    observer.observe(target, { childList: true, subtree: true });
    console.log('[ArGen] Copilot detector active');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startObserver);
  } else {
    startObserver();
  }
})();
