const browserApi = typeof browser !== 'undefined' ? browser : chrome;

async function init() {
  const result = await browserApi.storage.sync.get(['argenApiKey', 'argenApiUrl', 'argenSessionId', 'argenCaptureCount', 'argenLastSync']);

  document.getElementById('apiKey').value = result.argenApiKey || '';
  document.getElementById('apiUrl').value = result.argenApiUrl || 'https://argen.isira.club/api';
  document.getElementById('captureCount').textContent = result.argenCaptureCount || 0;
  document.getElementById('sessionId').textContent = result.argenSessionId ? result.argenSessionId.slice(0, 12) + '...' : '—';
  document.getElementById('lastSync').textContent = result.argenLastSync ? new Date(result.argenLastSync).toLocaleString() : '—';

  const statusEl = document.getElementById('statusText');
  if (result.argenApiKey) {
    statusEl.textContent = 'Connected';
    statusEl.style.color = '#00ff88';
  } else {
    statusEl.textContent = 'Not configured';
    statusEl.style.color = '#ff6b6b';
  }
}

document.getElementById('captureNow').addEventListener('click', () => {
  browserApi.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
      browserApi.tabs.sendMessage(tabs[0].id, { type: 'CAPTURE_MANUAL' });
    }
  });
});

document.getElementById('openDashboard').addEventListener('click', () => {
  browserApi.tabs.create({ url: 'https://argen.isira.club/dashboard' });
});

document.getElementById('apiKey').addEventListener('change', (e) => {
  browserApi.storage.sync.set({ argenApiKey: e.target.value });
});

document.getElementById('apiUrl').addEventListener('change', (e) => {
  browserApi.storage.sync.set({ argenApiUrl: e.target.value });
});

init();
