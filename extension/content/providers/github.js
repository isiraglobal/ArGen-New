// ─────────────────────────────────────────────────────────────────────────────
// ArGen — GitHub Copilot Chat Detector
// Supports: github.com (Copilot Chat sidebar + github.com/copilot)
// ─────────────────────────────────────────────────────────────────────────────

(function () {
  'use strict';

  // Only activate on pages where Copilot Chat is relevant
  const validPaths = ['/copilot', '/copilot/chat'];
  const isRepoPage = window.location.pathname.split('/').length >= 3;

  // Copilot chat only appears in specific contexts — detect presence of the panel
  function isCopilotActive() {
    return !!document.querySelector(
      '[data-testid="copilot-chat"], [class*="copilot-chat"], #copilot-chat-panel, .js-copilot-chat'
    );
  }

  function extractLastExchange() {
    const chatPanel = document.querySelector(
      '[data-testid="copilot-chat"], [class*="copilot-chat"], #copilot-chat-panel'
    );
    if (!chatPanel) return null;

    const userMsgs = chatPanel.querySelectorAll('[data-role="user"], [class*="user-message"]');
    const assistantMsgs = chatPanel.querySelectorAll('[data-role="assistant"], [class*="assistant-message"], [class*="copilot-message"]');

    if (assistantMsgs.length === 0) return null;

    const lastAssistant = assistantMsgs[assistantMsgs.length - 1];
    const lastUser = userMsgs[userMsgs.length - 1];

    // Check for loading state
    const loading = lastAssistant.querySelector('[class*="loading"], [class*="typing"]');
    if (loading) return null;

    const prompt = lastUser?.innerText?.trim() || '';
    const completion = lastAssistant?.innerText?.trim() || '';

    if (!completion || completion.length < 5) return null;
    return { prompt, completion, model: 'copilot' };
  }

  let debounceTimer = null;
  let lastHash = '';
  let enabled = true;
  let observerStarted = false;

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
          provider: 'github',
          model: 'copilot',
          eventType: 'chat',
          prompt: data.prompt.slice(0, 20000),
          completion: data.completion.slice(0, 20000),
          inputTokens: Math.round(data.prompt.length / 4),
          outputTokens: Math.round(data.completion.length / 4),
        }
      });
    }, 700);
  }

  function startObserver() {
    if (observerStarted) return;
    observerStarted = true;
    const target = document.body;
    const observer = new MutationObserver(() => {
      if (isCopilotActive()) tryCapture();
    });
    observer.observe(target, { childList: true, subtree: true });
    console.log('[ArGen] GitHub Copilot detector active');
  }

  // GitHub is a complex SPA — wait a bit before trying
  setTimeout(() => {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', startObserver);
    } else {
      startObserver();
    }
  }, 2000);
})();
