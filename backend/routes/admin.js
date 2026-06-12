const express = require('express');
const router = express.Router();
const { db } = require('../utils/supabase');
const { protect, authorize } = require('../middleware/auth');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');
const { createEmailTemplate } = require('../utils/emailTemplate');
const { researchCompany } = require('../utils/ai-agents');

// @route   GET api/admin/stats
// @desc    Get advanced global system statistics (Superadmin only)
router.get('/stats', protect, authorize('superadmin'), async (req, res) => {
  if (global.MOCK_DB) {
    return res.json({
      agents: { totalRuns: 1250, failedRuns: 12, activeAgents: 5, uptime: '99.9%' },
      usage: { totalTokens: 4500000, totalCost: '45.25', avgQuality: '98.2' },
      credits: { totalSpent: '45.25', remaining: '954.75' },
      chartData: {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        calls: [120, 80, 450, 900, 1100, 850, 400],
        quality: [92, 94, 91, 95, 93, 96, 98.2],
        tokens: [1200, 800, 1500, 2000, 500],
        radar: [85, 92, 78, 95, 88]
      }
    });
  }
  
  try {
    const metricsRef = db.collection('system_metrics');
    
    // Limit aggregation to last 7 days for production scalability
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    // Total runs and failures count within the last 7 days
    const totalRunsSnapshot = await metricsRef.where('type', '==', 'agent_run').where('createdAt', '>=', sevenDaysAgo).get();
    const totalRuns = totalRunsSnapshot.size;
    
    const failedRunsSnapshot = await metricsRef.where('type', '==', 'agent_run').where('status', '==', 'failed').where('createdAt', '>=', sevenDaysAgo).get();
    const failedRuns = failedRunsSnapshot.size;
    
    // In-memory stats aggregate
    let totalTokens = 0;
    let totalCost = 0;
    let qualityScoresSum = 0;
    let qualityScoresCount = 0;

    // Time-series grouping setups (last 7 days)
    const dailyCalls = {};
    const dailyQuality = {};
    const agentTokens = {
      'Research Agent': 0,
      'Challenge Generator': 0,
      'Scoring Agent': 0,
      'Report Agent': 0,
      'Coaching Agent': 0
    };

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateString = d.toLocaleDateString('en-US', { weekday: 'short' });
      dailyCalls[dateString] = 0;
      dailyQuality[dateString] = [];
    }
    
    const allUsageSnapshot = await metricsRef.where('createdAt', '>=', sevenDaysAgo).get();
    allUsageSnapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.type === 'agent_run' || data.type === 'api_call') {
        totalTokens += (data.tokensUsed || 0);
        totalCost += (data.cost || 0);
        if (data.qualityScore !== undefined) {
          qualityScoresSum += data.qualityScore;
          qualityScoresCount++;
        }

        // Time series aggregates
        const created = data.createdAt ? new Date(data.createdAt) : (data.timestamp ? new Date(data.timestamp) : null);
        if (created) {
          const dateString = created.toLocaleDateString('en-US', { weekday: 'short' });
          if (dailyCalls[dateString] !== undefined) {
            dailyCalls[dateString]++;
          }
          if (data.qualityScore !== undefined && dailyQuality[dateString] !== undefined) {
            dailyQuality[dateString].push(data.qualityScore);
          }
        }

        if (data.agentName && agentTokens[data.agentName] !== undefined) {
          agentTokens[data.agentName] += (data.tokensUsed || 0);
        }
      }
    });

    const avgQuality = qualityScoresCount > 0 ? (qualityScoresSum / qualityScoresCount) : 100;

    const chartData = {
      labels: Object.keys(dailyCalls),
      calls: Object.values(dailyCalls),
      quality: Object.keys(dailyQuality).map(day => {
        const scores = dailyQuality[day];
        if (scores.length === 0) return 95.0; // fallback default baseline
        const sum = scores.reduce((acc, val) => acc + val, 0);
        return parseFloat((sum / scores.length).toFixed(1));
      }),
      tokens: [
        agentTokens['Research Agent'] || 0,
        agentTokens['Challenge Generator'] || 0,
        agentTokens['Scoring Agent'] || 0,
        agentTokens['Report Agent'] || 0,
        agentTokens['Coaching Agent'] || 0
      ],
      radar: [85, 92, 78, 95, 88]
    };

    res.json({
      agents: {
        totalRuns,
        failedRuns,
        activeAgents: 5,
        uptime: '99.9%'
      },
      usage: {
        totalTokens,
        totalCost: totalCost.toFixed(4),
        avgQuality: avgQuality.toFixed(1)
      },
      credits: {
        totalSpent: totalCost.toFixed(4),
        remaining: (1000 - totalCost).toFixed(4)
      },
      chartData
    });
  } catch (err) {
    console.error('Admin Stats Error:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// @route   GET api/admin/company-dashboard-stats
// @desc    Get stats for the 12-panel team admin dashboard
router.get('/company-dashboard-stats', protect, async (req, res) => {
  if (global.MOCK_DB) {
    return res.json({
      avgScore: 78.5,
      totalSubmissions: 42,
      dimensions: { clarity: 82, constraints: 75, specificity: 88, iteration: 68 },
      benchmark: {
        team: [82, 75, 88, 68, 85],
        median: [70, 70, 75, 70, 80]
      },
      trend: [7.2, 7.5, 7.1, 7.8, 8.2, 8.0, 8.4, 78.5]
    });
  }
  
  try {
    const companyId = req.user.companyId;
    if (!companyId && req.user.role !== 'superadmin') {
      return res.status(403).json({ msg: 'Access denied' });
    }

    const effectiveCompanyId = companyId || req.query.companyId;
    if (!effectiveCompanyId) return res.status(400).json({ msg: 'Company ID required' });

    const snapshot = await db.collection('responses')
      .where('companyId', '==', effectiveCompanyId)
      .get();
      
    let totalSubmissions = snapshot.size;
    let scoresSum = 0;
    let claritySum = 0;
    let constraintsSum = 0;
    let specificitySum = 0;
    let iterationSum = 0;
    
    snapshot.forEach(doc => {
      const r = doc.data();
      scoresSum += (r.scores?.total || r.overallScore || 0);
      claritySum += (r.scores?.clarity || 0);
      constraintsSum += (r.scores?.constraint_application || 0);
      specificitySum += (r.scores?.output_specificity || 0);
      iterationSum += (r.scores?.iteration_quality || 0);
    });

    const avgScore = totalSubmissions > 0 ? (scoresSum / totalSubmissions) : 0;
    const clarity = totalSubmissions > 0 ? (claritySum / totalSubmissions) : 0;
    const constraints = totalSubmissions > 0 ? (constraintsSum / totalSubmissions) : 0;
    const specificity = totalSubmissions > 0 ? (specificitySum / totalSubmissions) : 0;
    const iteration = totalSubmissions > 0 ? (iterationSum / totalSubmissions) : 0;

    res.json({
      avgScore: avgScore || 0,
      totalSubmissions: totalSubmissions || 0,
      dimensions: {
        clarity: clarity || 0,
        constraints: constraints || 0,
        specificity: specificity || 0,
        iteration: iteration || 0
      },
      benchmark: {
        team: [clarity || 0, constraints || 0, specificity || 0, iteration || 0, 85],
        median: [70, 70, 75, 70, 80]
      },
      trend: [7.2, 7.5, 7.1, 7.8, 8.2, 8.0, 8.4, avgScore.toFixed(1)]
    });
  } catch (err) {
    console.error('Company Dashboard Stats Error:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// @route   GET api/admin/agent-logs
// @desc    Get recent global agent activities (Superadmin only)
router.get('/agent-logs', protect, authorize('superadmin'), async (req, res) => {
  try {
    const snapshot = await db.collection('system_metrics')
      .where('type', '==', 'agent_run')
      .orderBy('createdAt', 'desc')
      .limit(20)
      .get();
      
    const logs = [];
    snapshot.forEach(doc => {
      logs.push({ _id: doc.id, ...doc.data() });
    });
    
    res.json(logs);
  } catch (err) {
    console.error('Agent Logs Error:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// @route   GET api/admin/companies
// @desc    Get all companies (Superadmin only)
router.get('/companies', protect, authorize('superadmin'), async (req, res) => {
  if (global.MOCK_DB) {
    return res.json([
      { _id: 'mock-co-1', name: 'TechFlow Inc', industry: 'SaaS', status: 'active', inviteCode: 'TF001' },
      { _id: 'mock-co-2', name: 'DataCore Labs', industry: 'AI Research', status: 'pending', inviteCode: 'DC002' }
    ]);
  }
  
  try {
    const snapshot = await db.collection('companies').orderBy('createdAt', 'desc').get();
    const companies = [];
    snapshot.forEach(doc => {
      companies.push({ _id: doc.id, ...doc.data() });
    });
    res.json(companies);
  } catch (err) {
    console.error('Companies List Error:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// @route   GET api/admin/my-company
// @desc    Get current user's company details
router.get('/my-company', protect, async (req, res) => {
  if (global.MOCK_DB) {
    return res.json({
      _id: 'mock-company-id',
      name: 'ArGen Mock Corp',
      industry: 'AI & Data Science',
      status: 'active',
      inviteCode: 'MOCK1234'
    });
  }
  
  try {
    if (!req.user.companyId) {
      return res.status(404).json({ msg: 'No company associated with this account' });
    }
    const doc = await db.collection('companies').doc(req.user.companyId).get();
    if (!doc.exists) {
      return res.status(404).json({ msg: 'Company not found' });
    }
    res.json({ _id: doc.id, ...doc.data() });
  } catch (err) {
    console.error('My Company Error:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// @route   POST api/admin/invitations
// @desc    Create a registration invitation
router.post('/invitations', protect, authorize('superadmin'), async (req, res) => {
  const { email, companyName } = req.body;
  
  try {
    const token = crypto.randomBytes(16).toString('hex');
    const invitationData = {
      email,
      companyName,
      token,
      used: false,
      createdAt: new Date()
    };
    
    const docRef = await db.collection('invitations').add(invitationData);
    const link = `https://argen.isira.club/registration?approval=true&team_id=${token}`;
    
    const html = createEmailTemplate({
        title: 'ArGen Workspace Invitation',
        preheader: `You have been invited to set up ${companyName} on ArGen.`,
        bodyContent: `
            <h1>Workspace Approved</h1>
            <p>Your workspace request for <strong>${companyName}</strong> has been approved by our administrators.</p>
            <p>Please click the button below to complete your TeamAdmin registration and set up your workspace.</p>
        `,
        buttonText: 'Complete Registration',
        buttonUrl: link
    });

    await sendEmail({
      email,
      subject: 'Your ArGen Registration Invitation',
      html
    });
    
    res.json({ link, invitation: { _id: docRef.id, ...invitationData } });
  } catch (err) {
    console.error('Invitation Creation Error:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// @route   PATCH api/admin/companies/:id/status
// @desc    Update company status
router.patch('/companies/:id/status', protect, authorize('superadmin'), async (req, res) => {
  const { status } = req.body;
  try {
    const companyRef = db.collection('companies').doc(req.params.id);
    const companyDoc = await companyRef.get();
    
    if (!companyDoc.exists) return res.status(404).json({ msg: 'Company not found' });
    const company = companyDoc.data();

    const updates = { status };
    
    if (status === 'active' && !company.approvedAt) {
      updates.approvedBy = req.user.id;
      updates.approvedAt = new Date();
      
      // Auto-generate invoice for active clients
      try {
        const invoiceNumber = 'INV-' + Math.floor(100000 + Math.random() * 900000);
        const contactName = company.primaryContact?.name || company.name;
        const contactEmail = company.primaryContact?.email || 'billing@' + company.name.toLowerCase().replace(/\s+/g, '') + '.com';
        
        const invoiceData = {
          invoiceNumber,
          companyId: req.params.id,
          clientName: contactName,
          clientContact: contactEmail,
          clientAddress: company.country || 'Corporate Headquarters',
          items: [
            { description: 'ArGen Enterprise Annual Platform License (Seat Limit: ' + (company.seatLimit || 15) + ')', amount: 1200.00 }
          ],
          subtotal: 1200.00,
          totalDue: 1200.00,
          status: 'Draft',
          date: new Date()
        };
        
        await db.collection('invoices').add(invoiceData);
      } catch (invoiceErr) {
        console.error('Failed to auto-generate invoice:', invoiceErr);
      }

      // Send approval confirmation email asynchronously
      if (company.primaryContact?.email && company.primaryContact.email.includes('.')) {
        sendEmail({
          email: company.primaryContact.email,
          subject: 'Your ArGen Workspace is Approved!',
          html: createEmailTemplate({
            title: 'Workspace Activated - ArGen',
            preheader: `Your ArGen workspace for ${company.name} is now active.`,
            bodyContent: `
              <h1>Workspace Approved & Activated</h1>
              <p>Hello ${company.primaryContact.name || 'Admin'},</p>
              <p>Your workspace request for <strong>${company.name}</strong> has been successfully approved and activated by our team.</p>
              <p>You can now access your corporate dashboard, manage your team, and generate challenges for your employees.</p>
            `,
            buttonText: 'Access Workspace',
            buttonUrl: 'https://argen.isira.club/login'
          })
        }).catch(emailErr => console.error('Failed to send workspace approval email:', emailErr.message));
      }
      
      // Trigger Research Agent asynchronously
      researchCompany(company.name, company.domain || company.name + '.com').then(async profile => {
         await companyRef.update({
           industry: profile.industry || 'Technology',
           primary_ai_tools: profile.primary_ai_tools || [],
           language_tone: profile.language_tone || 'Professional',
           competitor_names: profile.competitor_names || [],
           challenge_themes: profile.challenge_themes || [],
           profileGeneratedAt: new Date()
         });
         console.log(`Research Agent completed for ${company.name}`);
      }).catch(err => console.error('Research Agent failed:', err));
    }
    
    await companyRef.update(updates);
    const updatedDoc = await companyRef.get();

    res.json({ msg: `Company status updated to ${status}`, company: { _id: updatedDoc.id, ...updatedDoc.data() } });
  } catch (err) {
    console.error('Company Status Update Error:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// @route   GET api/admin/users
// @desc    Get all users (for safety/audit)
router.get('/users', protect, authorize('superadmin'), async (req, res) => {
  if (global.MOCK_DB) {
    return res.json([
      { _id: 'mock-u1', name: 'Alex Chen', email: 'alex@techflow.io', role: 'member', companyId: 'mock-co-1' },
      { _id: 'mock-u2', name: 'Sarah Kim', email: 'sarah@techflow.io', role: 'teamadmin', companyId: 'mock-co-1' }
    ]);
  }
  
  try {
    const snapshot = await db.collection('users').get();
    const users = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      delete data.password; // Safeguard
      users.push({ _id: doc.id, ...data });
    });
    res.json(users);
  } catch (err) {
    console.error('Users List Error:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// @route   GET api/admin/flagged
// @desc    Get flagged submissions for a company
router.get('/flagged', protect, authorize('teamadmin', 'superadmin'), async (req, res) => {
  if (global.MOCK_DB) {
    return res.json([]);
  }
  
  try {
    const snapshot = await db.collection('responses')
      .where('companyId', '==', req.user.companyId)
      .where('scoringStatus', '==', 'Manual Review')
      .get();
      
    const formatted = [];
    for (const doc of snapshot.docs) {
      const data = doc.data();
      let userName = 'Unknown User';
      if (data.user) {
        const userDoc = await db.collection('users').doc(data.user).get();
        if (userDoc.exists) userName = userDoc.data().name;
      }
      formatted.push({
        userName,
        flags: data.flags || []
      });
    }
    
    res.json(formatted);
  } catch (err) {
    console.error('Flagged Responses Error:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// =========================================================================
// INVOICE MANAGEMENT ENDPOINTS
// =========================================================================

// @route   GET api/admin/invoices/public/:id
// @desc    Retrieve invoice details publicly
router.get('/invoices/public/:id', async (req, res) => {
  if (global.MOCK_DB) {
    return res.json({
      _id: req.params.id,
      invoiceNumber: 'INV-783941',
      poNumber: '12-34-56-7890',
      date: new Date(),
      clientName: 'Acme Corp',
      clientAddress: '123 Enterprise Dr, Tech Suite A, Austin, TX',
      clientContact: 'billing@acme.com',
      productName: 'ArGen Enterprise SaaS Platform License',
      productDescription: 'Autonomous AI productivity auditing platform and workflow playbooks',
      usageTerms: 'Unlimited usage for verified domain members',
      periodOfUse: 'Unlimited / Annual Subscription',
      items: [{ description: 'ArGen Enterprise Annual Platform License (Seat Limit: 15)', amount: 1200.00 }],
      subtotal: 1200.00,
      totalDue: 1200.00,
      status: 'Sent'
    });
  }
  
  try {
    const doc = await db.collection('invoices').doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ msg: 'Invoice not found' });
    
    const data = doc.data();
    let companyName = '';
    if (data.companyId) {
      const companyDoc = await db.collection('companies').doc(data.companyId).get();
      if (companyDoc.exists) companyName = companyDoc.data().name;
    }
    
    res.json({ _id: doc.id, ...data, companyId: { name: companyName } });
  } catch (err) {
    console.error('Fetch Public Invoice Error:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// @route   GET api/admin/invoices
// @desc    Get all invoices
router.get('/invoices', protect, authorize('teamadmin', 'superadmin'), async (req, res) => {
  if (global.MOCK_DB) {
    return res.json([
      {
        _id: 'mock-inv-1',
        invoiceNumber: 'INV-783941',
        poNumber: '12-34-56-7890',
        date: new Date(),
        clientName: 'Acme Corp',
        clientAddress: '123 Enterprise Dr, Tech Suite A, Austin, TX',
        clientContact: 'billing@acme.com',
        productName: 'ArGen Enterprise SaaS Platform License',
        productDescription: 'Autonomous AI productivity auditing platform and workflow playbooks',
        usageTerms: 'Unlimited usage for verified domain members',
        periodOfUse: 'Unlimited / Annual Subscription',
        items: [{ description: 'ArGen Enterprise Annual Platform License (Seat Limit: 15)', amount: 1200.00 }],
        subtotal: 1200.00,
        totalDue: 1200.00,
        status: 'Sent'
      }
    ]);
  }
  
  try {
    let invoicesRef = db.collection('invoices');
    let snapshot;
    if (req.user.role === 'teamadmin') {
      if (!req.user.companyId) return res.json([]);
      snapshot = await invoicesRef.where('companyId', '==', req.user.companyId).get();
    } else {
      snapshot = await invoicesRef.get();
    }
    
    const invoices = [];
    for (const doc of snapshot.docs) {
      const data = doc.data();
      let companyName = '';
      if (data.companyId) {
        const companyDoc = await db.collection('companies').doc(data.companyId).get();
        if (companyDoc.exists) companyName = companyDoc.data().name;
      }
      
      invoices.push({
        _id: doc.id,
        ...data,
        companyId: { name: companyName }
      });
    }
    
    invoices.sort((a, b) => b.date - a.date);
    res.json(invoices);
  } catch (err) {
    console.error('Fetch Invoices Error:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// @route   POST api/admin/invoices
// @desc    Create a custom invoice manually
router.post('/invoices', protect, authorize('teamadmin', 'superadmin'), async (req, res) => {
  const {
    companyId,
    clientName,
    clientAddress,
    clientContact,
    productName,
    productDescription,
    usageTerms,
    periodOfUse,
    items,
    poNumber,
    status
  } = req.body;

  try {
    const invoiceNumber = 'INV-' + Math.floor(100000 + Math.random() * 900000);
    const calculatedSubtotal = (items || []).reduce((acc, item) => acc + (parseFloat(item.amount) || 0), 0);
    
    const invoiceData = {
      invoiceNumber,
      poNumber: poNumber || '12-34-56-7890',
      companyId: companyId || req.user.companyId,
      clientName,
      clientAddress,
      clientContact,
      productName: productName || 'ArGen Enterprise SaaS Platform License',
      productDescription: productDescription || 'Autonomous AI productivity auditing platform and workflow playbooks',
      usageTerms: usageTerms || 'Unlimited usage for verified domain members',
      periodOfUse: periodOfUse || 'Unlimited / Annual Subscription',
      items: items || [],
      subtotal: calculatedSubtotal,
      totalDue: calculatedSubtotal,
      status: status || 'Draft',
      date: new Date()
    };

    const docRef = await db.collection('invoices').add(invoiceData);
    res.status(201).json({ _id: docRef.id, ...invoiceData });
  } catch (err) {
    console.error('Create Invoice Error:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// @route   PUT api/admin/invoices/:id
// @desc    Update invoice details
router.put('/invoices/:id', protect, authorize('teamadmin', 'superadmin'), async (req, res) => {
  const {
    poNumber,
    clientName,
    clientAddress,
    clientContact,
    productName,
    productDescription,
    usageTerms,
    periodOfUse,
    items,
    status
  } = req.body;

  try {
    const invoiceRef = db.collection('invoices').doc(req.params.id);
    const invoiceDoc = await invoiceRef.get();
    if (!invoiceDoc.exists) return res.status(404).json({ msg: 'Invoice not found' });
    const invoice = invoiceDoc.data();

    if (req.user.role === 'teamadmin' && invoice.companyId !== req.user.companyId) {
      return res.status(403).json({ msg: 'Access denied' });
    }

    const updates = {};
    if (poNumber !== undefined) updates.poNumber = poNumber;
    if (clientName !== undefined) updates.clientName = clientName;
    if (clientAddress !== undefined) updates.clientAddress = clientAddress;
    if (clientContact !== undefined) updates.clientContact = clientContact;
    if (productName !== undefined) updates.productName = productName;
    if (productDescription !== undefined) updates.productDescription = productDescription;
    if (usageTerms !== undefined) updates.usageTerms = usageTerms;
    if (periodOfUse !== undefined) updates.periodOfUse = periodOfUse;
    if (items !== undefined) {
      updates.items = items;
      updates.subtotal = items.reduce((acc, item) => acc + (parseFloat(item.amount) || 0), 0);
      updates.totalDue = updates.subtotal;
    }
    if (status !== undefined) updates.status = status;

    await invoiceRef.update(updates);
    const updated = await invoiceRef.get();
    
    res.json({ _id: updated.id, ...updated.data() });
  } catch (err) {
    console.error('Update Invoice Error:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// @route   DELETE api/admin/invoices/:id
// @desc    Delete an invoice
router.delete('/invoices/:id', protect, authorize('teamadmin', 'superadmin'), async (req, res) => {
  try {
    const invoiceRef = db.collection('invoices').doc(req.params.id);
    const invoiceDoc = await invoiceRef.get();
    if (!invoiceDoc.exists) return res.status(404).json({ msg: 'Invoice not found' });

    if (req.user.role === 'teamadmin' && invoiceDoc.data().companyId !== req.user.companyId) {
      return res.status(403).json({ msg: 'Access denied' });
    }

    await invoiceRef.delete();
    res.json({ msg: 'Invoice deleted successfully' });
  } catch (err) {
    console.error('Delete Invoice Error:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

module.exports = router;
