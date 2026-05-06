# ArGen Automation Workflow — Complete Specification

**Version:** 1.0  
**Last Updated:** May 2026  
**Platform:** Make.com (Primary Automation Engine)

---

## 1. AUTOMATION OVERVIEW

### Purpose
Connect all ArGen components into a seamless, automated evaluation pipeline from form submission to report delivery.

### Flow Summary
```
Tally Form Submission 
  → Make.com Webhook Trigger
  → Parse Form Data
  → Create Airtable Records (Participant + 5 Submissions)
  → Loop Through 5 Submissions
    → Call Anthropic API for Scoring
    → Parse JSON Response
    → Update Submission Record with Scores
  → Check if All Participants Complete
    → If Yes: Generate Team Report
    → Send Report via Email
  → Send Confirmation to Participant
```

---

## 2. PLATFORM SELECTION: MAKE.COM

### Why Make.com

**Advantages:**
- Visual workflow builder (no-code)
- 1,000 operations/month free tier (sufficient for first 200 evaluations)
- Native integrations: Anthropic API, Airtable, Gmail, Tally webhooks
- Error handling and retry logic built-in
- Execution history and debugging tools
- Webhook triggers (instant, not polling)

**Limitations:**
- Free tier limit (1,000 ops/month = ~40 full evaluations)
- Complex scenarios can get expensive on paid tiers
- No version control for scenarios

**Cost Projections:**

| Evaluations/Month | Operations Needed | Tier | Monthly Cost |
|-------------------|-------------------|------|--------------|
| 0-40 | ~1,000 | Free | $0 |
| 40-200 | ~5,000 | Core (10K ops) | $9 |
| 200-500 | ~12,500 | Pro (40K ops) | $16 |
| 500+ | Custom | Teams | $29+ |

**Operation Count per Evaluation:**
- Webhook trigger: 1 op
- Parse data: 1 op
- Create Participant record: 1 op
- Create 5 Submission records: 5 ops
- Call scoring API 5 times: 5 ops
- Update 5 Submission records: 5 ops
- Check completion status: 1 op
- Send confirmation email: 1 op
- (If last participant) Generate report: 3 ops
- **Total per evaluation: ~23 operations**

---

## 3. SCENARIO 1: CORE EVALUATION WORKFLOW

**Scenario Name:** "ArGen Evaluation Processing v1"

**Trigger:** Webhook (Tally form submission)

---

### MODULE 1: WEBHOOK TRIGGER

**Tool:** Webhooks (Make.com built-in)

**Configuration:**
- Method: POST
- Data Structure: JSON
- Generate unique webhook URL
- Copy URL to Tally form settings

**Expected Payload:**
```json
{
  "response_id": "resp_abc123",
  "participant_name": "John Doe",
  "participant_email": "john@company.com",
  "company_name": "Acme Corp",
  "job_role": "Manager",
  "department": "Product",
  "challenge_1_response": "...",
  "challenge_2_response": "...",
  "challenge_3_response": "...",
  "challenge_4_response": "...",
  "challenge_5_response": "...",
  "challenge_1_process": "...",
  "challenge_2_process": "...",
  "challenge_3_process": "...",
  "challenge_4_process": "...",
  "challenge_5_process": "...",
  "submission_timestamp": "2026-05-08T14:32:00Z"
}
```

---

### MODULE 2: PARSE WEBHOOK DATA

**Tool:** Tools → Set Variables

**Variables to Extract:**
```javascript
participantName = {{1.participant_name}}
participantEmail = {{1.participant_email}}
companyName = {{1.company_name}}
jobRole = {{1.job_role}}
department = {{1.department}}
submissionTimestamp = {{1.submission_timestamp}}

// Challenges (stored as array for looping)
challenges = [
  {id: "C001", response: {{1.challenge_1_response}}, process: {{1.challenge_1_process}}},
  {id: "C009", response: {{1.challenge_2_response}}, process: {{1.challenge_2_process}}},
  {id: "C017", response: {{1.challenge_3_response}}, process: {{1.challenge_3_process}}},
  {id: "C025", response: {{1.challenge_4_response}}, process: {{1.challenge_4_process}}},
  {id: "C033", response: {{1.challenge_5_response}}, process: {{1.challenge_5_process}}}
]
```

---

### MODULE 3: LOOKUP COMPANY IN AIRTABLE

**Tool:** Airtable → Search Records

**Configuration:**
- Base: ArGen Operations Base
- Table: Companies
- Search Field: Company Name
- Search Value: `{{companyName}}`
- Limit: 1

**Output:**
- Company Record ID: `{{companyRecordId}}`
- Evaluation Batch ID: `{{currentBatchId}}` (from most recent active batch)

**Error Handling:**
- If company not found: Send alert email to founder, halt scenario

---

### MODULE 4: CREATE PARTICIPANT RECORD

**Tool:** Airtable → Create Record

**Configuration:**
- Base: ArGen Operations Base
- Table: Participants
- Fields:
  - Full Name: `{{participantName}}`
  - Email: `{{participantEmail}}`
  - Company: `{{companyRecordId}}` (linked record)
  - Evaluation Batch: `{{currentBatchId}}` (linked record)
  - Job Role: `{{jobRole}}`
  - Department: `{{department}}`
  - Submission Status: "Submitted"
  - Submission Date: `{{submissionTimestamp}}`

**Output:**
- Participant Record ID: `{{participantRecordId}}`

---

### MODULE 5: ITERATOR (Loop Through 5 Challenges)

**Tool:** Flow Control → Iterator

**Input Array:** `{{challenges}}` (from Module 2)

**Iterations:** 5 (one per challenge)

---

### MODULE 6: FETCH CHALLENGE TEXT FROM LIBRARY

**Tool:** Airtable → Get Record

**Configuration:**
- Base: ArGen Operations Base
- Table: Challenges Library
- Record ID: Search where Challenge ID = `{{5.id}}`

**Output:**
- Challenge Text: `{{challengeText}}`

---

### MODULE 7: CREATE SUBMISSION RECORD

**Tool:** Airtable → Create Record

**Configuration:**
- Base: ArGen Operations Base
- Table: Submissions
- Fields:
  - Participant: `{{participantRecordId}}` (linked)
  - Challenge ID: `{{5.id}}` (linked)
  - Response Text: `{{5.response}}`
  - Process Notes: `{{5.process}}`
  - Submitted At: `{{submissionTimestamp}}`
  - Scoring Status: "Pending"

**Output:**
- Submission Record ID: `{{submissionRecordId}}`

---

### MODULE 8: CALL ANTHROPIC API FOR SCORING

**Tool:** HTTP → Make a Request

**Configuration:**
- URL: `https://api.anthropic.com/v1/messages`
- Method: POST
- Headers:
  - `x-api-key`: `{{env.ANTHROPIC_API_KEY}}`
  - `anthropic-version`: `2023-06-01`
  - `content-type`: `application/json`

**Body (JSON):**
```json
{
  "model": "claude-sonnet-4-20250514",
  "max_tokens": 2000,
  "temperature": 0.1,
  "system": "[Full system prompt from Scoring Agent Spec]",
  "messages": [
    {
      "role": "user",
      "content": "CHALLENGE PROMPT:\n{{challengeText}}\n\n---\n\nUSER RESPONSE:\n{{5.response}}\n\n---\n\nEvaluate this response according to the ArGen scoring rubric."
    }
  ]
}
```

**Timeout:** 30 seconds

**Retry Policy:**
- Max retries: 3
- Backoff: Exponential (2s, 4s, 8s)

**Output:**
- Response Body: `{{apiResponse}}`

---

### MODULE 9: PARSE SCORING RESPONSE

**Tool:** Tools → Parse JSON

**Input:** `{{8.data.content[0].text}}`

**Expected Structure:**
```json
{
  "clarity": 18,
  "constraint_application": 22,
  "output_specificity": 16,
  "iteration_quality": 19,
  "total_score": 75,
  "justification": "...",
  "improvement": "..."
}
```

**Variables to Extract:**
```javascript
clarityScore = {{9.clarity}}
constraintScore = {{9.constraint_application}}
specificityScore = {{9.output_specificity}}
iterationScore = {{9.iteration_quality}}
totalScore = {{9.total_score}}
justification = {{9.justification}}
improvement = {{9.improvement}}
```

**Error Handling:**
- If parse fails: Log error, set Scoring Status = "Error", flag for manual review

---

### MODULE 10: UPDATE SUBMISSION WITH SCORES

**Tool:** Airtable → Update Record

**Configuration:**
- Base: ArGen Operations Base
- Table: Submissions
- Record ID: `{{submissionRecordId}}`
- Fields:
  - Scoring Status: "Scored"
  - Clarity Score: `{{clarityScore}}`
  - Constraint Score: `{{constraintScore}}`
  - Specificity Score: `{{specificityScore}}`
  - Iteration Score: `{{iterationScore}}`
  - AI Justification: `{{justification}}`
  - AI Improvement: `{{improvement}}`
  - Model Used: "claude-sonnet-4-20250514"
  - API Cost: `0.009` (hardcoded for now, update with actual token count later)

---

### MODULE 11: END ITERATOR

(Iterator automatically loops until all 5 challenges processed)

---

### MODULE 12: CHECK IF ALL BATCH PARTICIPANTS COMPLETE

**Tool:** Airtable → Search Records

**Configuration:**
- Base: ArGen Operations Base
- Table: Participants
- Filter: Evaluation Batch = `{{currentBatchId}}` AND Submission Status ≠ "Submitted"
- Limit: 1

**Logic:**
- If results found (incomplete participants exist): End scenario
- If no results (all participants submitted): Continue to Module 13

---

### MODULE 13: AGGREGATE TEAM SCORES

**Tool:** Airtable → Search Records

**Configuration:**
- Base: ArGen Operations Base
- Table: Participants
- Filter: Evaluation Batch = `{{currentBatchId}}`
- Return all records

**Calculation (using Make.com built-in aggregators):**
```javascript
teamAverageScore = average({{participants.averageScore}})
teamClarityAvg = average({{participants.clarityAvg}})
teamConstraintAvg = average({{participants.constraintAvg}})
teamSpecificityAvg = average({{participants.specificityAvg}})
teamIterationAvg = average({{participants.iterationAvg}})
```

---

### MODULE 14: UPDATE BATCH RECORD

**Tool:** Airtable → Update Record

**Configuration:**
- Base: ArGen Operations Base
- Table: Evaluation Batches
- Record ID: `{{currentBatchId}}`
- Fields:
  - Status: "Complete"
  - Actual Completion Date: `{{now}}`
  - Average Team Score: `{{teamAverageScore}}`
  - Team Clarity Avg: `{{teamClarityAvg}}`
  - Team Constraint Avg: `{{teamConstraintAvg}}`
  - Team Specificity Avg: `{{teamSpecificityAvg}}`
  - Team Iteration Avg: `{{teamIterationAvg}}`

---

### MODULE 15: TRIGGER REPORT GENERATION

**Tool:** Webhooks → Custom Webhook (to Scenario 2)

**Payload:**
```json
{
  "batch_id": "{{currentBatchId}}",
  "company_id": "{{companyRecordId}}"
}
```

(This triggers Scenario 2: Report Generation & Delivery)

---

### MODULE 16: SEND PARTICIPANT CONFIRMATION EMAIL

**Tool:** Gmail → Send Email

**Configuration:**
- To: `{{participantEmail}}`
- From: `evaluations@argen.ai`
- Subject: "ArGen Evaluation Complete ✓"
- Body:
```
Hi {{participantName}},

Thank you for completing your ArGen evaluation.

Your responses have been received and scored. Your individual performance report will be delivered to you and your team leadership within 48 hours.

What happens next:
1. Your 5 responses are scored across 4 dimensions
2. Your scores are compiled into a detailed report
3. Your team's aggregate performance is calculated
4. Leadership receives the full team report

Questions? Reply to this email or contact support@argen.ai.

Best regards,
ArGen Team
```

---

## 4. SCENARIO 2: REPORT GENERATION & DELIVERY

**Scenario Name:** "ArGen Report Builder v1"

**Trigger:** Webhook (from Scenario 1, Module 15)

---

### MODULE 1: WEBHOOK TRIGGER

**Payload:**
```json
{
  "batch_id": "EVAL-COMP0001-001",
  "company_id": "recXYZ123"
}
```

---

### MODULE 2: FETCH BATCH DATA

**Tool:** Airtable → Get Record

**Configuration:**
- Base: ArGen Operations Base
- Table: Evaluation Batches
- Record ID: `{{1.batch_id}}`

**Output:**
- Batch details (company, participants, scores, dates)

---

### MODULE 3: FETCH ALL PARTICIPANTS DATA

**Tool:** Airtable → Search Records

**Configuration:**
- Base: ArGen Operations Base
- Table: Participants
- Filter: Evaluation Batch = `{{1.batch_id}}`
- Sort: Average Score (descending)

**Output:**
- Array of all participants with scores

---

### MODULE 4: FETCH BENCHMARK DATA

**Tool:** Airtable → Search Records

**Configuration:**
- Base: ArGen Benchmark Base
- Table: Industry Benchmarks
- Filter: Industry = `{{2.industry}}` AND Time Period = current quarter

**Output:**
- Industry median scores for comparison

---

### MODULE 5: GENERATE REPORT (Google Slides)

**Manual Process (for now):**
- Clone Google Slides template
- Fill in: Company name, date, team scores, individual scores, benchmark comparison
- Export as PDF

**Automated (Phase 2 - using Documint or custom API):**
- POST to Documint API with data payload
- Receive PDF download link

**For Phase 1:** Skip automation, manually create report in Google Slides

---

### MODULE 6: UPLOAD REPORT TO AIRTABLE

**Tool:** Airtable → Update Record

**Configuration:**
- Base: ArGen Operations Base
- Table: Evaluation Batches
- Record ID: `{{1.batch_id}}`
- Fields:
  - Report PDF URL: `[Google Drive link or Documint URL]`
  - Report Delivered Date: `{{now}}`
  - Status: "Delivered"

---

### MODULE 7: SEND REPORT TO CLIENT

**Tool:** Gmail → Send Email with Attachment

**Configuration:**
- To: `{{2.primaryContactEmail}}`
- CC: `evaluations@argen.ai`
- Subject: "ArGen Performance Report - {{2.companyName}} - {{2.evaluationDate}}"
- Attachment: Report PDF
- Body:
```
Hi {{2.primaryContactName}},

Attached is your ArGen AI Performance Intelligence report for {{2.companyName}}.

KEY FINDINGS:
- Team Average Score: {{2.averageTeamScore}}/100
- Strongest Dimension: [Auto-calculated]
- Opportunity Area: [Auto-calculated]
- Industry Benchmark Comparison: Your team scored [above/below] the {{2.industry}} median of {{benchmarkMedian}}

The full report includes:
✓ Individual performance scores for all {{2.numberOfParticipants}} participants
✓ Team aggregate analysis across 4 dimensions
✓ Industry benchmark comparison
✓ Recommended next steps

I'll follow up within 48 hours to schedule a brief report walkthrough call.

Best regards,
[Founder Name]
Founder, ArGen
```

---

### MODULE 8: SEND INDIVIDUAL REPORTS TO PARTICIPANTS

**Tool:** Iterator → Loop through all participants

**For each participant:**
- Tool: Gmail → Send Email
- To: `{{participant.email}}`
- Subject: "Your ArGen Performance Report"
- Attachment: Individual 1-page PDF (generated separately)
- Body:
```
Hi {{participant.name}},

Attached is your individual ArGen performance report.

YOUR SCORES:
- Overall: {{participant.averageScore}}/100
- Clarity: {{participant.clarityAvg}}/25
- Constraint Application: {{participant.constraintAvg}}/25
- Output Specificity: {{participant.specificityAvg}}/25
- Iteration Quality: {{participant.iterationAvg}}/25

TEAM CONTEXT:
You ranked [X percentile] within your team of {{teamSize}} participants.

Your leadership has received the full team report. This evaluation is designed to help identify strengths and improvement areas in AI-assisted work, not as a performance review.

Questions? Contact your manager or reply to this email.

Best regards,
ArGen Team
```

---

### MODULE 9: LOG COMPLETION

**Tool:** Airtable → Create Record

**Configuration:**
- Base: ArGen Operations Base
- Table: Activity Log (new table)
- Fields:
  - Activity Type: "Report Delivered"
  - Batch ID: `{{1.batch_id}}`
  - Timestamp: `{{now}}`
  - Status: "Success"

---

## 5. SCENARIO 3: WEEKLY DIGEST & REMINDERS

**Scenario Name:** "ArGen Weekly Ops Digest"

**Trigger:** Scheduled (every Monday at 9:00 AM)

---

### MODULE 1: FETCH PENDING SUBMISSIONS

**Tool:** Airtable → Search Records

**Configuration:**
- Table: Participants
- Filter: Submission Status = "Not Started" OR "In Progress"
- Limit: 100

---

### MODULE 2: SEND REMINDER EMAILS

**Tool:** Iterator → Loop through pending participants

**For each:**
- Tool: Gmail → Send Email
- To: `{{participant.email}}`
- Subject: "Reminder: Complete Your ArGen Evaluation"
- Body:
```
Hi {{participant.name}},

Quick reminder: Your ArGen evaluation is still pending.

Evaluation Link: [Unique link]

This takes about 30-45 minutes and helps {{company.name}} understand how effectively the team is using AI tools.

If you have questions or need an extension, reply to this email.

Thanks,
ArGen Team
```

---

### MODULE 3: SEND FOUNDER WEEKLY DIGEST

**Tool:** Gmail → Send Email

**To:** founder@argen.ai

**Subject:** "ArGen Weekly Digest - [Date]"

**Body:**
```
WEEKLY SUMMARY:

EVALUATIONS:
- Completed this week: [X]
- In progress: [X]
- Pending submissions: [X]
- Reports delivered: [X]

REVENUE:
- This week: $[X]
- This month: $[X]
- MRR: $[X]

ALERTS:
- [List any errors, delays, or issues]

ACTION ITEMS:
- [Auto-generated from pending tasks]
```

---

## 6. ERROR HANDLING & MONITORING

### Error Types & Actions

| Error | Detection | Action |
|-------|-----------|--------|
| API timeout | HTTP module timeout | Retry 3x, then manual review |
| Invalid JSON from AI | Parse module fails | Log error, flag submission, alert founder |
| Airtable rate limit | 429 response code | Wait 60s, retry |
| Webhook failure | Make.com error log | Email alert to founder |
| Duplicate participant email | Airtable create fails | Check for existing, link to same participant |

### Monitoring Dashboard (Make.com)

**Key Metrics:**
- Scenario execution count (daily)
- Error rate (% of runs with errors)
- Average execution time
- Operations used vs. limit

**Alerts:**
- Email alert if error rate > 5%
- Email alert if operations > 80% of monthly limit
- Daily summary email with all scenario runs

---

## 7. TESTING PROTOCOL

### Pre-Production Testing

**1. End-to-End Test:**
- Submit test form with dummy data
- Verify participant created in Airtable
- Verify 5 submission records created
- Verify all 5 scored correctly
- Verify team report triggers
- Verify emails sent

**2. Error Simulation:**
- Submit form with invalid company name → should error gracefully
- Force API timeout → should retry and log
- Submit form with <50 word responses → should flag

**3. Load Test:**
- Submit 10 evaluations simultaneously
- Check for race conditions
- Verify all processed correctly

---

## 8. COST OPTIMIZATION

### Reducing Operation Count

**Current: ~23 ops per evaluation**

**Optimizations:**
1. Batch API calls (score all 5 challenges in one call) → Save 4 ops
2. Use Airtable batch create/update → Save 3 ops
3. Cache challenge text in scenario variables → Save 5 ops

**Optimized: ~11 ops per evaluation**

### Monthly Cost Projections (Optimized)

| Evaluations | Operations | Tier | Cost |
|-------------|------------|------|------|
| 0-90 | 990 | Free | $0 |
| 90-400 | 4,400 | Core | $9 |
| 400-900 | 9,900 | Pro | $16 |

---

## 9. MAINTENANCE SCHEDULE

**Weekly:**
- Review error logs
- Check execution times (identify bottlenecks)
- Verify webhook connections still active

**Monthly:**
- Update challenge rotation logic
- Review and optimize scenario efficiency
- Check operation usage vs. limit

**Quarterly:**
- Full scenario audit
- Test all error handling paths
- Update documentation

---

## 10. SCALING PLAN

### When to Consider n8n (Self-Hosted Alternative)

**Trigger:** >$50/month on Make.com OR need for complex logic

**Benefits of n8n:**
- Unlimited operations (self-hosted)
- Free on Railway/Render free tier
- More complex workflows possible
- Version control (workflows as code)

**Trade-offs:**
- Requires technical setup
- Need to maintain server
- More complex debugging

---

## IMPLEMENTATION CHECKLIST

- [ ] Create Make.com account
- [ ] Set up Scenario 1: Core Evaluation Workflow
- [ ] Configure webhook trigger and copy URL to Tally
- [ ] Add Anthropic API key to Make.com environment variables
- [ ] Connect Make.com to Airtable (OAuth)
- [ ] Test Scenario 1 end-to-end with dummy data
- [ ] Set up Scenario 2: Report Generation (manual for Phase 1)
- [ ] Set up Scenario 3: Weekly Digest
- [ ] Configure error email alerts
- [ ] Document all scenario variable mappings
- [ ] Create runbook for common errors
- [ ] Set up monitoring dashboard

---

**Document Status:** Production Ready (Phase 1: Manual Report Generation)  
**Next Review Date:** August 2026  
**Owner:** Technical Operations
