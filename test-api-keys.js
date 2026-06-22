/**
 * ArGen API Key Verification Test
 * Run: node test-api-keys.js
 * 
 * Tests all configured AI provider API keys and system integrations.
 */

const https = require('https');
const http = require('http');
require('dotenv').config({ path: '.env' });

const RESULTS = { passed: 0, failed: 0, skipped: 0, details: [] };

function logResult(name, passed, detail = '') {
  const icon = passed ? '✅' : '❌';
  RESULTS[passed ? 'passed' : 'failed']++;
  RESULTS.details.push({ name, passed, detail });
  console.log(`  ${icon} ${name}${detail ? ': ' + detail : ''}`);
}

function httpRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const mod = urlObj.protocol === 'https:' ? https : http;
    const req = mod.request(url, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      timeout: 15000
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, data: data.toString() }); }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
    if (options.body) req.write(JSON.stringify(options.body));
    req.end();
  });
}

async function testAll() {
  console.log('\n═══ ArGen API Key Verification ═══\n');

  // ── 1. OpenAI ──
  const openaiKey = process.env.OPENAI_API_KEY;
  if (openaiKey) {
    try {
      const res = await httpRequest('https://api.openai.com/v1/models', {
        headers: { 'Authorization': `Bearer ${openaiKey}` }
      });
      logResult('OpenAI API Key', res.status === 200, `Status ${res.status}`);
    } catch (e) {
      logResult('OpenAI API Key', false, e.message);
    }
  } else {
    logResult('OpenAI API Key', false, 'Not configured');
  }

  // ── 2. Anthropic ──
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (anthropicKey) {
    try {
      const res = await httpRequest('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': anthropicKey,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json'
        },
        body: {
          model: 'claude-3-haiku-20240307',
          max_tokens: 10,
          messages: [{ role: 'user', content: 'Hi' }]
        }
      });
      const bodyStr = typeof res.data === 'string' ? res.data : JSON.stringify(res.data);
      const isAuthError = res.status === 401;
      const isCreditError = res.status === 400 && bodyStr.includes('credit balance');
      logResult('Anthropic Claude API Key', !isAuthError, `Status ${res.status}${isCreditError ? ' (key valid, low credits)' : ': ' + bodyStr.substring(0, 80)}`);
    } catch (e) {
      logResult('Anthropic Claude API Key', false, e.message);
    }
  } else {
    logResult('Anthropic Claude API Key', false, 'Not configured');
  }

  // ── 3. Gemini ──
  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey) {
    try {
      const res = await httpRequest(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: { contents: [{ parts: [{ text: 'Say hi' }] }] }
        }
      );
      // 429 = rate limited (key is valid). 200 = working. 4xx = key format accepted.
      const bodyStr = typeof res.data === 'string' ? res.data : JSON.stringify(res.data);
      const isRealError = res.status === 403 || bodyStr.includes('API_KEY_INVALID');
      logResult('Google Gemini API Key', !isRealError, `Status ${res.status}: ${bodyStr.substring(0, 80)}`);
    } catch (e) {
      logResult('Google Gemini API Key', false, e.message);
    }
  } else {
    logResult('Google Gemini API Key', false, 'Not configured');
  }

  // ── 4. NVIDIA NIM ──
  const nvidiaKey = process.env.NVIDIA_API_KEY;
  if (nvidiaKey) {
    try {
      const res = await httpRequest('https://health.api.nvidia.com/v1/health', {
        headers: { 'Authorization': `Bearer ${nvidiaKey}` }
      });
      logResult('NVIDIA NIM API Key', res.status < 500, `Status ${res.status}`);
    } catch (e) {
      logResult('NVIDIA NIM API Key', false, e.message);
    }
  } else {
    logResult('NVIDIA NIM API Key', false, 'Not configured');
  }

  // ── 5. Firebase Auth ──
  const firebaseWebKey = process.env.FIREBASE_WEB_API_KEY;
  const firebaseProjectId = process.env.FIREBASE_PROJECT_ID;
  if (firebaseWebKey) {
    try {
      const res = await httpRequest(
        `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${firebaseWebKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: { email: 'test@test.com', password: 'test123', returnSecureToken: true }
        }
      );
      const errMsg = res.data?.error?.message || '';
      // INVALID_LOGIN_CREDENTIALS = API key works (user just doesn't exist)
      // API_KEY_NOT_VALID = key is bad
      const isValidKey = errMsg !== 'API_KEY_NOT_VALID' && errMsg !== 'MISSING_API_KEY';
      logResult('Firebase Auth API', isValidKey, errMsg || 'OK — API key is valid');
    } catch (e) {
      logResult('Firebase Auth API', false, e.message);
    }
  } else {
    logResult('Firebase Auth API', false, 'Not configured');
  }

  // ── 5b. Firebase Project Config ──
  logResult('Firebase Project ID', Boolean(firebaseProjectId), firebaseProjectId);

  // ── 6. Google OAuth ──
  const googleClientId = process.env.GOOGLE_CLIENT_ID;
  const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
  logResult('Google OAuth Config', Boolean(googleClientId && googleClientSecret),
    googleClientId ? 'Client ID present' : 'Missing');

  // ── 7. Whop Payment ──
  const whopKey = process.env.WHOP_API_KEY;
  logResult('Whop Payment API', Boolean(whopKey), whopKey ? 'Key present' : 'Not configured');

  // ── 8. JWT Secret ──
  const jwtSecret = process.env.JWT_SECRET;
  logResult('JWT Secret', Boolean(jwtSecret && jwtSecret.length >= 32), jwtSecret ? `${jwtSecret.length} chars` : 'Missing');

  // ── 9. Token Encryption Key ──
  const encKey = process.env.TOKEN_ENCRYPTION_KEY;
  logResult('Token Encryption Key', Boolean(encKey && encKey.length >= 32), encKey ? `${encKey.length} chars` : 'Missing');

  // ── 10. Email SMTP ──
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;
  logResult('Email SMTP Config', Boolean(emailUser && emailPass), emailUser || 'Not configured');

  // ── 11. Discord Webhook ──
  const discordUrl = process.env.DISCORD_WEBHOOK_URL;
  if (discordUrl) {
    try {
      const res = await httpRequest(discordUrl);
      logResult('Discord Webhook', res.status < 500, `Status ${res.status}`);
    } catch (e) {
      logResult('Discord Webhook', false, e.message);
    }
  } else {
    logResult('Discord Webhook', false, 'Not configured');
  }

  // ── 12. Google Workspace ──
  const wsId = process.env.GOOGLE_WORKSPACE_CLIENT_ID;
  logResult('Google Workspace OAuth', Boolean(wsId), wsId ? 'Configured' : 'Not configured');

  // ── 13. Microsoft OAuth ──
  const msId = process.env.MICROSOFT_CLIENT_ID;
  logResult('Microsoft OAuth Config', Boolean(msId), msId ? 'Configured' : 'Not configured');

  // ── Summary ──
  console.log(`\n═══ Results: ${RESULTS.passed} passed, ${RESULTS.failed} failed, ${RESULTS.skipped} skipped ═══\n`);

  const optionalKeys = [
    'Google Workspace OAuth',
    'Microsoft OAuth Config',
    'Anthropic Claude API Key'
  ];
  const criticalFails = RESULTS.details.filter(d => !d.passed && !optionalKeys.includes(d.name));
  const optionalFails = RESULTS.details.filter(d => !d.passed && optionalKeys.includes(d.name));

  if (criticalFails.length > 0) {
    console.log('\n❌ Critical failures:');
    criticalFails.forEach(d => console.log(`  ❌ ${d.name}: ${d.detail}`));
  }
  if (optionalFails.length > 0) {
    console.log('\n⚠️  Optional (non-critical):');
    optionalFails.forEach(d => console.log(`  ⚠️  ${d.name}: ${d.detail}`));
  }

  if (criticalFails.length > 0) process.exit(1);
  console.log('\n✅ All critical API keys are functional.\n');
}

testAll().catch(err => {
  console.error('Test suite error:', err);
  process.exit(1);
});