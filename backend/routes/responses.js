const express = require('express');
const router = express.Router();
const { db } = require('../utils/firebase');
const { scoreResponse } = require('../utils/ai-agents');
const { protect, isApproved, authorize } = require('../middleware/auth');

// @route   POST api/responses/submit
// @desc    Submit a response for a challenge in a batch
// @access  Private (Member)
router.post('/submit', protect, isApproved, authorize('member', 'teamadmin', 'superadmin'), async (req, res) => {
  const { evaluationId, challengeId, promptText, modelOutput, workflowApproach, timeTaken, baselineTime, responseText: reqResponseText } = req.body;
  const responseText = reqResponseText || `Prompt: ${promptText}\n\nOutput: ${modelOutput}`;

  if (global.MOCK_DB) {
    return res.status(201).json({
      _id: 'mock-resp-' + Date.now(),
      challengeId,
      scores: { clarity: 82, constraint_application: 78, output_specificity: 85, iteration_quality: 71, total: 79 },
      justification: 'Strong clarity and output specificity. Focus on iteration quality for improvement.',
      improvement: 'Try breaking your prompt into numbered steps to improve constraint application scores.',
      flags: [],
      scoringStatus: 'Scored',
      createdAt: new Date()
    });
  }

  try {
    // 1. Verify evaluation and challenge
    // evaluationId is optional — challenges can be taken standalone from the dashboard
    if (evaluationId) {
      const evaluationDoc = await db.collection('evaluations').doc(evaluationId).get();
      if (!evaluationDoc.exists || evaluationDoc.data().companyId !== req.user.companyId) {
        return res.status(404).json({ msg: 'Evaluation batch not found' });
      }
    }

    const challengeDoc = await db.collection('challenges').doc(challengeId).get();
    if (!challengeDoc.exists) {
      return res.status(404).json({ msg: 'Challenge not found' });
    }
    const challenge = { id: challengeDoc.id, ...challengeDoc.data() };

    // 2. Check for duplicate submission today
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    
    const duplicateSnapshot = await db.collection('responses')
      .where('user', '==', req.user.id)
      .where('challenge', '==', challengeId)
      .get();
      
    let isDuplicate = false;
    duplicateSnapshot.forEach(doc => {
      const data = doc.data();
      const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
      if (createdAt >= startOfDay) {
        isDuplicate = true;
      }
    });

    if (isDuplicate) {
      if (process.env.NODE_ENV === 'production') {
        return res.status(400).json({ msg: 'You have already submitted a response for this challenge today.' });
      } else {
        // Development: allowing duplicate challenge submission for testing
      }
    }

    // 3. Call AI Scoring Agent
    const aiResult = await scoreResponse(challenge, responseText);
    
    const responseData = {
      user: req.user.id,
      companyId: req.user.companyId || null,
      evaluationId: evaluationId || null,
      challenge: challengeId,
      responseText,
      workflowApproach: workflowApproach || '',
      timeTaken: timeTaken || '',
      baselineTime: baselineTime || '',
      scores: {
        clarity: aiResult.clarity,
        constraint_application: aiResult.constraint_application,
        output_specificity: aiResult.output_specificity,
        iteration_quality: aiResult.iteration_quality,
        total: aiResult.total_score
      },
      overallScore: aiResult.total_score || 0,
      justification: aiResult.justification,
      improvement: aiResult.improvement,
      flags: aiResult.flags || [],
      scoringStatus: aiResult.flags?.length > 0 ? 'Manual Review' : 'Scored',
      modelUsed: aiResult.modelUsed || 'unknown',
      createdAt: new Date()
    };

    const docRef = await db.collection('responses').add(responseData);

    // 4. Update User Streak and weaker dimension
    const userDocRef = db.collection('users').doc(req.user.id);
    const userDoc = await userDocRef.get();
    
    if (userDoc.exists) {
      const user = userDoc.data();
      const currentStreak = (user.currentStreak || 0) + 1;
      const longestStreak = Math.max(user.longestStreak || 0, currentStreak);
      
      const dims = ['clarity', 'constraint_application', 'output_specificity', 'iteration_quality'];
      const scores = [aiResult.clarity, aiResult.constraint_application, aiResult.output_specificity, aiResult.iteration_quality];
      const minIndex = scores.indexOf(Math.min(...scores));
      const weakestDimension = dims[minIndex];
      
      await userDocRef.update({
        currentStreak,
        longestStreak,
        weakestDimension
      });
    }

    res.status(201).json({ _id: docRef.id, ...responseData });
  } catch (err) {
    console.error('Submit Response Error:', err);
    res.status(500).send('Server error');
  }
});

// @route   GET api/responses/my
// @desc    Get current user's submissions
// @access  Private
router.get('/my', protect, isApproved, async (req, res) => {
  if (global.MOCK_DB) {
    return res.json([
      { _id: 'mock-r1', challengeId: { title: 'Strategic AI Deployment' }, overallScore: 82, createdAt: new Date(Date.now() - 86400000 * 1) },
      { _id: 'mock-r2', challengeId: { title: 'Constraint-First Prompting' }, overallScore: 75, createdAt: new Date(Date.now() - 86400000 * 2) },
      { _id: 'mock-r3', challengeId: { title: 'Adversarial Output Audit' }, overallScore: 91, createdAt: new Date(Date.now() - 86400000 * 3) }
    ]);
  }
  
  try {
    const snapshot = await db.collection('responses')
      .where('user', '==', req.user.id)
      .get();
      
    const responses = [];
    for (const doc of snapshot.docs) {
      const data = doc.data();
      
      // Basic populate for challenge details
      let challengeTitle = 'General Challenge';
      if (data.challenge) {
        const challengeDoc = await db.collection('challenges').doc(data.challenge).get();
        if (challengeDoc.exists) {
          challengeTitle = challengeDoc.data().title || challengeDoc.data().name;
        }
      }
      
      responses.push({
        _id: doc.id,
        ...data,
        challengeId: { title: challengeTitle }
      });
    }
    
    // Sort in-memory descending by date
    responses.sort((a, b) => b.createdAt - a.createdAt);
    
    res.json(responses);
  } catch (err) {
    console.error('Fetch My Responses Error:', err);
    res.status(500).send('Server error');
  }
});

// @route   GET api/responses/batch/:batchId
// @desc    Get all submissions for a batch (TeamAdmin audit)
// @access  Private (TeamAdmin)
router.get('/batch/:batchId', protect, isApproved, authorize('teamadmin'), async (req, res) => {
  try {
    const snapshot = await db.collection('responses')
      .where('evaluationId', '==', req.params.batchId)
      .where('companyId', '==', req.user.companyId)
      .get();
      
    const responses = [];
    for (const doc of snapshot.docs) {
      const data = doc.data();
      
      // Basic populate for user profile details
      let userName = 'Anonymous';
      let userEmail = '';
      if (data.user) {
        const userDoc = await db.collection('users').doc(data.user).get();
        if (userDoc.exists) {
          userName = userDoc.data().name;
          userEmail = userDoc.data().email;
        }
      }
      
      responses.push({
        _id: doc.id,
        ...data,
        user: { name: userName, email: userEmail }
      });
    }
    
    res.json(responses);
  } catch (err) {
    console.error('Fetch Batch Responses Error:', err);
    res.status(500).send('Server error');
  }
});

module.exports = router;
