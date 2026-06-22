// ─────────────────────────────────────────────────────────────────────────────
// ArGen AI Usage Tracker — Background Service Worker
// Handles: API communication, event queuing, batch flushing, alarm scheduling
// ─────────────────────────────────────────────────────────────────────────────

const ARGEN_API = 'https://argen.isira.club/api/capture/interaction';
const ARGEN_BATCH_API = 'https://argen.isira.club/api/capture/batch';
const EXTENSION_VERSION = '1.0.0';
const FLUSH_INTERVAL_SECONDS = 15;
const QUEUE_MAX = 10; // flush early if queue exceeds this
const MAX_RETRIES = 3;

// In-memory event queue (survives within a service-worker lifetime)
let eventQueue = [];
let flushInProgress = false;
let todayCount = 0;
let todayDate = new Date().toDateString();

// ─── Alarm: periodic flush ───────────────────────────────────────────────────
chrome.alarms.create('argen-flush', { periodInMinutes: FLUSH_INTERVAL_SECONDS / 60 });

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'argen-flush') {
    flushQueue();
  }
});

// ─── Message handler: receives events from content scripts ───────────────────
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'INTERACTION_CAPTURED') {
    handleCapturedInteraction(message.payload, sender);
    sendResponse({ status: 'queued' });
    return true;
  }

  if (message.type === 'GET_STATUS') {
    getStatus().then(sendResponse);
    return true;
  }

  if (message.type === 'GET_RECENT') {
    getRecentEvents().then(sendResponse);
    return true;
  }

  if (message.type === 'FLUSH_NOW') {
    flushQueue().then(() => sendResponse({ ok: true }));
    return true;
  }

  if (message.type === 'TOKEN_DATA') {
    // Enrich last queued event with real token counts from fetch interceptor
    enrichLastEvent(message.payload);
    sendResponse({ status: 'enriched' });
    return true;
  }
});

// ─── Handle a newly captured interaction ─────────────────────────────────────
async function handleCapturedInteraction(payload, sender) {
  const settings = await getSettings();

  if (!settings.enabled) return;
  if (!settings.apiKey) {
    console.warn('[ArGen] No API key set. Visit extension popup to configure.');
    return;
  }

  // Reset daily counter if new day
  const today = new Date().toDateString();
  if (today !== todayDate) {
    todayDate = today;
    todayCount = 0;
    await chrome.storage.local.set({ todayCount: 0, todayDate });
  }

  const event = {
    ...payload,
    _id: generateId(),
    _capturedAt: new Date().toISOString(),
    _tabUrl: sender.tab?.url || '',
    _tabId: sender.tab?.id || null,
  };

  eventQueue.push(event);

  // Store for popup "recent" list
  await storeRecentEvent(event);

  // Flush early if queue is full
  if (eventQueue.length >= QUEUE_MAX) {
    flushQueue();
  }

  // Update badge
  todayCount++;
  await chrome.storage.local.set({ todayCount, todayDate });
  updateBadge(todayCount);
}

// ─── Flush queue to ArGen API ────────────────────────────────────────────────
async function flushQueue() {
  if (flushInProgress || eventQueue.length === 0) return;

  const settings = await getSettings();
  if (!settings.apiKey || !settings.enabled) {
    eventQueue = [];
    return;
  }

  flushInProgress = true;
  const batch = [...eventQueue];
  eventQueue = [];

  try {
    if (batch.length === 1) {
      // Single event — use /interaction endpoint
      await postWithRetry(ARGEN_API, buildPayload(batch[0]), settings.apiKey, settings.userId);
    } else {
      // Multiple — use /batch endpoint
      const interactions = batch.map(e => buildPayload(e));
      await postWithRetry(
        ARGEN_BATCH_API,
        { interactions },
        settings.apiKey,
        settings.userId,
        true
      );
    }
    await chrome.storage.local.set({ lastFlushAt: new Date().toISOString(), lastFlushStatus: 'ok', lastFlushCount: batch.length });
  } catch (err) {
    console.error('[ArGen] Flush failed:', err.message);
    // Re-queue failed events (up to a max to avoid infinite growth)
    const requeued = batch.slice(0, 50);
    eventQueue = [...requeued, ...eventQueue].slice(0, 100);
    await chrome.storage.local.set({ lastFlushStatus: 'error', lastFlushError: err.message });
  } finally {
    flushInProgress = false;
  }
}

// ─── POST with retry ─────────────────────────────────────────────────────────
async function postWithRetry(url, body, apiKey, userId, isBatch = false) {
  const headers = {
    'Content-Type': 'application/json',
    'x-api-key': apiKey,
    'x-source': 'browser-extension',
    'x-agent-version': EXTENSION_VERSION,
  };
  if (userId) headers['x-user-id'] = userId;

  let lastErr;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });

      if (res.ok) return await res.json();

      const errText = await res.text();
      // 4xx errors are not retryable
      if (res.status >= 400 && res.status < 500) {
        throw new Error(`[${res.status}] ${errText}`);
      }
      lastErr = new Error(`[${res.status}] ${errText}`);
    } catch (err) {
      lastErr = err;
      if (attempt < MAX_RETRIES - 1) {
        // Exponential backoff: 1s, 2s, 4s
        await sleep(1000 * Math.pow(2, attempt));
      }
    }
  }
  throw lastErr;
}

// ─── Build clean payload for API ─────────────────────────────────────────────
function buildPayload(event) {
  return {
    provider: event.provider,
    model: event.model || 'unknown',
    eventType: event.eventType || 'chat',
    inputTokens: event.inputTokens || 0,
    outputTokens: event.outputTokens || 0,
    costUsd: 0,
    prompt: event.prompt || '',
    completion: event.completion || '',
    timestamp: event._capturedAt,
    context: {
      url: event._tabUrl || '',
      intent: event.intent || '',
      source: 'browser-extension',
    },
  };
}

// ─── Enrich last queued event with real token data ────────────────────────────
function enrichLastEvent({ promptTokens, completionTokens }) {
  if (eventQueue.length > 0) {
    const last = eventQueue[eventQueue.length - 1];
    last.inputTokens = promptTokens || last.inputTokens;
    last.outputTokens = completionTokens || last.outputTokens;
  }
}

// ─── Store recent events for popup display ────────────────────────────────────
async function storeRecentEvent(event) {
  const { recentEvents = [] } = await chrome.storage.local.get('recentEvents');
  const recent = [
    {
      provider: event.provider,
      model: event.model,
      promptLength: (event.prompt || '').length,
      completionLength: (event.completion || '').length,
      inputTokens: event.inputTokens,
      outputTokens: event.outputTokens,
      capturedAt: event._capturedAt,
    },
    ...recentEvents,
  ].slice(0, 20); // keep last 20
  await chrome.storage.local.set({ recentEvents: recent });
}

// ─── Get recent events ────────────────────────────────────────────────────────
async function getRecentEvents() {
  const { recentEvents = [] } = await chrome.storage.local.get('recentEvents');
  return recentEvents;
}

// ─── Get overall status ───────────────────────────────────────────────────────
async function getStatus() {
  const settings = await getSettings();
  const local = await chrome.storage.local.get(['todayCount', 'lastFlushAt', 'lastFlushStatus', 'lastFlushError', 'recentEvents']);
  return {
    connected: !!settings.apiKey,
    enabled: settings.enabled,
    apiKeyMasked: settings.apiKey ? `${settings.apiKey.slice(0, 6)}...${settings.apiKey.slice(-4)}` : null,
    todayCount: local.todayCount || 0,
    queuedCount: eventQueue.length,
    lastFlushAt: local.lastFlushAt || null,
    lastFlushStatus: local.lastFlushStatus || null,
    lastFlushError: local.lastFlushError || null,
  };
}

// ─── Settings helpers ─────────────────────────────────────────────────────────
async function getSettings() {
  const defaults = { apiKey: '', enabled: true, userId: '' };
  const stored = await chrome.storage.sync.get(defaults);
  return stored;
}

// ─── Update extension badge ───────────────────────────────────────────────────
function updateBadge(count) {
  const text = count > 99 ? '99+' : String(count);
  chrome.action?.setBadgeText({ text }).catch(() => {});
  chrome.action?.setBadgeBackgroundColor({ color: '#00ff88' }).catch(() => {});
  // Firefox uses browserAction
  chrome.browserAction?.setBadgeText({ text });
  chrome.browserAction?.setBadgeBackgroundColor({ color: '#00ff88' });
}

// ─── Utilities ────────────────────────────────────────────────────────────────
function generateId() {
  return `ev_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Flush any remaining events on startup (in case SW was killed mid-flush)
flushQueue();
