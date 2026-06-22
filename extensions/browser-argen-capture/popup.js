// ArGen Browser Extension — Popup Logic

document.addEventListener('DOMContentLoaded', async () => {
  const apiKeyInput = document.getElementById('apiKeyInput');
  const apiUrlInput = document.getElementById('apiUrlInput');
  const saveBtn = document.getElementById('saveBtn');
  const captureNowBtn = document.getElementById('captureNowBtn');
  const openDashboardBtn = document.getElementById('openDashboardBtn');
  const statusDot = document.getElementById('statusDot');
  const statusText = document.getElementById('statusText');
  const currentSite = document.getElementById('currentSite');
  const captureCount = document.getElementById('captureCount');
  const sessionCount = document.getElementById('sessionCount');
  const errorMsg = document.getElementById('errorMsg');
  const successMsg = document.getElementById('successMsg');

  // Load saved config
  const result = await chrome.storage.sync.get([
    'argenApiKey', 'argenApiUrl', 'argenCaptureCount',
    'argenSessionId', 'argenCurrentSite', 'argenAutoCapture'
  ]);

  if (result.argenApiKey) apiKeyInput.value = result.argenApiKey;
  if (result.argenApiUrl) apiUrlInput.value = result.argenApiUrl;
  if (result.argenCaptureCount) captureCount.textContent = result.argenCaptureCount;
  if (result.argenCurrentSite) currentSite.textContent = `On: ${result.argenCurrentSite}`;

  // Update status
  if (result.argenApiKey) {
    statusDot.className = 'status-dot active';
    statusText.textContent = 'Connected';
  }

  // Save config
  saveBtn.addEventListener('click', async () => {
    const apiKey = apiKeyInput.value.trim();
    const apiUrl = apiUrlInput.value.trim() || 'https://argen.isira.club/api';

    if (!apiKey || !apiKey.startsWith('ag_')) {
      errorMsg.style.display = 'block';
      successMsg.style.display = 'none';
      return;
    }

    errorMsg.style.display = 'none';
    await chrome.storage.sync.set({
      argenApiKey: apiKey,
      argenApiUrl: apiUrl,
      argenLastSync: new Date().toISOString()
    });

    statusDot.className = 'status-dot active';
    statusText.textContent = 'Connected';
    successMsg.style.display = 'block';
    setTimeout(() => { successMsg.style.display = 'none'; }, 2000);
  });

  // Capture current page
  captureNowBtn.addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      chrome.tabs.sendMessage(tab.id, { type: 'CAPTURE_MANUAL' });
      const count = parseInt(captureCount.textContent) + 1;
      captureCount.textContent = count;
      await chrome.storage.sync.set({ argenCaptureCount: count });
    }
  });

  // Open dashboard
  openDashboardBtn.addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://argen.isira.club/dashboard' });
  });
});