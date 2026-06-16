const oauthProviders = ['microsoft', 'google'];
const apiKeyProviders = ['openai', 'anthropic', 'github'];
const allProviders = [...oauthProviders, ...apiKeyProviders];

async function loadConnections() {
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  if (user && user.role === 'member') {
    window.location.href = '/dashboard';
    return;
  }

  const params = new URLSearchParams(window.location.search);
  if (params.get('connected')) {
    showAlert(`Successfully connected ${params.get('connected')}. Syncing usage data...`, 'success');
    window.history.replaceState({}, '', '/connect');
  }
  if (params.get('error')) {
    showAlert(`Connection failed for ${params.get('provider') || 'provider'}. Please try again.`, 'error');
    window.history.replaceState({}, '', '/connect');
  }

  try {
    const data = await argenApi.getConnections();
    const connected = {};
    for (const conn of data.connections || []) {
      connected[conn.provider] = conn;
    }

    for (const provider of allProviders) {
      const card = document.getElementById(`card-${provider}`);
      if (!card) continue;

      const statusEl = card.querySelector('.status');
      const lastSyncEl = card.querySelector('.last-sync');
      const connectBtn = card.querySelector('.connect-btn');
      const syncBtn = card.querySelector('.sync-btn');

      if (connected[provider]) {
        card.classList.add('connected');
        statusEl.textContent = 'Connected';
        statusEl.className = 'status provider-status connected';
        lastSyncEl.textContent = connected[provider].lastSynced
          ? `Last synced: ${new Date(connected[provider].lastSynced).toLocaleString()}`
          : 'Sync pending...';
        connectBtn.textContent = 'Disconnect';
        connectBtn.onclick = () => disconnect(connected[provider].id);
        syncBtn.style.display = 'inline-block';
        syncBtn.onclick = () => syncProvider(provider);
      } else {
        card.classList.remove('connected');
        statusEl.textContent = 'Not connected';
        statusEl.className = 'status provider-status disconnected';
        lastSyncEl.textContent = '';
        connectBtn.textContent = 'Connect';
        connectBtn.onclick = () => connect(provider);
        syncBtn.style.display = 'none';
      }
    }
  } catch (err) {
    console.error('Failed to load connections:', err);
    showAlert('Could not load connections. Check your session and try again.', 'error');
  }
}

async function connect(provider) {
  if (oauthProviders.includes(provider)) {
    try {
      const data = await argenApi.connectOAuth(provider);
      window.location.href = data.url;
    } catch (err) {
      showAlert(err.message, 'error');
    }
  } else {
    const apiKey = prompt(`Enter your ${provider} API key or token:`);
    if (!apiKey) return;
    try {
      await argenApi.connectApiKey({ provider, apiKey });
      showAlert(`${provider} connected successfully. Syncing usage...`, 'success');
      loadConnections();
    } catch (err) {
      showAlert(err.message, 'error');
    }
  }
}

async function disconnect(connectionId) {
  if (!confirm('Disconnect this provider? Usage data will be retained.')) return;
  try {
    await argenApi.disconnectConnection(connectionId);
    showAlert('Provider disconnected.', 'success');
    loadConnections();
  } catch (err) {
    showAlert(err.message, 'error');
  }
}

async function syncProvider(provider) {
  try {
    await argenApi.syncProvider(provider);
    showAlert(`${provider} sync complete.`, 'success');
    loadConnections();
  } catch (err) {
    showAlert(err.message, 'error');
  }
}

function showAlert(message, type) {
  const el = document.getElementById('connectAlert');
  el.textContent = message;
  el.style.display = 'block';
  el.style.background = type === 'success' ? 'rgba(0,255,136,0.1)' : 'rgba(255,68,68,0.1)';
  el.style.border = `1px solid ${type === 'success' ? '#00ff88' : '#ff4444'}`;
  el.style.color = type === 'success' ? '#00ff88' : '#ff4444';
  setTimeout(() => { el.style.display = 'none'; }, 5000);
}

document.addEventListener('DOMContentLoaded', loadConnections);
