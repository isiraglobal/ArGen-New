/**
 * Universal adapter for AI provider connections and usage sync.
 * Supports OAuth (Microsoft, Google) and API key (OpenAI, Anthropic, GitHub).
 */
const crypto = require('crypto');
const { db } = require('./supabase');

const ENCRYPTION_KEY = process.env.TOKEN_ENCRYPTION_KEY || process.env.JWT_SECRET;
const ALGORITHM = 'aes-256-cbc';

function encrypt(text) {
  if (!text) return text;
  const key = crypto.createHash('sha256').update(ENCRYPTION_KEY || 'argen-fallback-key').digest();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

function decrypt(encryptedText) {
  if (!encryptedText || !encryptedText.includes(':')) return encryptedText;
  const key = crypto.createHash('sha256').update(ENCRYPTION_KEY || 'argen-fallback-key').digest();
  const parts = encryptedText.split(':');
  const iv = Buffer.from(parts.shift(), 'hex');
  const encrypted = parts.join(':');
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

const OAUTH_CONFIGS = {
  microsoft: {
    authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    scopes: [
      'https://graph.microsoft.com/Reports.Read.All',
      'https://graph.microsoft.com/User.Read.All',
      'offline_access'
    ],
    clientId: process.env.MICROSOFT_CLIENT_ID,
    clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
    redirectUri: process.env.MICROSOFT_REDIRECT_URI
  },
  google: {
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    scopes: [
      'https://www.googleapis.com/auth/admin.reports.usage.readonly',
      'https://www.googleapis.com/auth/admin.reports.audit.readonly'
    ],
    clientId: process.env.GOOGLE_WORKSPACE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_WORKSPACE_CLIENT_SECRET,
    redirectUri: process.env.GOOGLE_WORKSPACE_REDIRECT_URI
  }
};

const API_KEY_PROVIDERS = ['openai', 'anthropic', 'github'];

async function httpGet(url, headers = {}) {
  const res = await fetch(url, { headers });
  if (!res.ok) {
    const err = new Error(`HTTP ${res.status}: ${url}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

async function httpPost(url, body, headers = {}) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', ...headers },
    body: typeof body === 'string' ? body : new URLSearchParams(body).toString()
  });
  if (!res.ok) {
    const err = new Error(`HTTP ${res.status}: ${url}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

function getOAuthUrl(provider, companyId) {
  const config = OAUTH_CONFIGS[provider];
  if (!config || !config.clientId) return null;
  const params = new URLSearchParams({
    client_id: config.clientId,
    response_type: 'code',
    redirect_uri: config.redirectUri,
    scope: config.scopes.join(' '),
    state: companyId,
    access_type: 'offline',
    prompt: 'consent'
  });
  return `${config.authUrl}?${params.toString()}`;
}

async function exchangeCode(provider, code) {
  const config = OAUTH_CONFIGS[provider];
  if (!config) throw new Error(`Provider ${provider} not supported for OAuth`);
  return httpPost(config.tokenUrl, {
    grant_type: 'authorization_code',
    code,
    redirect_uri: config.redirectUri,
    client_id: config.clientId,
    client_secret: config.clientSecret
  });
}

async function validateApiKey(provider, apiKey) {
  try {
    if (provider === 'openai') {
      await httpGet('https://api.openai.com/v1/models', {
        Authorization: `Bearer ${apiKey}`
      });
      return true;
    }
    if (provider === 'anthropic') {
      // Anthropic doesn't have a simple key validation endpoint,
      // so we make a minimal messages call to validate
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307',
          max_tokens: 1,
          messages: [{ role: 'user', content: 'test' }]
        })
      });
      return res.ok;
    }
    if (provider === 'github') {
      await httpGet('https://api.github.com/user', {
        Authorization: `Bearer ${apiKey}`,
        Accept: 'application/vnd.github+json'
      });
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

async function getOrgId(provider, accessToken) {
  try {
    if (provider === 'microsoft') {
      const data = await httpGet('https://graph.microsoft.com/v1.0/organization', {
        Authorization: `Bearer ${accessToken}`
      });
      return data.value?.[0]?.id || null;
    }
    if (provider === 'google') {
      const data = await httpGet('https://www.googleapis.com/oauth2/v3/userinfo', {
        Authorization: `Bearer ${accessToken}`
      });
      return data.hd || null;
    }
  } catch (err) {
    console.warn(`[ArGen] getOrgId failed for ${provider}:`, err.message);
  }
  return null;
}

async function markConnectionError(companyId, provider) {
  try {
    const conn = await db.collection('ai_connections')
      .where('companyId', '==', companyId)
      .where('provider', '==', provider)
      .limit(1)
      .get();
    if (!conn.empty) {
      await db.collection('ai_connections').doc(conn.docs[0].id).update({
        connectionStatus: 'error'
      });
    }
  } catch (err) {
    console.error('[ArGen] Failed to mark connection error:', err.message);
  }
}

async function syncOpenAI(apiKey) {
  const startTime = Math.floor((Date.now() - 7 * 24 * 3600 * 1000) / 1000);
  const data = await httpGet(
    `https://api.openai.com/v1/organization/usage?start_time=${startTime}`,
    { Authorization: `Bearer ${apiKey}` }
  );
  const events = [];
  for (const bucket of data?.data || []) {
    for (const result of bucket?.results || []) {
      events.push({
        provider: 'openai',
        model: result.model || 'unknown',
        inputTokens: result.input_tokens || 0,
        outputTokens: result.output_tokens || 0,
        costUsd: ((result.input_tokens || 0) * 0.000003) + ((result.output_tokens || 0) * 0.000015),
        eventType: 'completion',
        eventTimestamp: new Date(bucket.start_time * 1000).toISOString(),
        metadata: { userId: result.user_id }
      });
    }
  }
  return events;
}

async function syncAnthropic(apiKey) {
  // Anthropic does not currently expose a public usage API endpoint.
  // This function is a placeholder for when/if they add one.
  // We log the attempt so it's traceable but return empty gracefully.
  console.warn('[ArGen] Anthropic usage sync is not yet supported - no public API available');
  return [];
}

async function syncMicrosoft(accessToken) {
  // Try v1.0 first, fall back to beta if that fails
  let data;
  try {
    data = await httpGet(
      "https://graph.microsoft.com/v1.0/reports/getMicrosoft365CopilotUsageUserDetail(period='D7')",
      { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' }
    );
  } catch {
    data = await httpGet(
      "https://graph.microsoft.com/beta/reports/getMicrosoft365CopilotUsageUserDetail(period='D7')",
      { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' }
    );
  }
  const events = [];
  for (const user of data?.value || []) {
    events.push({
      provider: 'microsoft',
      model: 'copilot',
      eventType: 'copilot_usage',
      inputTokens: 0,
      outputTokens: 0,
      costUsd: 0,
      eventTimestamp: user.reportRefreshDate || new Date().toISOString(),
      metadata: {
        userEmail: user.userPrincipalName,
        copilotActive: user.isCopilotLicensed,
        lastActivity: user.lastActivityDate,
        teamsMeetings: user.meetingSummarized,
        wordDrafts: user.draftedInWord,
        outlookEmails: user.emailsDrafted
      }
    });
  }
  return events;
}

async function syncGoogle(accessToken) {
  const data = await httpGet(
    'https://admin.googleapis.com/admin/reports/v1/usage/users/all/dates/today?parameters=gemini:num_prompts_1day,gemini:num_responses_1day',
    { Authorization: `Bearer ${accessToken}` }
  );
  const events = [];
  for (const record of data?.usageReports || []) {
    const params = {};
    for (const p of record.parameters || []) params[p.name] = p.intValue || 0;
    events.push({
      provider: 'google',
      model: 'gemini',
      eventType: 'workspace_usage',
      inputTokens: params['gemini:num_prompts_1day'] || 0,
      outputTokens: params['gemini:num_responses_1day'] || 0,
      costUsd: 0,
      eventTimestamp: record.date || new Date().toISOString(),
      metadata: { userEmail: record.entity?.userEmail }
    });
  }
  return events;
}

async function syncGitHub(accessToken) {
  const orgs = await httpGet('https://api.github.com/user/orgs', {
    Authorization: `Bearer ${accessToken}`,
    Accept: 'application/vnd.github+json'
  });
  const events = [];
  for (const org of orgs || []) {
    try {
      const usage = await httpGet(
        `https://api.github.com/orgs/${org.login}/copilot/usage`,
        { Authorization: `Bearer ${accessToken}`, Accept: 'application/vnd.github+json' }
      );
      for (const day of usage || []) {
        events.push({
          provider: 'github',
          model: 'copilot',
          eventType: 'code_suggestion',
          inputTokens: day.total_suggestions_count || 0,
          outputTokens: day.total_acceptances_count || 0,
          costUsd: 0,
          eventTimestamp: day.day || new Date().toISOString(),
          metadata: {
            org: org.login,
            suggestions: day.total_suggestions_count,
            acceptances: day.total_acceptances_count,
            acceptanceRate: day.total_suggestions_count > 0
              ? ((day.total_acceptances_count / day.total_suggestions_count) * 100).toFixed(1)
              : 0,
            activeUsers: day.total_active_users
          }
        });
      }
    } catch {
      continue;
    }
  }
  return events;
}

async function updateDailyAggregates(companyId, provider) {
  const eventsSnap = await db.collection('ai_usage_events')
    .where('companyId', '==', companyId)
    .where('provider', '==', provider)
    .get();

  const grouped = {};
  for (const doc of eventsSnap.docs) {
    const d = doc.data();
    const date = d.eventTimestamp?.split('T')[0];
    if (!date) continue;
    const userId = d.userId || d.metadata?.userEmail || 'unknown';
    const key = `${userId}_${date}`;
    if (!grouped[key]) {
      grouped[key] = { userId, date, requests: 0, inputTokens: 0, outputTokens: 0, cost: 0 };
    }
    grouped[key].requests++;
    grouped[key].inputTokens += d.inputTokens || 0;
    grouped[key].outputTokens += d.outputTokens || 0;
    grouped[key].cost += parseFloat(d.costUsd) || 0;
  }

  for (const agg of Object.values(grouped)) {
    const existing = await db.collection('ai_usage_daily')
      .where('companyId', '==', companyId)
      .where('provider', '==', provider)
      .where('date', '==', agg.date)
      .limit(1)
      .get();

    const record = {
      companyId,
      userId: agg.userId,
      provider,
      date: agg.date,
      totalRequests: agg.requests,
      totalInputTokens: agg.inputTokens,
      totalOutputTokens: agg.outputTokens,
      totalCostUsd: agg.cost
    };

    if (existing.empty) {
      await db.collection('ai_usage_daily').add(record);
    } else {
      await db.collection('ai_usage_daily').doc(existing.docs[0].id).update(record);
    }
  }
}

async function syncUsage(provider, companyId, accessToken) {
  console.log(`[ArGen] Syncing ${provider} for company ${companyId}`);
  try {
    let events = [];
    if (provider === 'openai') events = await syncOpenAI(accessToken);
    else if (provider === 'anthropic') events = await syncAnthropic(accessToken);
    else if (provider === 'microsoft') events = await syncMicrosoft(accessToken);
    else if (provider === 'google') events = await syncGoogle(accessToken);
    else if (provider === 'github') events = await syncGitHub(accessToken);

    for (const event of events) {
      await db.collection('ai_usage_events').add({ ...event, companyId });
    }

    await updateDailyAggregates(companyId, provider);

    const conn = await db.collection('ai_connections')
      .where('companyId', '==', companyId)
      .where('provider', '==', provider)
      .limit(1)
      .get();
    if (!conn.empty) {
      await db.collection('ai_connections').doc(conn.docs[0].id).update({
        lastSyncedAt: new Date().toISOString(),
        connectionStatus: 'active'
      });
    }

    console.log(`[ArGen] Synced ${events.length} events from ${provider}`);
    return { count: events.length };
  } catch (err) {
    console.error(`[ArGen] Sync error for ${provider}:`, err.message);
    if (err.status === 401 || err.status === 403 || err.status === 429) {
      await markConnectionError(companyId, provider);
    }
    throw err;
  }
}

async function syncAllConnections() {
  console.log('[ArGen Scheduler] Starting global AI usage sync...');
  try {
    const connections = await db.collection('ai_connections')
      .where('connectionStatus', '==', 'active')
      .get();
    let synced = 0;
    for (const doc of connections.docs) {
      const row = doc.data();
      const { companyId, provider } = row;
      const accessToken = decrypt(row.accessToken);
      if (!accessToken) continue;
      try {
        await syncUsage(provider, companyId, accessToken);
        synced++;
      } catch {
        // logged inside syncUsage
      }
    }
    console.log(`[ArGen Scheduler] Synced ${synced}/${connections.docs.length} connections`);
    return { synced, total: connections.docs.length };
  } catch (err) {
    console.error('[ArGen Scheduler] Sync failed:', err.message);
    throw err;
  }
}

module.exports = {
  getOAuthUrl,
  exchangeCode,
  validateApiKey,
  getOrgId,
  syncUsage,
  syncAllConnections,
  updateDailyAggregates,
  API_KEY_PROVIDERS,
  OAUTH_CONFIGS,
  encrypt,
  decrypt
};
