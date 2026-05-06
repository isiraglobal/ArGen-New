# ArGen Challenge Delivery App — Complete Specification

**Version:** 1.0  
**Last Updated:** May 2026  
**Platform:** Tally.so (Primary), Notion (Alternative)

---

## 1. APPLICATION PURPOSE

### Primary Function
Deliver standardized work challenges to evaluation participants and capture their responses in a structured format.

### User Journey
1. User receives unique evaluation link via email
2. Opens form, sees company branding + ArGen logo
3. Completes 5 challenges sequentially
4. Submits responses
5. Receives confirmation message
6. System triggers scoring workflow

---

## 2. PLATFORM SELECTION: TALLY.SO

### Why Tally

**Advantages:**
- Unlimited forms on free tier
- Unlimited submissions
- No branding watermark (critical for B2B credibility)
- Clean, professional UI
- Webhook support for automation
- Logic jumps for sequential challenge delivery
- File upload support
- Custom domain connection
- GDPR compliant

**Limitations:**
- No native conditional logic based on previous responses (not needed for ArGen)
- Limited design customization (acceptable trade-off)

**Cost:** $0/month (free tier sufficient until 1,000+ evaluations/month)

---

## 3. FORM STRUCTURE

### Page 1: Welcome Screen

**Elements:**
- Company logo (uploaded per client)
- ArGen logo (co-branding)
- Headline: "Your AI Performance Evaluation"
- Subheadline: "Complete 5 real work challenges. Your responses will be scored across 4 dimensions: Clarity, Constraint Application, Output Specificity, and Iteration Quality."
- Estimated time: "30-45 minutes"
- Privacy note: "Your responses are confidential and used only for evaluation purposes."
- Button: "Start Evaluation"

**Data Collected:**
- Participant name (text input, required)
- Participant email (email input, required)
- Company name (hidden field, pre-filled via URL parameter)
- Job role (dropdown: Executive, Manager, Individual Contributor, Other)
- Department (dropdown: Sales, Marketing, Product, Engineering, Operations, Other)

---

### Page 2-6: Challenge Pages (5 Total)

**Each Challenge Page Contains:**

**Challenge Instructions Box (Non-editable text):**
```
CHALLENGE [1-5]: [Challenge Type]

[Challenge scenario and detailed instructions]

Word Limit: [X words]
Format Requirements: [Specific format needed]
Time Suggestion: [X minutes]

Tip: You may use any AI tools you normally use at work. We're evaluating your output quality, not whether you used AI.
```

**Response Field:**
- Long text input (500-1000 words capacity)
- Character counter displayed
- Required field
- Placeholder: "Enter your response here..."

**Optional: Process Notes Field**
- Long text input (optional)
- Placeholder: "Optional: Briefly describe your approach or which AI tools you used"
- Non-scored, used for future product insights

**Navigation:**
- "Save & Continue" button (auto-saves progress)
- Progress indicator: "Challenge 2 of 5"

---

### Page 7: Submission Confirmation

**Elements:**
- Success message: "Evaluation Complete ✓"
- Next steps: "Your responses have been submitted for evaluation. You'll receive your performance report within [X business days]."
- Expected report delivery date (dynamic, calculated based on current queue)
- Contact information: "Questions? Email support@argen.ai"
- Optional: Feedback form link

---

## 4. CHALLENGE LIBRARY STRUCTURE

### Challenge Rotation System

**Requirement:** Never use same 5 challenges twice for same company

**Solution:** Challenge Pool Organization

| Pool | Challenge Count | Rotation Rule |
|------|-----------------|---------------|
| Strategy Challenges | 8 variations | Rotate every evaluation cycle |
| Data Interpretation | 8 variations | Rotate every evaluation cycle |
| Communication | 8 variations | Rotate every evaluation cycle |
| Research Synthesis | 8 variations | Rotate every evaluation cycle |
| Iteration/Refinement | 8 variations | Rotate every evaluation cycle |

**Total Pool:** 40 challenges minimum

**Rotation Logic:**
- First evaluation: Challenges 1, 9, 17, 25, 33
- Second evaluation: Challenges 2, 10, 18, 26, 34
- And so on...

### Challenge Template Structure

```markdown
CHALLENGE ID: [UNIQUE_ID]
CHALLENGE TYPE: [Strategy/Data/Communication/Research/Iteration]
DIFFICULTY LEVEL: [Beginner/Intermediate/Advanced]
INDUSTRY: [Generic/Tech/Finance/Healthcare/Retail]

---

SCENARIO:
[Background context - 2-3 sentences]

YOUR TASK:
[Clear, specific instruction - 2-4 sentences]

CONSTRAINTS:
- Word limit: [X] words
- Format: [Specific structure required]
- Must include: [Specific elements]
- Prohibited: [What they cannot do]

TIME SUGGESTION: [X] minutes

---

EVALUATION FOCUS:
This challenge primarily tests: [Primary dimension + secondary dimension]
```

---

## 5. SAMPLE CHALLENGES (PRODUCTION-READY)

### Challenge 1: Go-to-Market Strategy

```markdown
CHALLENGE ID: C001_STRATEGY_GTM
CHALLENGE TYPE: Strategy
DIFFICULTY: Intermediate
INDUSTRY: Generic

---

SCENARIO:
Your company is launching a new project management tool specifically designed for remote teams. The market is crowded with competitors like Asana, Monday.com, and ClickUp. Your differentiator is built-in async video messaging for task updates.

YOUR TASK:
Create a 90-day go-to-market plan for this product launch. Focus on the first customer segment you would target and the primary acquisition channel.

CONSTRAINTS:
- Maximum 300 words
- Must include: (1) Specific target segment, (2) One primary channel, (3) Success metrics
- Format: Use clear section headers
- Must be actionable (specific tactics, not generic principles)

TIME SUGGESTION: 15 minutes

---

EVALUATION FOCUS:
Primary: Output Specificity
Secondary: Clarity, Constraint Application
```

---

### Challenge 2: Sales Data Analysis

```markdown
CHALLENGE ID: C009_DATA_SALES
CHALLENGE TYPE: Data Interpretation
DIFFICULTY: Intermediate
INDUSTRY: Generic

---

SCENARIO:
Here is Q1 2026 sales data for a B2B SaaS company:

January: 23 deals closed, $287K revenue, avg deal size $12,478
February: 31 deals closed, $264K revenue, avg deal size $8,516
March: 19 deals closed, $412K revenue, avg deal size $21,684

Lead sources: Inbound (60%), Outbound (25%), Referral (15%)

YOUR TASK:
Identify the top 3 actionable insights from this data and write an executive summary for the CEO. Recommend one specific action for next quarter.

CONSTRAINTS:
- Maximum 250 words
- Must include: (1) Three specific insights with supporting data, (2) One clear recommendation
- Format: Use bullet points for insights, paragraph for recommendation
- Avoid generic observations (e.g., "we should increase sales")

TIME SUGGESTION: 12 minutes

---

EVALUATION FOCUS:
Primary: Output Specificity, Iteration Quality
Secondary: Clarity
```

---

### Challenge 3: Client Recovery Email

```markdown
CHALLENGE ID: C017_COMM_RECOVERY
CHALLENGE TYPE: Communication
DIFFICULTY: Advanced
INDUSTRY: Generic

---

SCENARIO:
A key client (paying $50K/year) sent this complaint email yesterday:

"We've been facing login issues for 3 days. Support has been slow to respond and the issue still isn't fixed. We're evaluating alternatives. This is unacceptable for what we pay."

You are the account manager. Your support team has just fixed the root cause issue 10 minutes ago.

YOUR TASK:
Draft a recovery email to this client. Your goal: acknowledge the problem, explain what happened, rebuild trust, and prevent churn.

CONSTRAINTS:
- Maximum 150 words
- Must include: (1) Acknowledgment, (2) Specific explanation of what went wrong, (3) Prevention measures, (4) Goodwill gesture
- Tone: Professional but human, empathetic but not over-apologetic
- Avoid: Corporate jargon, vague promises

TIME SUGGESTION: 10 minutes

---

EVALUATION FOCUS:
Primary: Constraint Application, Clarity
Secondary: Output Specificity
```

---

### Challenge 4: Market Research Synthesis

```markdown
CHALLENGE ID: C025_RESEARCH_MARKET
CHALLENGE TYPE: Research Synthesis
DIFFICULTY: Intermediate
INDUSTRY: Generic

---

YOUR TASK:
Research and summarize the top 3 risks for a US-based e-commerce company expanding into Southeast Asia (Singapore, Indonesia, Thailand) in 2026.

CONSTRAINTS:
- Maximum 300 words
- Must include: (1) Three distinct risks, (2) Evidence or data supporting each risk, (3) Severity rating (High/Medium/Low) for each
- Sources: You may use any AI tools or web search
- Format: One paragraph per risk with clear headers

TIME SUGGESTION: 15 minutes

---

EVALUATION FOCUS:
Primary: Output Specificity, Iteration Quality
Secondary: Clarity
```

---

### Challenge 5: Content Refinement

```markdown
CHALLENGE ID: C033_ITERATION_PRODUCT
CHALLENGE TYPE: Iteration/Refinement
DIFFICULTY: Beginner
INDUSTRY: Generic

---

SCENARIO:
Below is a weak first draft of a product description for a new smartwatch:

"Our new smartwatch is really good. It has many features that users will love. The battery life is great and it looks nice. It's perfect for anyone who wants a smartwatch that works well and doesn't cost too much. You can track your fitness and get notifications."

YOUR TASK:
Rewrite this product description to be clear, specific, and persuasive. Show the before-and-after with your improvements.

CONSTRAINTS:
- Maximum 200 words for your rewritten version
- Must improve: (1) Clarity, (2) Specificity, (3) Persuasiveness
- Format: Show "BEFORE" (original text) and "AFTER" (your version)
- Include at least 3 specific features or benefits

TIME SUGGESTION: 10 minutes

---

EVALUATION FOCUS:
Primary: Iteration Quality, Output Specificity
Secondary: Clarity
```

---

## 6. TECHNICAL CONFIGURATION

### Tally Form Settings

**General Settings:**
- Form name: "ArGen Evaluation - [Company Name] - [Date]"
- URL slug: Custom per client (e.g., `argen-acmecorp-may2026`)
- Allow one response per email: YES
- Show progress bar: YES
- Auto-save responses: YES (every 30 seconds)

**Design Settings:**
- Theme: Clean, minimal
- Primary color: #1A2A4A (ArGen Deep Blue)
- Accent color: #2ECCB6 (ArGen Fresh Emerald)
- Font: Inter or system default
- Button style: Rounded, filled
- Background: White (#FFFFFF)

**Privacy Settings:**
- Collect email addresses: YES (required for report delivery)
- GDPR compliant: YES
- Data retention: Responses stored for 90 days, then exported and deleted from Tally
- Privacy policy link: [Your privacy policy URL]

**Notification Settings:**
- Send confirmation email to respondent: YES
- Email subject: "ArGen Evaluation Received - Report Coming Soon"
- Email body: [See Section 7]

---

## 7. AUTOMATED EMAIL CONFIRMATIONS

### Submission Confirmation Email (Tally Auto-Send)

**Subject:** ArGen Evaluation Complete ✓

**Body:**
```
Hi [Participant Name],

Thank you for completing your ArGen evaluation.

Your responses have been received and will be scored within the next 48 hours. Your individual performance report will be delivered to you and your team leadership by [Expected Date].

What happens next:
1. Our AI scoring engine evaluates your 5 responses across 4 dimensions
2. Your scores are compiled into a detailed report
3. Your team's aggregate scores are calculated
4. Leadership receives the full team report

Questions? Reply to this email or contact support@argen.ai.

Best regards,
ArGen Team

---
This evaluation was conducted by ArGen (argen.ai) on behalf of [Company Name].
```

---

## 8. DATA COLLECTION STRUCTURE

### Data Fields Captured

**Metadata (Auto-captured):**
- Submission ID (UUID)
- Timestamp (ISO 8601)
- Form completion time (minutes)
- IP address (for fraud detection)
- User agent (device type)
- URL parameters (company ID, batch ID)

**User Information:**
- Full name
- Email address
- Company name
- Job role
- Department

**Challenge Responses (5 fields):**
- Challenge 1 response (long text)
- Challenge 2 response (long text)
- Challenge 3 response (long text)
- Challenge 4 response (long text)
- Challenge 5 response (long text)

**Optional Fields:**
- Process notes for each challenge (5 optional fields)

---

## 9. WEBHOOK INTEGRATION

### Webhook Configuration (Tally → Make.com)

**Endpoint:** [Your Make.com webhook URL]

**Trigger:** On form submission (immediate)

**Payload Structure:**
```json
{
  "event_id": "evt_abc123",
  "event_type": "FORM_RESPONSE",
  "created_at": "2026-05-06T10:30:00Z",
  "data": {
    "response_id": "resp_xyz789",
    "form_id": "form_argen_v1",
    "fields": {
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
      "challenge_5_process": "..."
    }
  }
}
```

**Webhook Security:**
- Use HTTPS only
- Verify webhook signature (Tally provides signature in header)
- Whitelist Tally IP addresses

---

## 10. FORM VARIATIONS

### Client-Specific Customization

**Per-Client Variables:**
- Company logo URL
- Company name
- Primary brand color (optional)
- Custom welcome message (optional)
- Custom time estimate (30-60 minutes range)
- Expected report delivery timeframe

**How to Handle:**
- Create form template in Tally
- Clone per client
- Update variables
- Generate unique URL slug
- Store form ID in Airtable client record

---

## 11. ACCESSIBILITY & UX

### Accessibility Requirements

**WCAG 2.1 AA Compliance:**
- Minimum font size: 16px
- Contrast ratio: 4.5:1 for text
- Keyboard navigation support
- Screen reader compatible
- Alternative text for logos
- Clear error messages

### Mobile Optimization

**Required:**
- Responsive design (Tally handles automatically)
- Touch-friendly buttons (min 44x44px)
- No horizontal scrolling
- Large text inputs for mobile keyboards

### Progress Saving

**Auto-save Functionality:**
- Saves after each challenge completed
- User can close and resume later
- Resume link sent via email if form abandoned
- Expires after 7 days

---

## 12. FRAUD PREVENTION

### Detection Measures

**Red Flags:**
- Multiple submissions from same email
- Submission time < 10 minutes (impossible to complete thoughtfully)
- Identical responses across multiple participants
- Gibberish or extremely short responses (<50 words per challenge)
- Copy-pasted lorem ipsum or placeholder text

**Automated Checks:**
```python
# Pseudocode for fraud detection
def check_submission_validity(submission):
    flags = []
    
    # Check completion time
    if submission['completion_time'] < 600:  # 10 minutes
        flags.append('TOO_FAST')
    
    # Check response lengths
    for i in range(1, 6):
        response = submission[f'challenge_{i}_response']
        if len(response.split()) < 50:
            flags.append(f'CHALLENGE_{i}_TOO_SHORT')
    
    # Check for duplicate content
    if check_plagiarism(submission):
        flags.append('DUPLICATE_CONTENT')
    
    return flags
```

**Action on Flags:**
- Flag submission for manual review
- Do not auto-score
- Contact participant for clarification
- If fraud confirmed: Exclude from evaluation

---

## 13. TESTING PROTOCOL

### Pre-Launch Checklist

- [ ] Test form on desktop (Chrome, Firefox, Safari)
- [ ] Test form on mobile (iOS Safari, Android Chrome)
- [ ] Verify all 5 challenges display correctly
- [ ] Test webhook delivery to Make.com
- [ ] Verify data structure in Airtable
- [ ] Test auto-save functionality
- [ ] Test resume-later link
- [ ] Verify confirmation email sends
- [ ] Test with intentional fraud scenarios
- [ ] Verify GDPR compliance elements present
- [ ] Load test with 50 concurrent submissions

---

## 14. MAINTENANCE SCHEDULE

**Weekly:**
- Review submission completion rates
- Check for abandoned forms
- Monitor webhook success rate

**Monthly:**
- Rotate challenge sets for recurring clients
- Update challenge library with new variations
- Review fraud flags and improve detection

**Quarterly:**
- User experience survey
- A/B test form design improvements
- Update challenge difficulty based on score distribution

---

## 15. COST PROJECTIONS

| Volume | Monthly Cost |
|--------|--------------|
| 0-1,000 submissions | $0 (Tally free tier) |
| 1,000-5,000 | $29/month (Tally Pro) |
| 5,000+ | $99/month (Tally Business) |

**Trigger for upgrade:** 800 submissions/month (buffer before hitting limit)

---

## IMPLEMENTATION CHECKLIST

- [ ] Create Tally account
- [ ] Build master form template with all 5 challenge placeholders
- [ ] Upload challenge library (minimum 40 challenges)
- [ ] Set up challenge rotation system in Airtable
- [ ] Configure webhook to Make.com
- [ ] Create confirmation email template
- [ ] Test end-to-end submission flow
- [ ] Set up fraud detection automated checks
- [ ] Create client customization SOP
- [ ] Document form cloning process

---

**Document Status:** Production Ready  
**Next Review Date:** August 2026  
**Owner:** Product & Operations
