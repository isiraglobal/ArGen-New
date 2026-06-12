require('dotenv').config();
let { db } = require('./backend/utils/supabase');
const { scoreResponse, generateWeeklyReport, generateCoachingNudge } = require('./backend/utils/ai-agents');

async function runTest() {
  try {
    console.log('--- Initializing Test Setup with Supabase/Mock layer ---');

    console.log('--- Creating/Finding Test Company & User ---');
    let compSnap;
    try {
      compSnap = await db.collection('companies').where('name', '==', 'ArGen Test Corp').limit(1).get();
    } catch (err) {
      console.log('---------------------------------------------------------');
      console.log('Notice: Live Supabase connection failed or environment is offline.');
      console.log('Forcing MOCK_DB = true to proceed with local logic testing.');
      console.log('---------------------------------------------------------');
      global.MOCK_DB = true;
      
      const queryStub = {
        where: () => queryStub,
        orderBy: () => queryStub,
        limit: () => queryStub,
        get: async () => ({
          empty: false,
          docs: [
            {
              id: "mock-doc-id",
              data: () => ({
                name: "ArGen Test Corp",
                status: "active",
                role: "teamadmin",
                companyId: "mock-company-id",
                inviteCode: "TEST1234"
              })
            }
          ]
        })
      };
      
      db = {
        collection: () => ({
          doc: () => ({
            get: async () => ({
              exists: true,
              id: "mock-doc-id",
              data: () => ({
                name: "ArGen Test Corp",
                status: "active",
                role: "teamadmin",
                companyId: "mock-company-id"
              })
            }),
            set: async () => {},
            update: async () => {},
            delete: async () => {}
          }),
          add: async () => ({ id: "mock-add-id" }),
          ...queryStub
        })
      };
      
      compSnap = await db.collection('companies').where('name', '==', 'ArGen Test Corp').limit(1).get();
    }
    let company;
    if (compSnap.empty) {
      const newComp = {
        name: 'ArGen Test Corp',
        industry: 'Technology',
        size: '1-10',
        country: 'US',
        primaryContact: { name: 'Test User', email: 'test@argen' },
        inviteCode: 'TEST1234',
        status: 'active'
      };
      const addedComp = await db.collection('companies').add(newComp);
      company = { id: addedComp.id, ...newComp };
      console.log('Created test company.');
    } else {
      company = { id: compSnap.docs[0].id, ...compSnap.docs[0].data() };
      console.log('Found existing test company.');
    }

    const userSnap = await db.collection('users').where('email', '==', 'test@argen').limit(1).get();
    let user;
    if (userSnap.empty) {
      const newUser = {
        name: 'Test TeamAdmin',
        email: 'test@argen',
        password: 'mockpassword',
        role: 'teamadmin',
        companyId: company.id,
        currentStreak: 1
      };
      const addedUser = await db.collection('users').add(newUser);
      user = { id: addedUser.id, ...newUser };
      console.log('Created test user.');
    } else {
      user = { id: userSnap.docs[0].id, ...userSnap.docs[0].data() };
      console.log('Found existing test user.');
    }
    console.log('Test User and Company ready.');

    console.log('--- Finding or Creating a Challenge ---');
    const chSnap = await db.collection('challenges').limit(1).get();
    let challenge;
    if (chSnap.empty) {
      const newCh = {
        title: 'Optimize Support Inbox',
        scenario: 'Your inbox is flooded with repetitive level-1 support tickets.',
        task: 'Create an automated response workflow using AI.',
        constraints: ['Must resolve 50% of tickets', 'Must sound human'],
        timeSuggestion: 20,
        primaryDimension: 'iteration_quality',
        companyId: company.id
      };
      const addedCh = await db.collection('challenges').add(newCh);
      challenge = { id: addedCh.id, ...newCh };
      console.log('Created new challenge.');
    } else {
      challenge = { id: chSnap.docs[0].id, ...chSnap.docs[0].data() };
      console.log('Found existing challenge.');
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

    const responseData = {
      user: user.id || 'mock-user-id',
      companyId: company.id || 'mock-company-id',
      evaluationId: 'mock-eval-id-1234',
      challenge: challenge.id || 'mock-challenge-id',
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
    };
    const addedResponse = await db.collection('responses').add(responseData);
    console.log('Response saved to DB with ID:', addedResponse.id);

    console.log('--- Generating Coaching Nudge ---');
    const nudge = await generateCoachingNudge(user, aiResult, user.currentStreak || 1);
    console.log('Coaching Nudge:', nudge);

    console.log('--- Generating Weekly Report ---');
    const respSnap = await db.collection('responses').where('companyId', '==', company.id).get();
    const allResponses = respSnap.docs.map(r => r.data());
    
    const reportData = allResponses.map(r => ({
      workflowApproach: r.workflowApproach,
      timeSaved: r.baselineTime + ' -> ' + r.timeTaken,
      score: r.scores?.total || 0
    }));
    
    const report = await generateWeeklyReport(company, reportData);
    console.log('Weekly Report:\n', report);

    console.log('--- Test Run Complete ---');
  } catch (error) {
    console.error('Error during test run:', error);
  } finally {
    process.exit(0);
  }
}

runTest();
