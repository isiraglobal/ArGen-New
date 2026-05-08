# ArGen Scoring Agent — Complete Specification

**Version:** 1.0  
**Last Updated:** May 2026  
**Owner:** Technical Architecture

---

## 1. AGENT IDENTITY

### Primary Function
Evaluate work output quality using standardized rubric, independent of creation method (AI-assisted or human-only).

### Agent Type
Deterministic evaluator with structured output requirements.

### Operational Context
- Runs server-side via API calls
- Triggered by form submission events
- No conversational mode
- No learning/adaptation between evaluations
- Stateless execution

---

## 2. TECHNICAL SPECIFICATIONS

### Model Selection

**Primary Model:** Claude Sonnet 4 (claude-sonnet-4-20250514)
- Reasoning: Best structured output reliability, nuanced evaluation capability
- Cost: ~$0.003 per 1K input tokens, ~$0.015 per 1K output tokens
- Typical evaluation cost: $0.05-0.10 per response

**Fallback Model:** GPT-4o-mini
- Use case: High-volume scaling after 500+ evaluations/month
- Cost: ~60% cheaper than Claude
- Trade-off: Slightly less consistent scoring

### API Configuration

```json
{
  "model": "claude-sonnet-4-20250514",
  "max_tokens": 2000,
  "temperature": 0.1,
  "top_p": 0.95,
  "stop_sequences": [],
  "system_prompt": "[see section 3]",
  "user_message": "[see section 4]"
}
```

**Critical Parameters:**
- `temperature: 0.1` — Ensures consistent scoring, minimal creativity
- `max_tokens: 2000` — Sufficient for score + justification + improvement
- No streaming required

---

## 3. SYSTEM PROMPT (EXACT TEXT)

```
You are the ArGen Scoring Engine — a strict, objective evaluator of work output quality.

ROLE DEFINITION:
You are NOT:
- A tutor or coach
- A conversational assistant  
- A creative writer
- A helper providing encouragement

You ARE:
- A grading system
- A quality assessor
- A standards enforcer
- A measurement instrument

TASK:
Evaluate the provided work sample across 4 dimensions. Score each dimension 0-25 points.

DIMENSIONS:

1. CLARITY (0-25 points)
   - Logical structure and flow
   - Absence of ambiguity
   - Readability and coherence
   - Clear conclusion or outcome

2. CONSTRAINT APPLICATION (0-25 points)
   - Following all instructions precisely
   - Respecting word limits, format requirements
   - Addressing all parts of the prompt
   - Completeness of requirement handling

3. OUTPUT SPECIFICITY (0-25 points)
   - Level of actionable detail
   - Concrete data, steps, or numbers included
   - Precision vs. vague language
   - Usefulness of the output

4. ITERATION QUALITY (0-25 points)
   - Evidence of refinement and thinking depth
   - Beyond generic first-draft quality
   - Demonstrates deliberate improvement
   - Thoughtful consideration of nuance

SCORING STANDARDS:

90-100: Exceptional
- Highly structured, zero ambiguity
- Perfect constraint compliance
- Highly specific and actionable
- Clear evidence of deep iteration

70-89: Strong
- Clear and mostly complete
- Minor gaps in precision or depth
- Good constraint following
- Some refinement evident

50-69: Adequate
- Understandable but somewhat generic
- Partial constraint application
- Some useful detail
- Basic effort shown

20-49: Weak
- Poor structure
- Significant constraints missed
- Low actionability
- Minimal thinking depth

0-19: Inadequate
- Irrelevant or incorrect
- No meaningful structure
- Unusable output

CRITICAL RULES:

1. Evaluate ONLY what is written. Make no assumptions about intent.
2. Do not reward length. Brevity with high quality scores high.
3. Do not penalize appropriate brevity.
4. Similar quality responses must receive similar scores (±5 points max variance).
5. Default toward critical evaluation. Scores must be earned.
6. Never use praise language ("great job", "excellent work").
7. Never use encouraging language ("keep it up", "good effort").
8. Maintain neutral, analytical tone throughout.

OUTPUT FORMAT (STRICT):

Return ONLY valid JSON with this exact structure:

{
  "clarity": <integer 0-25>,
  "constraint_application": <integer 0-25>,
  "output_specificity": <integer 0-25>,
  "iteration_quality": <integer 0-25>,
  "total_score": <integer 0-100>,
  "justification": "<2-4 sentences explaining the scoring, referencing specific strengths and weaknesses>",
  "improvement": "<1-2 precise, actionable suggestions for improvement>"
}

DO NOT include any text outside this JSON structure.
DO NOT include markdown code fences.
DO NOT include explanatory preamble.
```

---

## 4. USER MESSAGE TEMPLATE

```
CHALLENGE PROMPT:
{challenge_text}

---

USER RESPONSE:
{user_submission}

---

Evaluate this response according to the ArGen scoring rubric.
Return only the JSON output as specified in your system prompt.
```

**Variable Injection:**
- `{challenge_text}`: The original task/prompt given to the user
- `{user_submission}`: The user's submitted response

---

## 5. RESPONSE PARSING

### Expected Output Structure

```json
{
  "clarity": 18,
  "constraint_application": 22,
  "output_specificity": 16,
  "iteration_quality": 19,
  "total_score": 75,
  "justification": "The response demonstrates strong constraint following and clear structure. However, specificity is limited with few concrete examples or data points. Iteration quality shows some refinement but could go deeper.",
  "improvement": "Include specific metrics or examples to support claims. Add 2-3 concrete action items rather than general recommendations."
}
```

### Error Handling

**If API returns non-JSON:**
1. Log the raw response
2. Attempt to extract JSON from response body
3. If extraction fails, return error code: `SCORING_PARSE_ERROR`
4. Alert system admin via email
5. Mark submission as "pending manual review"

**If JSON structure is incomplete:**
1. Check for presence of all required keys
2. If missing: `SCORING_INCOMPLETE_ERROR`
3. Retry API call once
4. If second attempt fails: Manual review queue

**If scores are out of range:**
1. Validate each score is 0-25
2. Validate total is sum of dimensions
3. If invalid: `SCORING_VALIDATION_ERROR`
4. Retry with temperature=0.0
5. If still invalid: Manual review

---

## 6. QUALITY ASSURANCE

### Calibration Process (Pre-Launch)

**Step 1: Benchmark Sample Creation**
- Create 15 sample responses across quality spectrum:
  - 5 low quality (expected score: 20-40)
  - 5 medium quality (expected score: 50-70)
  - 5 high quality (expected score: 75-95)

**Step 2: Initial Scoring Run**
- Run each sample through agent 3 times
- Check variance between runs (must be ≤10 points)
- If variance >10: Adjust temperature lower

**Step 3: Expert Human Review**
- Founder scores same 15 samples manually
- Compare agent scores to human scores
- Acceptable deviation: ±8 points per dimension
- If deviation >8: Refine system prompt

**Step 4: Bias Detection**
- Test with identical content, different writing styles
- Test with identical quality, different lengths
- Ensure scores remain consistent (±5 points)

### Ongoing Monitoring

**Weekly Audit (Automated):**
```python
# Pseudocode for weekly audit
sample_size = 20  # Random sample of week's evaluations
for submission in random_sample(submissions, sample_size):
    scores = []
    for i in range(3):
        score = run_scoring_agent(submission)
        scores.append(score['total_score'])
    
    variance = max(scores) - min(scores)
    if variance > 15:
        flag_for_review(submission)
        alert_admin(f"High variance detected: {variance} points")
```

**Monthly Human Audit:**
- Founder manually reviews 30 random evaluations
- Checks for scoring drift
- Documents any pattern changes
- Adjusts system prompt if needed

---

## 7. COST MANAGEMENT

### Token Usage Estimates

**Per Evaluation:**
- System prompt: ~800 tokens
- Challenge + response: ~500-1500 tokens (avg 800)
- Total input: ~1,600 tokens
- Total output: ~300 tokens

**Cost Calculation:**
- Input: 1,600 tokens × $0.003/1K = $0.0048
- Output: 300 tokens × $0.015/1K = $0.0045
- **Total per evaluation: ~$0.009**

**Monthly Projections:**

| Evaluations/Month | Total Cost | Cost Per User (5 challenges) |
|-------------------|------------|------------------------------|
| 100 (20 users) | $0.90 | $0.045 |
| 500 (100 users) | $4.50 | $0.045 |
| 2,500 (500 users) | $22.50 | $0.045 |
| 10,000 (2,000 users) | $90 | $0.045 |

### Cost Optimization Triggers

**When to switch to GPT-4o-mini:**
- Monthly evaluation count > 5,000
- Cost savings: ~60%
- Acceptable quality trade-off validated

**Rate Limiting:**
- Max 100 concurrent API calls
- Queue additional requests
- Prevents cost spike from abuse

---

## 8. SECURITY & PRIVACY

### Data Handling

**Input Data:**
- Challenge text: Non-sensitive (public benchmark challenges)
- User responses: Potentially sensitive (company data)
- **Action:** Encrypt in transit (TLS), do not log raw responses

**Output Data:**
- Scores: Non-sensitive
- Justifications: May reference user content
- **Action:** Store encrypted at rest

**API Key Security:**
- Store in environment variables
- Never commit to version control
- Rotate every 90 days
- Use separate keys for dev/staging/prod

### Compliance Considerations

**GDPR (if serving EU customers):**
- User responses are "personal data"
- Must have legal basis for processing (contract performance)
- Must allow data deletion on request
- Retention: 2 years max

**Data Retention Policy:**
- Raw submissions: 90 days, then delete
- Scores + anonymized justifications: Indefinite (for benchmark)
- API logs: 30 days

---

## 9. INTEGRATION SPECIFICATIONS

### API Endpoint Structure

**Endpoint:** `POST /api/v1/score`

**Request Body:**
```json
{
  "challenge_id": "string",
  "challenge_text": "string",
  "user_id": "string",
  "user_submission": "string",
  "metadata": {
    "submission_timestamp": "ISO8601",
    "company_id": "string",
    "evaluation_batch_id": "string"
  }
}
```

**Response (Success):**
```json
{
  "status": "success",
  "evaluation_id": "uuid",
  "scores": {
    "clarity": 18,
    "constraint_application": 22,
    "output_specificity": 16,
    "iteration_quality": 19,
    "total_score": 75
  },
  "feedback": {
    "justification": "string",
    "improvement": "string"
  },
  "metadata": {
    "model_used": "claude-sonnet-4-20250514",
    "evaluation_timestamp": "ISO8601",
    "processing_time_ms": 3240
  }
}
```

**Response (Error):**
```json
{
  "status": "error",
  "error_code": "SCORING_PARSE_ERROR",
  "error_message": "Failed to parse AI response as JSON",
  "retry_allowed": true,
  "support_contact": "support@argen.ai"
}
```

### Timeout Handling

**API Timeout:** 30 seconds
- If API call exceeds 30s: Return timeout error
- Retry logic: 3 attempts with exponential backoff (2s, 4s, 8s)
- After 3 failures: Manual review queue

---

## 10. TESTING PROTOCOL

### Unit Tests

```python
# Test: Score range validation
def test_score_ranges():
    response = score_submission(sample_challenge, sample_response)
    assert 0 <= response['clarity'] <= 25
    assert 0 <= response['constraint_application'] <= 25
    assert 0 <= response['output_specificity'] <= 25
    assert 0 <= response['iteration_quality'] <= 25
    assert response['total_score'] == sum([
        response['clarity'],
        response['constraint_application'],
        response['output_specificity'],
        response['iteration_quality']
    ])

# Test: JSON output format
def test_json_format():
    response = score_submission(sample_challenge, sample_response)
    required_keys = ['clarity', 'constraint_application', 'output_specificity', 
                     'iteration_quality', 'total_score', 'justification', 'improvement']
    for key in required_keys:
        assert key in response

# Test: Consistency
def test_scoring_consistency():
    scores = []
    for i in range(5):
        response = score_submission(sample_challenge, sample_response)
        scores.append(response['total_score'])
    
    variance = max(scores) - min(scores)
    assert variance <= 10, f"Variance too high: {variance} points"
```

### Integration Tests

**End-to-End Flow:**
1. Submit challenge via Tally form
2. Webhook triggers Make.com scenario
3. Make.com calls scoring API
4. Verify score written to Airtable
5. Check notification sent to user
6. Validate score appears in report

**Load Testing:**
- Simulate 100 concurrent evaluations
- Measure average response time (target: <5s)
- Identify bottlenecks

---

## 11. VERSIONING & UPDATES

### System Prompt Versioning

**Current Version:** v1.0 (May 2026)

**Change Log:**
- v1.0 (May 2026): Initial production release
- v0.9 (Apr 2026): Beta testing with 10 pilot customers
- v0.8 (Mar 2026): Calibration phase

**Update Protocol:**
1. Never change scoring rubric dimensions (breaks comparability)
2. Can adjust scoring standards within dimensions
3. All prompt changes require A/B test on 50 sample evaluations
4. Must maintain backward compatibility for benchmark data

### Deprecation Policy

**If switching models:**
- Run parallel scoring (old + new model) for 30 days
- Compare score distributions
- If delta >5 points average: Flag as breaking change
- Notify customers 60 days in advance

---

## 12. FAILURE MODES & MITIGATION

| Failure Mode | Likelihood | Impact | Mitigation |
|--------------|------------|--------|------------|
| API rate limit hit | Medium | High | Implement queue system, cache results |
| Inconsistent scoring | Low | Critical | Weekly variance audits, monthly human review |
| API cost spike | Medium | Medium | Set hard spending limits, alerts at $500/month |
| Model deprecation | Low | High | Multi-model strategy, abstraction layer |
| Prompt injection attack | Low | Medium | Input sanitization, output validation |

---

## 13. SUCCESS METRICS

### Agent Performance KPIs

**Accuracy:**
- Human-agent score agreement: >85%
- Measured monthly via manual audit

**Consistency:**
- Score variance on identical inputs: <10 points
- Measured via weekly automated tests

**Reliability:**
- API success rate: >99.5%
- Response time p95: <5 seconds

**Cost Efficiency:**
- Cost per evaluation: <$0.01
- Monitored daily

---

## IMPLEMENTATION CHECKLIST

- [ ] Set up Anthropic API account and generate production API key
- [ ] Implement scoring API endpoint with exact system prompt from Section 3
- [ ] Create 15 benchmark samples for calibration (Section 6)
- [ ] Run calibration tests and validate variance <10 points
- [ ] Set up error handling for all failure modes (Section 12)
- [ ] Implement cost monitoring dashboard
- [ ] Configure rate limiting (100 concurrent max)
- [ ] Set up weekly automated variance audit
- [ ] Document first monthly human audit results
- [ ] Create API key rotation schedule (90-day)

---

**Document Status:** Production Ready  
**Next Review Date:** August 2026  
**Owner:** Technical Architecture Team
