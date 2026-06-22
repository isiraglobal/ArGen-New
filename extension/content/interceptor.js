// ─────────────────────────────────────────────────────────────────────────────
// ArGen — Fetch / XHR Interceptor
// Wraps window.fetch to extract real token counts from provider API responses.
// Injects into ChatGPT's /backend-api/conversation responses to get usage data.
// ─────────────────────────────────────────────────────────────────────────────

(function () {
  'use strict';

  const originalFetch = window.fetch;

  window.fetch = async function (...args) {
    const [resource, options] = args;
    const url = typeof resource === 'string' ? resource : resource?.url || '';

    const response = await originalFetch.apply(this, args);

    // ── ChatGPT streaming response ─────────────────────────────────────────
    if (url.includes('/backend-api/conversation') || url.includes('/backend-api/f/conversation')) {
      try {
        const cloned = response.clone();
        parseStreamingResponse(cloned);
      } catch (_) {}
    }

    // ── OpenAI direct API (if user has key in browser) ─────────────────────
    if (url.includes('api.openai.com/v1/chat/completions')) {
      try {
        const cloned = response.clone();
        const data = await cloned.json();
        if (data?.usage) {
          notifyTokenData(data.usage.prompt_tokens, data.usage.completion_tokens);
        }
      } catch (_) {}
    }

    // ── Anthropic Messages API ─────────────────────────────────────────────
    if (url.includes('api.anthropic.com/v1/messages') || url.includes('claude.ai/api/append_message')) {
      try {
        const cloned = response.clone();
        const data = await cloned.json();
        if (data?.usage) {
          notifyTokenData(data.usage.input_tokens, data.usage.output_tokens);
        }
      } catch (_) {}
    }

    return response;
  };

  // Parse SSE/streaming JSON lines from ChatGPT
  async function parseStreamingResponse(response) {
    try {
      const text = await response.text();
      const lines = text.split('\n');
      let promptTokens = 0;
      let completionTokens = 0;

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const json = line.slice(6).trim();
        if (json === '[DONE]') continue;
        try {
          const chunk = JSON.parse(json);
          // Look for usage in final chunk
          if (chunk?.usage?.prompt_tokens) promptTokens = chunk.usage.prompt_tokens;
          if (chunk?.usage?.completion_tokens) completionTokens = chunk.usage.completion_tokens;
        } catch (_) {}
      }

      if (promptTokens > 0 || completionTokens > 0) {
        notifyTokenData(promptTokens, completionTokens);
      }
    } catch (_) {}
  }

  function notifyTokenData(promptTokens, completionTokens) {
    try {
      chrome.runtime.sendMessage({
        type: 'TOKEN_DATA',
        payload: { promptTokens, completionTokens }
      });
    } catch (_) {}
  }
})();
