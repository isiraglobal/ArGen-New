# ArGen Operations Manual — Daily/Weekly Workflows

**Version:** 1.0  
**Last Updated:** May 2026  
**Owner:** Founder/Operations

---

## 1. DAILY OPERATIONS (15-30 minutes)

### Morning Routine (Every Weekday, 9:00 AM)

**Step 1: Check Pending Evaluations (5 min)**
- Open Airtable: Participants table
- View: "Pending Submissions"
- Count: How many awaiting completion?
- Action: If >7 days overdue, send reminder email

**Step 2: Review Overnight Submissions (5 min)**
- Open Airtable: Submissions table
- View: "Needs Scoring" (Scoring Status = Pending)
- Check: Should be empty (Make.com auto-scores)
- If not empty: Investigate error logs in Make.com

**Step 3: Check Make.com Execution Status (5 min)**
- Login to Make.com
- View: Execution History (last 24 hours)
- Check: Any failed scenarios?
- Action: If errors > 5%, investigate immediately

**Step 4: Monitor API Costs (2 min)**
- Anthropic Console → Usage tab
- Check: Yesterday's spend
- Track: Running monthly total
- Alert: If >$20/day, investigate anomaly

**Step 5: Email Inbox Triage (10 min)**
- Check: support@argen.ai
- Priority:
  1. Customer questions about reports
  2. New evaluation requests
  3. Technical issues
  4. Everything else
- Respond: Within 24 hours (same day if urgent)

---

## 2. WEEKLY OPERATIONS (2-3 hours)

### Monday: Outreach & Pipeline (3-4 hours)

**9:00-10:30 AM: LinkedIn Outreach**
- Goal: 20 connection requests
- Target: CEOs, COOs, CTOs at 50-300 person companies
- Template: See Promotion Playbook
- Track: Log in Notion CRM

**10:30-11:30 AM: Content Creation**
- Write: 1 LinkedIn post for Monday
- Type: Insight post (see Promotion Playbook for format)
- Schedule: Post immediately or queue for 2 PM

**11:30 AM-12:30 PM: Follow-Ups**
- Review: All open conversations in LinkedIn
- Send: Follow-up messages to warm leads
- Book: Discovery calls for interested prospects

### Tuesday: Product & Delivery (4-5 hours)

**9:00-11:00 AM: Generate Reports**
- Check: Evaluation Batches table
- View: "Complete - Report Pending"
- For each:
  1. Export data from Airtable
  2. Clone Google Slides template
  3. Fill in all data fields
  4. Generate charts
  5. Proofread
  6. Export PDF
  7. Upload to Airtable
  8. Send to client via email
- Time: ~45 min per report

**11:00 AM-12:00 PM: Product Improvements**
- Review: Last week's evaluations
- Identify: Any patterns in errors/issues
- Update: Scoring prompt if needed (rare)
- Add: New challenges to library
- Document: Any process improvements

**1:00-3:00 PM: Customer Calls**
- Conduct: Scheduled report walkthrough calls
- Duration: 30 min each
- Record: Key insights and feedback
- Follow up: Send recording + next steps email

### Wednesday: Content & Community (2-3 hours)

**9:00-10:00 AM: Content Creation**
- Write: 1 LinkedIn post (Story format)
- Reference: Recent customer success or insight
- Include: Specific data point from evaluations
- Post: Immediately or schedule for 2 PM

**10:00-11:30 AM: Community Engagement**
- LinkedIn:
  - Comment on 10 target buyer posts
  - Respond to all comments on your posts
  - Join 2-3 relevant conversations
- Indie Hackers / Reddit:
  - Post build-in-public update
  - Answer 3-5 questions in community

**11:30 AM-1:00 PM: Partner Outreach**
- Identify: 5 potential partners (consultants, coaches)
- Send: Partnership pitch emails
- Follow up: Existing partner conversations

### Thursday: Customer Service & Delivery (3-4 hours)

**9:00-12:00 PM: Run Active Evaluations**
- Check: Airtable Evaluation Batches
- View: "In Progress"
- For each batch:
  1. Monitor completion rate
  2. Send reminders if <50% complete
  3. Answer participant questions
  4. Troubleshoot any issues

**1:00-3:00 PM: Invoicing & Admin**
- Generate invoices for completed evaluations
- Send via Stripe payment links
- Follow up: Overdue invoices (>7 days)
- Update: MRR tracker in Airtable

### Friday: Review & Planning (1-2 hours)

**9:00-10:00 AM: Weekly Metrics Review**
- Open: Weekly Metrics Spreadsheet
- Update:
  - Outreach sent (target: 20)
  - Replies received
  - Discovery calls booked (target: 2)
  - Evaluations completed
  - Reports delivered
  - Revenue (week + month + MRR)
- Compare: Against previous week
- Note: What's working, what's not

**10:00-11:00 AM: Next Week Planning**
- Review: Pipeline for next week
- Schedule: All customer calls
- Block: Time for report generation
- Identify: One thing to improve
- Document: In Notion

---

## 3. MONTHLY OPERATIONS (Half Day)

### First Monday of Each Month

**Revenue & Finance Review (1 hour)**
- Calculate: Last month's total revenue
- Break down: One-time vs. recurring
- Update: Financial projections
- Check: Runway (months of operation remaining)
- Action: If runway <6 months, prioritize sales

**Product Quality Audit (1 hour)**
- Random sample: 30 evaluations from last month
- Check:
  - Score variance (<10 points on re-score)
  - Justification quality
  - Any scoring anomalies
- Document: Any rubric adjustments needed
- Test: Adjustments on 10 sample responses before deploying

**Challenge Library Update (30 min)**
- Review: Challenge usage stats
- Retire: Challenges used >100 times
- Create: 5 new challenge variations
- Test: New challenges on dummy responses

**Customer Health Check (30 min)**
- View: Companies table, filter Active
- For each: Check "Last Evaluation Date"
- Flag: If >90 days since last eval (risk of churn)
- Action: Send check-in email offering discount on next eval

---

## 4. QUARTERLY OPERATIONS (Full Day)

### First Week of Each Quarter

**Benchmark Data Compilation (3 hours)**
- Export: All scores from last quarter
- Calculate:
  - Industry medians by sector
  - Role medians (Executive, Manager, IC)
  - Company size trends
  - Top performing company characteristics
- Update: Benchmark Base in Airtable
- Prepare: Aggregate insights for next reports

**Strategic Review (2 hours)**
- Review: Last quarter goals vs. actuals
- Celebrate: Wins (publicly on LinkedIn)
- Analyze: Misses (why? what to change?)
- Set: Next quarter OKRs
  - Revenue target
  - Customer acquisition target
  - Product improvement goals
- Document: In Notion Strategic Plan

**Product Roadmap Update (1 hour)**
- Survey: Top 10 customers for feature requests
- Prioritize: Based on frequency and impact
- Plan: What to build next quarter
- Communicate: Roadmap to customers

**Build-in-Public Content (1 hour)**
- Write: Quarterly update post
- Include: Revenue, customer count, lessons learned
- Post: LinkedIn + Indie Hackers
- Frame: Transparently, with numbers

---

## 5. EMERGENCY PROCEDURES

### System Down (Make.com Outage)

**Detection:** Submissions not being scored

**Immediate Action:**
1. Check Make.com status page
2. If outage confirmed: Post on LinkedIn acknowledging delay
3. Email all active customers: "Temporary delay in scoring, will resolve within 24h"

**Workaround:**
1. Export pending submissions from Airtable
2. Manually call Anthropic API via Postman or Python script
3. Paste scores back into Airtable
4. Generate reports manually

**Recovery:**
1. Once Make.com restored, test full flow
2. Process all backlog
3. Email customers when complete

### API Cost Spike

**Detection:** Daily spend >$50 (vs. normal ~$3-5)

**Immediate Action:**
1. Check Anthropic Console for usage breakdown
2. Identify: Which API calls are causing spike
3. Pause Make.com scenarios immediately

**Investigation:**
1. Review Make.com execution logs
2. Look for: Infinite loops, duplicate submissions, errors causing retries
3. Fix: Root cause

**Prevention:**
1. Set hard spending limit in Anthropic Console ($500/month)
2. Enable alerts at $20/day
3. Implement better error handling in Make.com

### Customer Complaint (Scores "Wrong")

**Response Template:**

"Thank you for raising this. ArGen scores are based on output quality across 4 specific dimensions, and I'd like to understand your concern.

Could you share:
1. Which specific score(s) seem inaccurate?
2. What would you expect the score to be and why?

All scores include AI justification explaining the rating. I'm also happy to manually review the evaluation if you'd like a second assessment.

Our goal is accurate, fair measurement. If there's an issue with the scoring rubric, I want to fix it."

**Escalation:**
- If customer threatens legal action: Consult lawyer
- If customer demands refund: Case-by-case (default: offer re-evaluation free)
- If customer posts negative review: Respond professionally, offer to resolve

---

## 6. CUSTOMER ONBOARDING CHECKLIST

### New Customer Signed (1 hour setup)

- [ ] Create company record in Airtable
- [ ] Create evaluation batch record
- [ ] Assign challenge set (rotate from library)
- [ ] Clone Tally form template
- [ ] Customize form: Company logo, name, branding
- [ ] Generate unique form URL
- [ ] Create participant records (upload CSV if bulk)
- [ ] Send evaluation links via email (template in Gmail)
- [ ] Set calendar reminder: Follow up in 7 days if <50% complete
- [ ] Add to CRM with status: "Active - Evaluation In Progress"

### Post-Evaluation Delivery

- [ ] Generate report (see Tuesday workflow)
- [ ] Upload PDF to Airtable
- [ ] Send report email to primary contact
- [ ] Send individual reports to all participants
- [ ] Schedule report walkthrough call (Calendly link in email)
- [ ] Generate invoice in Stripe
- [ ] Send payment link
- [ ] Update CRM status: "Evaluation Complete - Payment Pending"
- [ ] 7 days later: Follow up if payment not received

---

## 7. TOOLS & LOGINS

### Critical Accounts

| Tool | Purpose | Login |
|------|---------|-------|
| Airtable | Database | founder@argen.ai |
| Make.com | Automation | founder@argen.ai |
| Tally.so | Forms | founder@argen.ai |
| Anthropic Console | API | founder@argen.ai |
| Gmail | Communication | support@argen.ai |
| LinkedIn | Outreach | personal account |
| Stripe | Payments | founder@argen.ai |
| Google Drive | File storage | founder@argen.ai |
| Notion | CRM & docs | founder@argen.ai |
| Calendly | Scheduling | founder@argen.ai |

**Password Management:** Use 1Password or Bitwarden

**2FA:** Enabled on all accounts

**Backup Access:** Store recovery codes in secure location

---

## 8. WEEKLY TIME ALLOCATION

| Day | Hours | Primary Focus |
|-----|-------|---------------|
| Monday | 3-4 | Outreach, pipeline building |
| Tuesday | 4-5 | Product, reports, customer calls |
| Wednesday | 2-3 | Content, community |
| Thursday | 3-4 | Customer service, admin |
| Friday | 1-2 | Review, planning |
| **Total** | **13-18** | Sustainable for solo founder |

**Buffer:** Remaining hours for:
- Learning / skill development
- Emergency customer issues
- Product improvements
- Strategic thinking

---

## IMPLEMENTATION CHECKLIST

- [ ] Set up morning routine calendar reminder (9 AM daily)
- [ ] Create weekly schedule blocks in Google Calendar
- [ ] Build weekly metrics tracking spreadsheet
- [ ] Create email templates for common scenarios
- [ ] Document emergency procedures in Notion
- [ ] Set up monitoring alerts (Make.com, Anthropic)
- [ ] Create customer onboarding checklist (copy to Notion)
- [ ] Schedule monthly and quarterly reviews in calendar

---

**Document Status:** Production Ready  
**Next Review Date:** August 2026  
**Owner:** Founder/Operations
