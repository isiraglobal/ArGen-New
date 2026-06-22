// ─────────────────────────────────────────────────────────────────────────────
// ArGen — Base Detector Class
// All provider-specific detectors extend this. Handles MutationObserver setup,
// debouncing, deduplication, and sending to the service worker.
// ─────────────────────────────────────────────────────────────────────────────

class ArGenDetector {
  constructor(config) {
    this.provider = config.provider;           // e.g. 'openai'
    this.eventType = config.eventType || 'chat';
    this.debounceMs = config.debounceMs || 600;
    this.observer = null;
    this.debounceTimer = null;
    this.lastPromptHash = null;
    this.lastCompletionHash = null;
    this.enabled = true;

    // Listen for enable/disable from popup
    chrome.storage.onChanged.addListener((changes) => {
      if (changes.enabled !== undefined) {
        this.enabled = changes.enabled.newValue !== false;
      }
    });

    this.init();
  }

  // Override in subclass — return { prompt, completion, model, inputTokens, outputTokens }
  // or null if nothing to capture yet
  extract() {
    return null;
  }

  // Called when a new AI response is detected
  onDetected() {
    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      if (!this.enabled) return;
      const data = this.extract();
      if (!data) return;

      // Deduplication: skip if same prompt+completion captured recently
      const hash = this.simpleHash(data.prompt + data.completion);
      if (hash === this.lastCompletionHash) return;
      this.lastCompletionHash = hash;

      this.send(data);
    }, this.debounceMs);
  }

  send(data) {
    const payload = {
      provider: this.provider,
      model: data.model || 'unknown',
      eventType: this.eventType,
      prompt: (data.prompt || '').slice(0, 20000),
      completion: (data.completion || '').slice(0, 20000),
      inputTokens: data.inputTokens || this.estimateTokens(data.prompt || ''),
      outputTokens: data.outputTokens || this.estimateTokens(data.completion || ''),
      intent: data.intent || '',
    };

    try {
      chrome.runtime.sendMessage({ type: 'INTERACTION_CAPTURED', payload });
    } catch (e) {
      // Extension context may be invalidated (e.g. extension updated)
      console.warn('[ArGen] Could not send message:', e.message);
    }
  }

  // Rough 1 token ≈ 4 chars estimate
  estimateTokens(text) {
    return Math.max(1, Math.round((text || '').length / 4));
  }

  simpleHash(str) {
    if (!str) return '';
    let h = 0;
    for (let i = 0; i < Math.min(str.length, 500); i++) {
      h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
    }
    return Math.abs(h).toString(16);
  }

  // Set up MutationObserver on target node
  observe(targetNode, observerOptions = { childList: true, subtree: true }) {
    if (this.observer) this.observer.disconnect();

    this.observer = new MutationObserver(() => {
      this.onDetected();
    });

    this.observer.observe(targetNode, observerOptions);
  }

  // Wait for an element to appear, then init observer
  waitForElement(selector, callback, timeout = 30000) {
    const el = document.querySelector(selector);
    if (el) { callback(el); return; }

    const start = Date.now();
    const interval = setInterval(() => {
      const found = document.querySelector(selector);
      if (found) {
        clearInterval(interval);
        callback(found);
      } else if (Date.now() - start > timeout) {
        clearInterval(interval);
      }
    }, 500);
  }

  // Override in subclass
  init() {
    console.log(`[ArGen] ${this.provider} detector initialised on ${window.location.hostname}`);
  }

  destroy() {
    if (this.observer) this.observer.disconnect();
    clearTimeout(this.debounceTimer);
  }
}

// Export for providers (content scripts run in same context — no ES modules needed)
window.__ArGenDetector = ArGenDetector;
