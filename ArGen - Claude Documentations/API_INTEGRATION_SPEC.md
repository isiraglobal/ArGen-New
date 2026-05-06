# ArGen API Integration — Complete Specification

**Version:** 1.0  
**Last Updated:** May 2026  
**Primary API:** Anthropic Claude API

---

## 1. API OVERVIEW

### Purpose
Connect ArGen scoring engine to Claude Sonnet 4 for automated evaluation of work submissions.

### API Provider
**Anthropic API**
- Documentation: https://docs.anthropic.com
- Console: https://console.anthropic.com
- Endpoint: https://api.anthropic.com/v1/messages

### Secondary/Fallback API
**OpenAI API (GPT-4o-mini)**
- Use case: Cost optimization at scale (>5,000 evaluations/month)
- Documentation: https://platform.openai.com/docs

---

## 2. ANTHROPIC API SETUP

### Account Creation

**Step 1: Create Account**
- Visit console.anthropic.com
- Sign up with business email
- Verify email address

**Step 2: Get API Key**
- Navigate to API Keys section
- Generate new key
- Name: "ArGen Production"
- Copy key immediately (shown once)
- Store in secure location

**Step 3: Set Usage Limits**
- Set monthly spending limit: $500 (safety threshold)
- Enable email alerts at 50%, 75%, 90% of limit
- Notification email: founder@argen.ai

---

## 3. API REQUEST STRUCTURE

### Endpoint
```
POST https://api.anthropic.com/v1/messages
```

### Required Headers
```
x-api-key: {{ANTHROPIC_API_KEY}}
anthropic-version: 2023-06-01
content-type: application/json
```

### Request Body

```json
{
  "model": "claude-sonnet-4-20250514",
  "max_tokens": 2000,
  "temperature": 0.1,
  "system": "[SCORING RUBRIC]",
  "messages": [
    {
      "role": "user",
      "content": "CHALLENGE: [text]\n\nRESPONSE: [text]"
    }
  ]
}
```

---

## 4. EXPECTED RESPONSE

### Success Response (200 OK)

```json
{
  "id": "msg_123abc",
  "type": "message",
  "role": "assistant",
  "content": [
    {
      "type": "text",
      "text": "{\"clarity\":18,\"constraint_application\":22,\"output_specificity\":16,\"iteration_quality\":19,\"total_score\":75,\"justification\":\"Response demonstrates strong constraint following...\",\"improvement\":\"Include specific metrics...\"}"
    }
  ],
  "model": "claude-sonnet-4-20250514",
  "stop_reason": "end_turn",
  "usage": {
    "input_tokens": 1624,
    "output_tokens": 287
  }
}
```

### Error Responses

**401 Unauthorized:**
```json
{
  "type": "error",
  "error": {
    "type": "authentication_error",
    "message": "invalid x-api-key"
  }
}
```

**429 Rate Limit:**
```json
{
  "type": "error",
  "error": {
    "type": "rate_limit_error",
    "message": "Rate limit exceeded"
  }
}
```

**500 Server Error:**
```json
{
  "type": "error",
  "error": {
    "type": "api_error",
    "message": "Internal server error"
  }
}
```

---

## 5. ERROR HANDLING

### Retry Logic

**Retry Policy:**
- Max retries: 3
- Backoff: Exponential (2s, 4s, 8s)
- Retry on: 429, 500, 503, timeout
- Do not retry on: 400, 401, 403

**Implementation (Pseudocode):**
```python
def call_anthropic_api(payload, retry_count=0):
    try:
        response = http.post(
            url="https://api.anthropic.com/v1/messages",
            headers={...},
            body=payload,
            timeout=30
        )
        return response
    except (RateLimitError, ServerError, Timeout) as e:
        if retry_count < 3:
            wait_seconds = 2 ** retry_count
            sleep(wait_seconds)
            return call_anthropic_api(payload, retry_count + 1)
        else:
            log_error(e)
            flag_for_manual_review()
            raise
```

---

## 6. COST TRACKING

### Pricing (May 2026)

**Claude Sonnet 4:**
- Input: $0.003 per 1K tokens
- Output: $0.015 per 1K tokens

**Per Evaluation Cost:**
- Input tokens: ~1,600 (system prompt + challenge + response)
- Output tokens: ~300 (scores + justification)
- Cost: (1.6 × $0.003) + (0.3 × $0.015) = $0.0093 ≈ $0.01

### Monthly Projections

| Evaluations | Total Cost | Notes |
|-------------|------------|-------|
| 100 | $0.93 | First paying customers |
| 500 | $4.65 | Break-even point |
| 2,500 | $23.25 | Sustainable scale |
| 10,000 | $93.00 | Consider GPT-4o-mini |

### Cost Monitoring

**Track in Airtable:**
- Field: API Cost (per submission)
- Calculate from `usage.input_tokens` and `usage.output_tokens`
- Monthly rollup view for budgeting

**Alerts:**
- Email if monthly cost > $100
- Email if single call > $0.50 (anomaly detection)

---

## 7. RATE LIMITS

### Anthropic Limits

**Tier 1 (New accounts):**
- 50 requests per minute (RPM)
- 40,000 tokens per minute (TPM)

**Tier 2 (After $100 spent):**
- 100 RPM
- 100,000 TPM

### ArGen Usage Pattern

**Peak Load:**
- 25-person evaluation = 125 API calls (5 per person)
- Spread over ~2 hours (as submissions come in)
- Average: ~1 request per minute
- Well within limits

**Safety Measures:**
- Implement queue system in Make.com
- Max 10 concurrent API calls
- Prevents burst rate limit hits

---

## 8. RESPONSE PARSING

### Extract JSON from Response

**Step 1: Get Text Content**
```javascript
const responseText = apiResponse.content[0].text
```

**Step 2: Clean Text**
```javascript
// Remove markdown fences if present
const cleanText = responseText
  .replace(/```json/g, '')
  .replace(/```/g, '')
  .trim()
```

**Step 3: Parse JSON**
```javascript
try {
  const scores = JSON.parse(cleanText)
  return scores
} catch (error) {
  log_error("JSON parse failed", {raw: responseText})
  flag_for_manual_review()
  return null
}
```

**Step 4: Validate Structure**
```javascript
const requiredFields = [
  'clarity',
  'constraint_application',
  'output_specificity',
  'iteration_quality',
  'total_score',
  'justification',
  'improvement'
]

for (const field of requiredFields) {
  if (!(field in scores)) {
    throw new Error(`Missing field: ${field}`)
  }
}

// Validate score ranges
if (scores.clarity < 0 || scores.clarity > 25) {
  throw new Error("Clarity score out of range")
}
// ... repeat for all dimensions

// Validate total
const sum = scores.clarity + scores.constraint_application + 
            scores.output_specificity + scores.iteration_quality
if (scores.total_score !== sum) {
  throw new Error("Total score mismatch")
}
```

---

## 9. OPENAI API (FALLBACK)

### When to Use

**Trigger:** Monthly API cost > $150

**Model:** gpt-4o-mini
- Cost: ~60% cheaper than Claude Sonnet
- Quality: Slightly less consistent but acceptable

### Configuration Differences

**Endpoint:**
```
POST https://api.openai.com/v1/chat/completions
```

**Headers:**
```
Authorization: Bearer {{OPENAI_API_KEY}}
Content-Type: application/json
```

**Request Body:**
```json
{
  "model": "gpt-4o-mini",
  "messages": [
    {
      "role": "system",
      "content": "{{SCORING_RUBRIC}}"
    },
    {
      "role": "user",
      "content": "{{CHALLENGE_AND_RESPONSE}}"
    }
  ],
  "temperature": 0.1,
  "max_tokens": 2000,
  "response_format": { "type": "json_object" }
}
```

**Key Difference:**
- `response_format: json_object` forces JSON output
- More reliable than Claude for structured output

---

## 10. SECURITY

### API Key Protection

**Never:**
- Commit keys to Git
- Share keys in Slack/email
- Log keys in console
- Include in error messages
- Store in client-side code

**Always:**
- Use environment variables
- Rotate every 90 days
- Revoke immediately if exposed
- Use separate keys per environment

### Data Privacy

**PII in API Calls:**
- Participant names: NOT sent to API
- Emails: NOT sent to API
- Company names: NOT sent to API
- Only challenge text + response sent

**Compliance:**
- Anthropic: GDPR compliant, SOC 2 Type II
- Data processed in US (ensure compliance with your jurisdiction)

---

## 11. TESTING

### Test Cases

**Test 1: Valid Response**
```javascript
// Input: High-quality response
// Expected: Scores 70-90, valid JSON, all fields present
```

**Test 2: Low-Quality Response**
```javascript
// Input: Gibberish or very short response
// Expected: Scores 0-30, valid JSON, critical justification
```

**Test 3: Edge Cases**
```javascript
// Input: Exactly at word limit
// Expected: No penalty for constraint following
```

**Test 4: Error Handling**
```javascript
// Simulate: API timeout
// Expected: Retry 3x, then manual review flag
```

---

## 12. MONITORING

### Key Metrics

**API Health:**
- Success rate: >99%
- Average response time: <5s
- Error rate by type (401, 429, 500)

**Cost Efficiency:**
- Cost per evaluation: ~$0.01
- Monthly spend vs budget
- Token usage trends

**Quality:**
- Score variance on identical inputs: <10 points
- Human-AI agreement: >85%

### Dashboards

**Make.com Execution History:**
- Filter by scenario
- View API call logs
- Check error details

**Anthropic Console:**
- Token usage over time
- Spend tracking
- Rate limit consumption

---

## IMPLEMENTATION CHECKLIST

- [ ] Create Anthropic API account
- [ ] Generate production API key
- [ ] Store key in environment variables (Make.com + local)
- [ ] Set spending limit ($500/month)
- [ ] Enable usage alerts
- [ ] Test API call with sample data
- [ ] Verify JSON parsing works
- [ ] Implement retry logic in Make.com
- [ ] Set up cost tracking in Airtable
- [ ] Document OpenAI fallback procedure
- [ ] Create API monitoring dashboard
- [ ] Schedule 90-day key rotation reminder

---

**Document Status:** Production Ready  
**Next Review Date:** August 2026  
**Owner:** Technical Architecture
