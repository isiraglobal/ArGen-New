/**
 * ArGen Demo Usage Seed Script
 * Populates the database with realistic tracking data so dashboards show live numbers.
 * 
 * Run: node backend/scripts/seed-demo-usage.js
 * 
 * This generates:
 *   - 5 demo users with transactions spanning 30 days
 *   - Mixed OpenAI / Anthropic / Gemini usage
 *   - Realistic token counts, costs, models
 *   - Per-user transaction stats
 *   - Daily aggregate records
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

function createBatch(fs) {
  if (fs && typeof fs.batch === 'function') {
    const b = fs.batch();
    // Return minimal wrapper that lets us use .set/.delete/.update with native refs
    // but also tracks count so we can flush at 400
    let count = 0;
    const ogCommit = b.commit.bind(b);
    b._ogSet = b.set.bind(b);
    b._ogDelete = b.delete.bind(b);
    b.set = function(ref, data, opts) {
      if (opts && opts.merge) b._ogSet(ref, data, { merge: true });
      else b._ogSet(ref, data);
      count++;
    };
    b.delete = function(ref) { b._ogDelete(ref); count++; };
    b.count = () => count;
    return b;
  }
  // Fallback for mock mode: individual ops
  const ops = [];
  return {
    set: (ref, data, opts) => ops.push({ type: 'set', ref, data, opts }),
    delete: (ref) => ops.push({ type: 'delete', ref }),
    update: (ref, data) => ops.push({ type: 'update', ref, data }),
    count: () => ops.length,
    commit: async () => {
      for (const op of ops) {
        if (op.type === 'set') await op.ref.set(op.data, op.opts);
        else if (op.type === 'delete') await op.ref.delete();
        else if (op.type === 'update') await op.ref.update(op.data);
      }
    }
  };
}

async function seed() {
  console.log('═══ ArGen Demo Usage Seed ═══\n');

  function wrapQuery(q) {
    return {
      get: async () => {
        const snap = await q.get();
        return {
          empty: snap.empty,
          size: snap.size,
          docs: snap.docs.map(d => ({ id: d.id, data: () => d.data(), ref: d.ref })),
          forEach: snap.forEach.bind(snap)
        };
      },
      limit: (n) => wrapQuery(q.limit(n)),
      where: (field, op, value) => wrapQuery(q.where(field, op, value)),
      orderBy: (field, dir) => wrapQuery(q.orderBy(field, dir))
    };
  }

  // Initialize Firebase
  let firestore = null;
  let nativeDb = null;
  try {
    const firebase = require('../utils/firebase');
    firestore = firebase.firestore;
    if (firestore && typeof firestore.collection === 'function') {
      nativeDb = {
        collection: (name) => {
          const coll = firestore.collection(name);
          return {
            doc: (id) => id ? coll.doc(id) : coll.doc(),
            where: (field, op, value) => wrapQuery(coll.where(field, op, value)),
            get: async () => {
              const snap = await coll.get();
              return {
                empty: snap.empty,
                size: snap.size,
                docs: snap.docs.map(d => ({ id: d.id, data: () => d.data(), ref: d.ref })),
                forEach: snap.forEach.bind(snap)
              };
            }
          };
        }
      };
    } else {
      nativeDb = firebase.db;
    }
    console.log('✅ Firebase connected');
  } catch (e) {
    console.error('❌ Firebase init failed. Starting mock mode...');
    process.env.MOCK_DB = 'true';
    global.MOCK_DB = true;
    const firebase = require('../utils/firebase');
    nativeDb = firebase.db;
  }

  // Check if already seeded today
  const force = process.argv.includes('--force');
  const today = new Date().toISOString().split('T')[0];
  const existing = await nativeDb.collection('ai_proxy_transactions')
    .where('date', '==', today)
    .limit(1)
    .get();

  if (!existing.empty && !force) {
    console.log('⚠️  Demo data already exists. Use --force to re-seed.\n');
    const allTx = await nativeDb.collection('ai_proxy_transactions').get();
    console.log(`📊 Current DB has ${allTx.size} total transactions.\n`);
    printStats(await buildStats(nativeDb));
    return;
  }

  if (force) {
    // Clear existing data with individual deletes
    const allTx = await nativeDb.collection('ai_proxy_transactions').get();
    for (const doc of allTx.docs) {
      await doc.ref.delete();
    }
    const allDaily = await nativeDb.collection('ai_usage_daily').get();
    for (const doc of allDaily.docs) {
      await doc.ref.delete();
    }
    console.log('🗑️  Cleared existing data.\n');
  }

  // Demo users
  const users = [
    { id: 'user-demo-1', name: 'Alice Chen', email: 'alice@demo.argen', role: 'member', department: 'Engineering' },
    { id: 'user-demo-2', name: 'Bob Martinez', email: 'bob@demo.argen', role: 'member', department: 'Product' },
    { id: 'user-demo-3', name: 'Carol Smith', email: 'carol@demo.argen', role: 'member', department: 'Design' },
    { id: 'user-demo-4', name: 'Dave Kim', email: 'dave@demo.argen', role: 'teamadmin', department: 'Engineering' },
    { id: 'user-demo-5', name: 'Eve Johnson', email: 'eve@demo.argen', role: 'member', department: 'Marketing' }
  ];

  // Provider configs with costs per 1K tokens
  const providers = [
    { name: 'openai', models: ['gpt-4o', 'gpt-4o-mini', 'gpt-3.5-turbo'], inputCost: [2.50, 0.15, 0.50], outputCost: [10.00, 0.60, 1.50] },
    { name: 'anthropic', models: ['claude-3-5-sonnet-20241022', 'claude-3-haiku-20240307'], inputCost: [3.00, 0.25], outputCost: [15.00, 1.25] },
    { name: 'gemini', models: ['gemini-2.0-flash', 'gemini-1.5-pro'], inputCost: [0.10, 1.25], outputCost: [0.40, 5.00] }
  ];

  const endpoints = ['chat/completions', 'messages', 'models/gemini-2.0-flash:generateContent'];

  let totalTx = 0;
  let batch = createBatch(firestore);
  let batchCount = 0;
  const now = new Date();

  console.log('🌱 Seeding 30 days of usage data...\n');

  for (let dayOffset = 30; dayOffset >= 0; dayOffset--) {
    const date = new Date(now);
    date.setDate(date.getDate() - dayOffset);
    const dateStr = date.toISOString().split('T')[0];
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const dayMultiplier = isWeekend ? 0.3 : 1.0;

    for (const user of users) {
      const txCount = Math.floor(Math.random() * 12 * dayMultiplier) + (isWeekend ? 1 : 3);
      let userInputTokens = 0, userOutputTokens = 0, userTotalTokens = 0, userTotalCost = 0;

      for (let t = 0; t < txCount; t++) {
        const provider = providers[Math.floor(Math.random() * providers.length)];
        const modelIdx = Math.floor(Math.random() * provider.models.length);
        const model = provider.models[modelIdx];
        const inputTokens = Math.floor(Math.random() * 2000) + 100;
        const outputTokens = Math.floor(Math.random() * 4000) + 50;
        const totalTokens = inputTokens + outputTokens;
        const inputCost = (inputTokens / 1000) * provider.inputCost[modelIdx];
        const outputCost = (outputTokens / 1000) * provider.outputCost[modelIdx];
        const totalCost = Math.round((inputCost + outputCost) * 10000) / 10000;

        userInputTokens += inputTokens;
        userOutputTokens += outputTokens;
        userTotalTokens += totalTokens;
        userTotalCost += totalCost;

        const timestamp = new Date(date);
        timestamp.setHours(Math.floor(Math.random() * 14) + 6, Math.floor(Math.random() * 60));

        const txRef = nativeDb.collection('ai_proxy_transactions').doc();
        batch.set(txRef, {
          companyId: 'demo-company-id',
          userId: user.id,
          provider: provider.name,
          model,
          endpoint: endpoints[Math.floor(Math.random() * endpoints.length)],
          inputTokens,
          outputTokens,
          totalTokens,
          inputCost,
          outputCost,
          totalCost,
          status: Math.random() > 0.05 ? 'success' : 'error',
          httpStatus: Math.random() > 0.05 ? 200 : 429,
          timestamp: timestamp.toISOString(),
          date: dateStr
        });
        batchCount++;
        totalTx++;
      }

      // Daily aggregate
      const dailyRef = nativeDb.collection('ai_usage_daily').doc(`${user.id}_${dateStr}`);
      batch.set(dailyRef, {
        companyId: 'demo-company-id',
        userId: user.id,
        date: dateStr,
        transactions: txCount,
        inputTokens: userInputTokens,
        outputTokens: userOutputTokens,
        totalTokens: userTotalTokens,
        totalCost: Math.round(userTotalCost * 100) / 100,
        lastActivity: date.toISOString()
      }, { merge: true });
      batchCount++;

      // Flush batch every 400 ops
      if (batchCount >= 400) {
        await batch.commit();
        batch = createBatch(firestore);
        batchCount = 0;
      }
    }

    if (dayOffset % 7 === 0) {
      const weekNum = Math.floor((30 - dayOffset) / 7) + 1;
      process.stdout.write(`  Week ${weekNum} (${dateStr})... `);
    }
  }

  // Flush remaining batch
  if (batchCount > 0) await batch.commit();

  console.log(`\n✅ Seeded ${totalTx} transactions across 5 users × 30 days\n`);

  // Print stats
  const stats = await buildStats(nativeDb);
  await printStats(stats);
  console.log('\n🎉 Demo data ready! Dashboards will now show live numbers.\n');
}

async function buildStats(db) {
  const allTx = await db.collection('ai_proxy_transactions').get();
  const today = new Date().toISOString().split('T')[0];
  const thisMonth = new Date().toISOString().split('T')[0].slice(0, 7);

  let monthTx = 0, monthTokens = 0, monthCost = 0;
  const userStats = {};
  const providerStats = {};

  allTx.docs.forEach(doc => {
    const d = doc.data();
    if ((d.date || '').startsWith(thisMonth)) {
      monthTx++;
      monthTokens += d.totalTokens || 0;
      monthCost += d.totalCost || 0;
    }
    const uid = d.userId || 'unknown';
    if (!userStats[uid]) userStats[uid] = { tx: 0, tokens: 0, cost: 0 };
    userStats[uid].tx++;
    userStats[uid].tokens += d.totalTokens || 0;
    userStats[uid].cost += d.totalCost || 0;

    const p = d.provider || 'unknown';
    if (!providerStats[p]) providerStats[p] = { tx: 0, tokens: 0, cost: 0 };
    providerStats[p].tx++;
    providerStats[p].tokens += d.totalTokens || 0;
    providerStats[p].cost += d.totalCost || 0;
  });

  return { total: allTx.size, monthTx, monthTokens, monthCost, userStats, providerStats };
}

function printStats(stats) {
  console.log('📊 USAGE STATISTICS');
  console.log('━'.repeat(50));
  console.log(`Total Transactions:    ${stats.total.toLocaleString()}`);
  console.log(`This Month:            ${stats.monthTx.toLocaleString()} tx`);
  console.log(`Month Tokens:          ${(stats.monthTokens / 1000000).toFixed(1)}M`);
  console.log(`Month Cost:            $${stats.monthCost.toFixed(2)}`);
  console.log('');

  console.log('Per-User Breakdown:');
  Object.entries(stats.userStats)
    .sort((a, b) => b[1].tx - a[1].tx)
    .forEach(([uid, s]) => {
      console.log(`  ${uid.padEnd(20)} ${String(s.tx).padStart(5)} tx  ${(s.tokens / 1000).toFixed(1)}K tokens  $${s.cost.toFixed(2)}`);
    });

  console.log('\nPer-Provider Breakdown:');
  Object.entries(stats.providerStats).forEach(([p, s]) => {
    console.log(`  ${p.padEnd(15)} ${String(s.tx).padStart(5)} tx  ${(s.tokens / 1000).toFixed(1)}K tokens  $${s.cost.toFixed(2)}`);
  });
}

seed().catch(err => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});