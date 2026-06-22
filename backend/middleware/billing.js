const { db } = require('../utils/firebase');

// Plan tiers with monthly event limits
const PLAN_LIMITS = {
  free: 1000,
  starter: 5000,
  pro: 25000,
  enterprise: 100000,
  unlimited: Infinity
};

const DEFAULT_PLAN = 'free';

// Get the current billing period for a company
async function getBillingInfo(companyId) {
  try {
    const doc = await db.collection('billing').doc(companyId).get();
    if (doc.exists) return doc.data();
    return { plan: DEFAULT_PLAN, monthlyLimit: PLAN_LIMITS[DEFAULT_PLAN] };
  } catch {
    return { plan: DEFAULT_PLAN, monthlyLimit: PLAN_LIMITS[DEFAULT_PLAN] };
  }
}

// Count events in the current billing cycle
async function getCurrentCycleCount(companyId) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  try {
    const snapshot = await db.collection('ai_usage_events')
      .where('companyId', '==', companyId)
      .where('createdAt', '>=', startOfMonth)
      .count()
      .get();
    return snapshot.data().count || 0;
  } catch {
    // Fallback: count manually if .count() aggregation isn't supported
    const snapshot = await db.collection('ai_usage_events')
      .where('companyId', '==', companyId)
      .where('createdAt', '>=', startOfMonth)
      .get();
    return snapshot.size || 0;
  }
}

// Billing enforcement middleware
async function checkBillingLimit(req, res, next) {
  // Skip billing check for mock/test mode
  if (global.MOCK_DB) return next();

  const companyId = req.companyId;
  if (!companyId) return next();

  try {
    const billing = await getBillingInfo(companyId);
    const limit = billing.monthlyLimit || PLAN_LIMITS[DEFAULT_PLAN];

    // Unlimited — no check needed
    if (limit === Infinity) return next();

    const currentCount = await getCurrentCycleCount(companyId);

    if (currentCount >= limit) {
      return res.status(429).json({
        error: 'Monthly event limit exceeded',
        plan: billing.plan,
        limit,
        used: currentCount,
        remaining: 0,
        resetDate: getNextMonthStart()
      });
    }

    // Attach billing info to request for downstream use
    req.billing = {
      plan: billing.plan,
      limit,
      used: currentCount,
      remaining: limit - currentCount
    };

    next();
  } catch (err) {
    console.error('[billing] checkBillingLimit error:', err.message);
    // Fail open — allow capture even if billing check errors
    next();
  }
}

function getNextMonthStart() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();
}

module.exports = { checkBillingLimit, PLAN_LIMITS, DEFAULT_PLAN };