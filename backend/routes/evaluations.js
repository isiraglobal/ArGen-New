const express = require('express');
const router = express.Router();
const { db } = require('../utils/firebase');
const { generateChallenge } = require('../utils/ai-agents');
const { protect, authorize, isApproved } = require('../middleware/auth');
const sendEmail = require('../utils/sendEmail');
const { createEmailTemplate } = require('../utils/emailTemplate');

// @route   POST api/evaluations/generate-ai
// @desc    Trigger AI Intelligence Cycle to generate challenges
// @access  Private (TeamAdmin)
router.post('/generate-ai', protect, isApproved, authorize('teamadmin'), async (req, res) => {
  if (global.MOCK_DB) {
    return res.status(201).json({
      _id: 'mock-eval-id',
      title: `Mock AI Cycle - ${new Date().toLocaleDateString()}`,
      status: 'active',
      challenges: ['mock-ch-1', 'mock-ch-2']
    });
  }
  
  try {
    const companyDoc = await db.collection('companies').doc(req.user.companyId).get();
    if (!companyDoc.exists) {
      return res.status(404).json({ msg: 'Company not found' });
    }
    const company = { id: companyDoc.id, ...companyDoc.data() };

    const usersSnapshot = await db.collection('users')
      .where('companyId', '==', req.user.companyId)
      .where('role', '==', 'member')
      .get();

    const users = [];
    usersSnapshot.forEach(doc => {
      users.push({ id: doc.id, ...doc.data() });
    });

    if (users.length === 0) {
      return res.status(400).json({ msg: 'No members found in this company to evaluate.' });
    }

    const evaluationData = {
      title: `AI Intelligence Cycle - ${new Date().toLocaleDateString()}`,
      description: 'Autonomously generated challenges based on team roles and performance history.',
      companyId: req.user.companyId,
      createdBy: req.user.id,
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      status: 'active',
      challenges: [],
      createdAt: new Date()
    };

    // Generate challenges concurrently for all members to prevent Vercel serverless timeouts
    const challengePromises = users.map(async (member) => {
      try {
        const challengeData = await generateChallenge(member, company);
        
        const challengeObj = {
          challengeId: `CHG-${Date.now()}-${member.id.substring(0, 4)}`,
          name: challengeData.name || challengeData.title || 'Personalized Challenge',
          title: challengeData.title || challengeData.name || 'Personalized Challenge',
          scenario: challengeData.scenario || challengeData.text || '',
          task: challengeData.task || '',
          type: challengeData.type || 'General',
          difficulty: challengeData.difficulty || 'Intermediate',
          text: challengeData.text || challengeData.scenario || '',
          wordLimit: challengeData.wordLimit || 500,
          timeEstimate: challengeData.timeEstimate || 20,
          dimensions: challengeData.dimensions || {},
          active: true,
          companyId: req.user.companyId,
          createdAt: new Date()
        };

        const challengeRef = await db.collection('challenges').add(challengeObj);

        // Send challenge notification email to member asynchronously
        if (member.email && member.email.includes('.')) {
          sendEmail({
            email: member.email,
            subject: 'New AI Workflow Challenge Assigned!',
            html: createEmailTemplate({
              title: 'New Daily Challenge',
              preheader: `You have a new challenge: ${challengeObj.name}`,
              bodyContent: `
                <h1>Challenge Assigned</h1>
                <p>Hello ${member.name || 'Team Member'},</p>
                <p>A new personalized challenge has been generated for you based on your role: <strong>${challengeObj.name}</strong>.</p>
                <p>This challenge is estimated to take ${challengeObj.timeEstimate} minutes.</p>
              `,
              buttonText: 'Start Challenge',
              buttonUrl: 'https://argen.isira.club/dashboard'
            })
          }).catch(emailErr => console.error(`Failed to send challenge email to ${member.email}:`, emailErr.message));
        }

        return challengeRef.id;
      } catch (err) {
        console.error(`Failed to generate challenge for member ${member.id}:`, err.message);
        return null;
      }
    });

    const generatedIds = await Promise.all(challengePromises);
    const challengeIds = generatedIds.filter(Boolean);

    if (challengeIds.length === 0) {
      return res.status(500).json({ msg: 'Failed to generate any challenges.' });
    }

    evaluationData.challenges = challengeIds;
    const evalRef = await db.collection('evaluations').add(evaluationData);

    res.status(201).json({ _id: evalRef.id, ...evaluationData });
  } catch (err) {
    console.error('Trigger AI Intelligence Cycle Error:', err);
    res.status(500).send('Server error');
  }
});

// @route   POST api/evaluations
// @desc    Create a new evaluation batch
// @access  Private (TeamAdmin)
router.post('/', protect, isApproved, authorize('teamadmin'), async (req, res) => {
  const { title, description, challengeIds, deadline } = req.body;

  try {
    const evaluationData = {
      title,
      description,
      companyId: req.user.companyId,
      createdBy: req.user.id,
      challenges: challengeIds || [],
      deadline: deadline ? new Date(deadline) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      status: 'active',
      createdAt: new Date()
    };

    const docRef = await db.collection('evaluations').add(evaluationData);
    res.status(201).json({ _id: docRef.id, ...evaluationData });
  } catch (err) {
    console.error('Create Evaluation Batch Error:', err);
    res.status(500).send('Server error');
  }
});

// @route   GET api/evaluations
// @desc    Get all evaluations for the user's company
// @access  Private
router.get('/', protect, isApproved, async (req, res) => {
  if (global.MOCK_DB) {
    return res.json([
      { _id: 'mock-1', title: 'Q1 AI Proficiency', status: 'active', createdAt: new Date() },
      { _id: 'mock-2', title: 'Onboarding Assessment', status: 'completed', createdAt: new Date(Date.now() - 86400000) }
    ]);
  }
  
  try {
    const snapshot = await db.collection('evaluations')
      .where('companyId', '==', req.user.companyId)
      .get();
      
    const evaluations = [];
    for (const doc of snapshot.docs) {
      const data = doc.data();
      
      // Populate challenge previews
      const populatedChallenges = [];
      if (data.challenges && Array.isArray(data.challenges)) {
        for (const chId of data.challenges) {
          const chDoc = await db.collection('challenges').doc(chId).get();
          if (chDoc.exists) {
            populatedChallenges.push({ id: chDoc.id, ...chDoc.data() });
          }
        }
      }
      
      evaluations.push({
        _id: doc.id,
        ...data,
        challenges: populatedChallenges
      });
    }
    
    // Sort in-memory
    evaluations.sort((a, b) => b.createdAt - a.createdAt);
    
    res.json(evaluations);
  } catch (err) {
    console.error('Fetch Evaluations Error:', err);
    res.status(500).send('Server error');
  }
});

// @route   GET api/evaluations/:id
// @desc    Get evaluation details
// @access  Private
router.get('/:id', protect, isApproved, async (req, res) => {
  try {
    const doc = await db.collection('evaluations').doc(req.params.id).get();

    if (!doc.exists || doc.data().companyId !== req.user.companyId) {
      return res.status(404).json({ msg: 'Evaluation not found' });
    }

    const data = doc.data();
    
    // Populate full challenge details
    const populatedChallenges = [];
    if (data.challenges && Array.isArray(data.challenges)) {
      for (const chId of data.challenges) {
        const chDoc = await db.collection('challenges').doc(chId).get();
        if (chDoc.exists) {
          populatedChallenges.push({ id: chDoc.id, ...chDoc.data() });
        }
      }
    }

    res.json({
      _id: doc.id,
      ...data,
      challenges: populatedChallenges
    });
  } catch (err) {
    console.error('Fetch Evaluation Detail Error:', err);
    res.status(500).send('Server error');
  }
});

module.exports = router;
