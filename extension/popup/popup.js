// ─────────────────────────────────────────────────────────────────────────────
// ArGen Extension Popup — JavaScript
// Handles: settings load/save, status display, recent events list, sync trigger
// ─────────────────────────────────────────────────────────────────────────────

const DASHBOARD_URL = 'https://argen.isira.club/dashboard';
const API_KEYS_URL = 'https://argen.isira.club/connect'; // or admin page for API keys

// ── DOM refs ──────────────────────────────────────────────────────────────────
const statusDot = document.getElementById('status-dot');
const statusText = document.getElementById('status-text');
const todayCountEl = document.getElementById('today-count');
const queueCountEl = document.getElementById('queue-count');
const lastFlushEl = document.getElementById('last-flush');
const toggleEl = document.getElementById('toggle-enabled');
const apiKeyInput = document.getElementById('api-key-input');
const userIdInput = document.getElementById('user-id-input');
const saveKeyBtn = document.getElementById('save-key-btn');
const recentList = document.getElementById('recent-list');
const flushBtn = document.getElementById('flush-btn');
const openDashboard = document.getElementById('open-dashboard');
const openDashboardFooter = document.getElementById('open-dashboard-footer');

// ── Init ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  await loadSettings();
  await refreshStatus();
  await loadRecentEvents();

  // Auto-refresh status every 5s while popup is open
  setInterval(refreshStatus, 5000);
  setInterval(loadRecentEvents, 5000);
});

// ── Load saved settings into UI ───────────────────────────────────────────────
async function loadSettings() {
  const settings = await chrome.storage.sync.get({ apiKey: '', enabled: true, userId: '' });
  if (settings.apiKey) {
    apiKeyInput.value = settings.apiKey;
  }
  if (settings.userId) {
    userIdInput.value = settings.userId;
  }
  toggleEl.checked = settings.enabled !== false;
}

// ── Save settings ─────────────────────────────────────────────────────────────
saveKeyBtn.addEventListener('click', async () => {
  const key = apiKeyInput.value.trim();
  const userId = userIdInput.value.trim();

  if (!key) {
    shake(apiKeyInput);
    return;
  }

  await chrome.storage.sync.set({ apiKey: key, userId, enabled: toggleEl.checked });

  // Visual feedback
  apiKeyInput.classList.add('flash');
  saveKeyBtn.textContent = 'Saved ✓';
  saveKeyBtn.style.background = '#00ff88';
  setTimeout(() => {
    saveKeyBtn.textContent = 'Save';
    apiKeyInput.classList.remove('flash');
  }, 1500);

  await refreshStatus();
});

// Save on Enter key
apiKeyInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') saveKeyBtn.click();
});

// ── Toggle tracking on/off ────────────────────────────────────────────────────
toggleEl.addEventListener('change', async () => {
  await chrome.storage.sync.set({ enabled: toggleEl.checked });
  await refreshStatus();
});

// ── Flush button ──────────────────────────────────────────────────────────────
flushBtn.addEventListener('click', async () => {
  flushBtn.textContent = '↑ Syncing…';
  flushBtn.disabled = true;

  try {
    await chrome.runtime.sendMessage({ type: 'FLUSH_NOW' });
    flushBtn.textContent = '✓ Synced';
    setTimeout(() => {
      flushBtn.textContent = '↑ Sync';
      flushBtn.disabled = false;
    }, 2000);
  } catch (e) {
    flushBtn.textContent = '↑ Sync';
    flushBtn.disabled = false;
  }

  await refreshStatus();
});

// ── Open dashboard links ──────────────────────────────────────────────────────
openDashboard.addEventListener('click', (e) => {
  e.preventDefault();
  chrome.tabs.create({ url: API_KEYS_URL });
});

openDashboardFooter.addEventListener('click', (e) => {
  e.preventDefault();
  chrome.tabs.create({ url: DASHBOARD_URL });
});

// ── Refresh status from service worker ───────────────────────────────────────
async function refreshStatus() {
  try {
    const status = await chrome.runtime.sendMessage({ type: 'GET_STATUS' });

    // Status dot + text
    if (!status.connected) {
      statusDot.className = 'status-dot error';
      statusText.textContent = 'No API key — tracking paused';
    } else if (!status.enabled) {
      statusDot.className = 'status-dot disabled';
      statusText.textContent = 'Tracking disabled';
    } else {
      statusDot.className = 'status-dot connected';
      statusText.textContent = `Connected · ${status.apiKeyMasked}`;
    }

    // Stats
    todayCountEl.textContent = formatNumber(status.todayCount || 0);
    queueCountEl.textContent = formatNumber(status.queuedCount || 0);

    if (status.lastFlushAt) {
      lastFlushEl.textContent = timeAgo(status.lastFlushAt);
    } else {
      lastFlushEl.textContent = 'Never';
    }

    // Toggle sync
    toggleEl.checked = status.enabled !== false;

  } catch (e) {
    statusDot.className = 'status-dot error';
    statusText.textContent = 'Extension error — try reloading';
  }
}

// ── Load recent events ────────────────────────────────────────────────────────
async function loadRecentEvents() {
  try {
    const events = await chrome.runtime.sendMessage({ type: 'GET_RECENT' });

    if (!events || events.length === 0) {
      recentList.innerHTML = `
        <div class="empty-state">
          No captures yet.<br/>Visit ChatGPT, Claude, or Gemini to start tracking.
        </div>`;
      return;
    }

    recentList.innerHTML = events.slice(0, 8).map(ev => `
      <div class="capture-item">
        <span class="provider-badge provider-${getProviderClass(ev.provider)}">${formatProvider(ev.provider)}</span>
        <div class="capture-meta">
          <div class="capture-model">${escapeHtml(ev.model || 'unknown')}</div>
          <div class="capture-tokens">${formatNumber(ev.inputTokens || 0)}↑ ${formatNumber(ev.outputTokens || 0)}↓ tokens</div>
        </div>
        <span class="capture-time">${timeAgo(ev.capturedAt)}</span>
      </div>
    `).join('');
  } catch (e) {
    // ignore
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatProvider(provider) {
  const map = {
    openai: 'ChatGPT',
    anthropic: 'Claude',
    gemini: 'Gemini',
    microsoft: 'Copilot',
    perplexity: 'Perplexity',
    github: 'Copilot',
    copilot: 'Copilot',
  };
  return map[provider] || provider || '?';
}

function getProviderClass(provider) {
  const map = {
    openai: 'openai',
    chatgpt: 'openai',
    anthropic: 'anthropic',
    claude: 'anthropic',
    gemini: 'gemini',
    microsoft: 'microsoft',
    copilot: 'microsoft',
    perplexity: 'perplexity',
    github: 'github',
  };
  return map[provider] || 'github';
}

function formatNumber(n) {
  if (n === undefined || n === null || isNaN(n)) return '0';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
  return String(n);
}

function timeAgo(isoString) {
  if (!isoString) return '';
  const diff = (Date.now() - new Date(isoString).getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function shake(el) {
  el.style.animation = 'none';
  el.offsetHeight;
  el.style.animation = null;
  el.style.borderColor = '#ef4444';
  setTimeout(() => { el.style.borderColor = ''; }, 1500);
}
