require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./backend/models/User');
const Company = require('./backend/models/Company');
const Challenge = require('./backend/models/Challenge');
const Response = require('./backend/models/Response');
const { scoreResponse, generateWeeklyReport, generateCoachingNudge } = require('./backend/utils/ai-agents');

async function runTest() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected.');

    console.log('--- Creating/Finding Test Company & User ---');
    let company = await Company.findOne({ name: 'ArGen Test Corp' });
    if (!company) {
      company = new Company({
        name: 'ArGen Test Corp',
        industry: 'Technology',
        size: '1-10',
        country: 'US',
        primaryContact: { name: 'Test User', email: 'test@argen' },
        inviteCode: 'TEST1234',
        status: 'active'
      });
      await company.save();
    }

    let user = await User.findOne({ email: 'test@argen' });
    if (!user) {
      user = new User({
        name: 'Test TeamAdmin',
        email: 'test@argen',
        password: 'mockpassword',
        role: 'teamadmin',
        companyId: company._id,
        currentStreak: 1
      });
      await user.save();
    }
    console.log('Test User and Company ready.');

    console.log('--- Finding or Creating a Challenge ---');
    let challenge = await Challenge.findOne({});
    if (!challenge) {
      challenge = new Challenge({
        title: 'Optimize Support Inbox',
        scenario: 'Your inbox is flooded with repetitive level-1 support tickets.',
        task: 'Create an automated response workflow using AI.',
        constraints: ['Must resolve 50% of tickets', 'Must sound human'],
        timeSuggestion: 20,
        primaryDimension: 'iteration_quality',
        companyId: company._id
      });
      await challenge.save();
    }
    console.log(`Challenge: ${challenge.title}`);

    console.log('--- Simulating Evaluation Submission ---');
    const workflowApproach = 'Set up a zapier integration with ChatGPT to draft responses, then manual review.';
    const timeTaken = '10 mins';
    const baselineTime = '60 mins';
    const promptText = 'Draft a polite response to this ticket: {ticket_content}';
    const modelOutput = 'Hello, thanks for reaching out. We are looking into this.';
    
    const responseText = `Prompt: ${promptText}\n\nOutput: ${modelOutput}`;

    console.log('Scoring Response (Calling AI)...');
    const aiResult = await scoreResponse(challenge, responseText);
    console.log('AI Scoring Result:', aiResult);

    const evaluationId = new mongoose.Types.ObjectId(); // Mock eval id
    const response = new Response({
      user: user._id,
      companyId: company._id,
      evaluationId,
      challenge: challenge._id,
      responseText,
      workflowApproach,
      timeTaken,
      baselineTime,
      scores: {
        clarity: aiResult.clarity || 0,
        constraint_application: aiResult.constraint_application || 0,
        output_specificity: aiResult.output_specificity || 0,
        iteration_quality: aiResult.iteration_quality || 0,
        total: aiResult.total_score || 0
      },
      justification: aiResult.justification,
      improvement: aiResult.improvement,
      flags: aiResult.flags || [],
      scoringStatus: 'Scored'
    });
    await response.save();
    console.log('Response saved to DB.');

    console.log('--- Generating Coaching Nudge ---');
    const nudge = await generateCoachingNudge(user, aiResult, user.currentStreak);
    console.log('Coaching Nudge:', nudge);

    console.log('--- Generating Weekly Report ---');
    // Fetch all scores for the company
    const allResponses = await Response.find({ companyId: company._id });
    const reportData = allResponses.map(r => ({
      workflowApproach: r.workflowApproach,
      timeSaved: r.baselineTime + ' -> ' + r.timeTaken,
      score: r.scores.total
    }));
    
    const report = await generateWeeklyReport(company, reportData);
    console.log('Weekly Report:\n', report);

    console.log('--- Test Run Complete ---');
  } catch (error) {
    console.error('Error during test run:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

runTest();
