const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { Whop } = require('@whop/sdk');
const { db } = require('../utils/supabase');
const sendEmail = require('../utils/sendEmail');
const { createEmailTemplate } = require('../utils/emailTemplate');
const { protect } = require('../middleware/auth');

// Initialize Whop SDK
const whop = new Whop({
  apiKey: process.env.WHOP_API_KEY,
});

// POST /api/whop/checkout-url
// Returns a dynamically generated Whop checkout URL
router.post('/checkout-url', express.json(), async (req, res) => {
  const { amount, planType, seats, companyName } = req.body;
  
  if (!amount || !planType || !seats) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  try {
    const checkout = await whop.checkout_configurations.create({
      currency: "usd",
      plan: {
        initial_price: parseFloat(amount),
        plan_type: planType, // "one_time" or "renewal"
        company_id: process.env.NEXT_PUBLIC_WHOP_APP_ID,
      },
      metadata: {
        seats: seats.toString(),
        companyName: companyName || '',
      },
    });

    res.json({ checkoutUrl: checkout.purchase_url });
  } catch (err) {
    console.error('Error generating checkout:', err);
    res.status(500).json({ error: 'Failed to generate checkout link' });
  }
});

// POST /api/whop/webhook
// Handles all Whop webhook events
router.post('/webhook', express.raw({type: 'application/json'}), async (req, res) => {
  const payload = req.body;
  const signature = req.headers['x-whop-signature'];
  const webhookSecret = process.env.WHOP_WEBHOOK_SECRET;

  // Simple signature verification
  if (webhookSecret && signature) {
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(payload)
      .digest('hex');
      
    if (signature !== expectedSignature) {
      console.error('Webhook signature verification failed.');
      return res.status(400).send('Webhook signature mismatch');
    }
  }

  let event;
  try {
    event = JSON.parse(payload.toString());
  } catch (err) {
    return res.status(400).send('Invalid JSON payload');
  }

  try {
    switch (event.action) {
      case 'membership.went_valid':
        await handleMembershipValid(event.data);
        break;
      case 'membership.went_invalid':
        await handleMembershipInvalid(event.data);
        break;
      default:
        console.log(`Unhandled event action ${event.action}`);
    }

    res.json({received: true});
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// GET /api/whop/portal
// Protected: Only accessible to TeamAdmin
router.get('/portal', protect, async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'teamadmin') {
      return res.status(401).json({ error: 'Unauthorized. TeamAdmin only.' });
    }
    // Whop provides a central dashboard for users to manage their billing.
    res.json({ portalUrl: 'https://whop.com/hub' });
  } catch (error) {
    console.error('Whop Portal Error:', error);
    res.status(500).json({ error: 'Failed to return portal URL' });
  }
});

// Webhook Handlers
async function handleMembershipValid(data) {
  const whopMembershipId = data.id;
  const whopUserId = data.user_id || data.user?.id;
  const email = data.user?.email || data.email;
  
  const plan = 'custom';
  let companyName = `Company ${whopUserId.substring(0, 5)}`; 
  let seatLimit = 15;

  // Extract custom metadata passed during checkout config creation
  if (data.checkout_configuration && data.checkout_configuration.metadata) {
    const meta = data.checkout_configuration.metadata;
    if (meta.companyName) companyName = meta.companyName;
    if (meta.seats) seatLimit = parseInt(meta.seats, 10);
  }

  // Check if subscription already exists
  const subSnap = await db.collection('subscriptions')
    .where('whopMembershipId', '==', whopMembershipId)
    .get();

  if (!subSnap.empty) {
    const subDoc = subSnap.docs[0];
    await subDoc.ref.update({ status: 'active' });
    
    const companyId = subDoc.data().companyId;
    await db.collection('companies').doc(companyId).update({ subscriptionStatus: 'active' });
    return;
  }

  // Create Company doc
  const newCompany = {
    name: companyName,
    whopUserId,
    plan,
    seatLimit,
    subscriptionStatus: 'active',
    status: 'active',
    createdAt: new Date()
  };
  const compRef = await db.collection('companies').add(newCompany);
  const companyId = compRef.id;

  // Create Subscription doc
  const newSub = {
    companyId,
    whopMembershipId,
    whopUserId,
    plan,
    seatLimit,
    status: 'active',
    createdAt: new Date()
  };
  await db.collection('subscriptions').add(newSub);

  // Generate Invite Token
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 48); // 48 hr expiry

  const newInvitation = {
    companyId,
    token,
    expiresAt,
    createdBy: null,
    status: 'pending',
    used: false,
    createdAt: new Date()
  };
  await db.collection('invitations').add(newInvitation);

  // Send Welcome Email
  const registrationLink = `${process.env.CLIENT_URL || 'https://argen.isira.club'}/registration?approval=true&team_id=${token}`;
  
  const html = createEmailTemplate({
    title: 'Welcome to ArGen! Complete your setup',
    preheader: 'Complete your administrative setup and invite your team.',
    bodyContent: `
        <h1>Welcome to ArGen</h1>
        <p>Your subscription is active for <strong>${companyName}</strong> with a seat limit of <strong>${seatLimit}</strong>.</p>
        <p>Click the secure link below to complete your administrative setup and invite your team members.</p>
    `,
    buttonText: 'Complete Setup',
    buttonUrl: registrationLink
  });

  await sendEmail({
    email: email,
    subject: `Welcome to ArGen! Complete your setup`,
    html
  });

  console.log(`Auto-onboarded company: ${companyName} with ${seatLimit} seats`);
}

async function handleMembershipInvalid(data) {
  const whopMembershipId = data.id;
  
  const subSnap = await db.collection('subscriptions')
    .where('whopMembershipId', '==', whopMembershipId)
    .get();

  if (!subSnap.empty) {
    const subDoc = subSnap.docs[0];
    await subDoc.ref.update({ status: 'cancelled' });

    const companyId = subDoc.data().companyId;
    await db.collection('companies').doc(companyId).update({ subscriptionStatus: 'cancelled' });
  }
}

module.exports = router;
