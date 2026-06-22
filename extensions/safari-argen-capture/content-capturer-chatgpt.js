const browserApi = typeof browser !== 'undefined' ? browser : chrome;

function extractPrompt() {
  const textareas = document.querySelectorAll('textarea, div[contenteditable="true"]');
  for (const el of textareas) {
    if (el.value || el.textContent) {
      return el.value || el.textContent;
    }
  }
  return '';
}

function extractCompletion() {
  const articles = document.querySelectorAll('article, [data-message-author-role="assistant"]');
  if (articles.length > 0) {
    return articles[articles.length - 1].textContent || '';
  }
  return '';
}

function captureInteraction() {
  const prompt = extractPrompt();
  const completion = extractCompletion();
  if (!prompt && !completion) return;
  browserApi.storage.sync.get(['argenApiKey', 'argenApiUrl'], async (result) => {
    if (!result.argenApiKey) return;
    const apiUrl = result.argenApiUrl || 'https://argen.isira.club/api';
    try {
      await fetch(apiUrl + '/capture/interaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': result.argenApiKey },
        body: JSON.stringify({
          prompt: prompt.slice(0, 10000),
          completion: completion.slice(0, 50000),
          source: 'chatgpt',
          url: window.location.href,
          capturedAt: new Date().toISOString()
        })
      });
      browserApi.runtime.sendMessage({ type: 'INTERACTION_CAPTURED' });
    } catch (e) { /* silent */ }
  });
}

const observer = new MutationObserver(() => captureInteraction());
observer.observe(document.body, { childList: true, subtree: true, attributes: false, characterData: false });

browserApi.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'CAPTURE_MANUAL') {
    captureInteraction();
    sendResponse({ captured: true });
  }
});

console.log('[ArGen Safari] ChatGPT capturer active');
