# ArGen System Architecture — Complete Overview

**Version:** 1.0  
**Last Updated:** May 2026  
**Owner:** Technical Architecture

---

## 1. HIGH-LEVEL SYSTEM DIAGRAM

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER JOURNEY                             │
└─────────────────────────────────────────────────────────────────┘

[Customer] → [ArGen Landing Page] → [Purchase/Pilot Signup]
                                              ↓
                                    [Founder Manual Setup]
                                              ↓
                            ┌─────────────────────────────┐
                            │   EVALUATION DELIVERY       │
                            └─────────────────────────────┘
                                              ↓
┌──────────────┐        ┌──────────────┐         ┌──────────────┐
│  Participant │   →    │  Tally Form  │    →    │   Webhook    │
│  Receives    │        │  (Challenges)│         │  Trigger to  │
│  Unique Link │        │              │         │  Make.com    │
└──────────────┘        └──────────────┘         └──────────────┘
                                                          ↓
                            ┌─────────────────────────────────────┐
                            │    AUTOMATION LAYER (Make.com)      │
                            └─────────────────────────────────────┘
                                              ↓
                    ┌──────────────┬──────────────┬──────────────┐
                    ↓              ↓              ↓              ↓
            [Parse Data]  [Create Records] [Loop 5x]    [Check Status]
                                  ↓              ↓              
                          ┌───────────┐  ┌───────────┐
                          │ Airtable  │  │ Anthropic │
                          │ Database  │  │ API Call  │
                          └───────────┘  └───────────┘
                                  ↓              ↓
                          [Store Metadata] [Get Scores]
                                  ↓              ↓
                          [Update Records with Scores]
                                              ↓
                            ┌─────────────────────────────┐
                            │   REPORT GENERATION         │
                            └─────────────────────────────┘
                                              ↓
                    ┌──────────────┬──────────────┬──────────────┐
                    ↓              ↓              ↓              ↓
            [Aggregate Data] [Google Slides] [Export PDF] [Email Delivery]
                                              ↓
                            ┌─────────────────────────────┐
                            │   CUSTOMER RECEIVES         │
                            │   ACTIONABLE REPORT         │
                            └─────────────────────────────┘
```

---

## 2. COMPONENT BREAKDOWN

### 2.1 Frontend Layer

**Landing Page (Carrd.co)**
- Purpose: Marketing, lead generation
- Features: Hero, social proof, pricing, CTA
- Hosting: Carrd servers
- Custom domain: argen.ai (DNS via Cloudflare)
- Cost: $0 (free tier)

**Challenge Delivery (Tally.so)**
- Purpose: Collect evaluation responses
- Features: 5-page form, progress bar, auto-save
- Hosting: Tally servers
- Integration: Webhook to Make.com
- Cost: $0 (free tier, unlimited submissions)

---

### 2.2 Data Layer

**Primary Database (Airtable)**
- Tables: Companies, Evaluation Batches, Participants, Submissions, Challenges Library
- Storage: ~50 records per customer (1 company + 1 batch + N participants + N×5 submissions)
- Access: Web UI, Mobile app, REST API
- Backup: Daily automated export to Google Cloud Storage
- Cost: $0 until 1,200 records

**Benchmark Database (Airtable - Separate Base)**
- Tables: Industry Benchmarks, Role Benchmarks, Quarterly Trends
- Purpose: Aggregate performance data across companies
- Privacy: All data anonymized (no company names, participant names)
- Cost: $0 (minimal records)

---

### 2.3 Automation Layer

**Orchestration Engine (Make.com)**
- Scenarios:
  1. Core Evaluation Workflow (triggered by Tally webhook)
  2. Report Generation & Delivery (triggered by batch completion)
  3. Weekly Reminders & Digest (scheduled)
- Operations: ~23 ops per evaluation
- Free tier: 1,000 ops/month (sufficient for 40 evaluations)
- Cost: $0-$16/month depending on volume

**Alternative (Future): n8n (Self-Hosted)**
- Trigger: When Make.com costs >$50/month
- Hosting: Railway or Render free tier
- Benefit: Unlimited operations
- Trade-off: Technical maintenance required

---

### 2.4 AI/ML Layer

**Scoring Engine (Anthropic Claude API)**
- Model: claude-sonnet-4-20250514
- Function: Evaluate responses, return structured scores
- Input: System prompt (rubric) + challenge text + user response
- Output: JSON with scores + justification + improvement
- Cost: ~$0.01 per evaluation (5 API calls)
- Reliability: 99.5%+ uptime (Anthropic SLA)

**Fallback (OpenAI GPT-4o-mini)**
- Used when: Cost optimization needed (>5,000 evals/month)
- Cost: ~60% cheaper than Claude
- Trade-off: Slightly less consistent scoring

---

### 2.5 Communication Layer

**Email Delivery (Gmail)**
- Accounts:
  - support@argen.ai (customer support)
  - evaluations@argen.ai (automated notifications)
- Integration: Make.com → Gmail API
- Templates:
  - Evaluation link delivery
  - Submission confirmation
  - Report delivery
  - Reminders
- Cost: $0 (standard Gmail)

**Alternative (Future): ConvertKit**
- Use case: Drip campaigns, newsletter
- Trigger: >100 email subscribers
- Cost: $0 until 10,000 subscribers

---

### 2.6 Report Generation Layer

**Phase 1: Manual (Google Slides)**
- Template: 12-page master template
- Process:
  1. Clone template per customer
  2. Fill {{placeholders}} with Airtable data
  3. Generate charts in Google Sheets
  4. Export as PDF
- Time: 45-60 min per report
- Cost: $0

**Phase 2: Automated (Documint)**
- Trigger: After 25+ manual reports delivered
- Process:
  1. Make.com sends data payload to Documint API
  2. Documint fills template and generates PDF
  3. Returns download URL
  4. Make.com uploads to Airtable and emails customer
- Time: 2 min per report
- Cost: $0.10 per report

---

### 2.7 Payment Layer

**Payment Processing (Stripe)**
- Integration: Manual invoice generation via Stripe Dashboard
- Payment methods: Credit card, bank transfer (for larger deals)
- Fees: 2.9% + $0.30 per transaction
- Currency: USD (for global customers), INR (for India)
- Cost: $0 monthly fee, only per-transaction fees

**Alternative (India): Razorpay**
- Use case: India-specific customers preferring INR
- Fees: 2% (slightly lower than Stripe for domestic)
- Integration: Same as Stripe

---

### 2.8 CRM & Pipeline

**Customer Relationship Management (Notion)**
- Database: Companies, Leads, Opportunities
- Stages: Lead → Qualified → Pilot → Customer → Churned
- Views: Pipeline, Follow-ups Due, Active Customers
- Integration: Manual entry (no automation yet)
- Cost: $0 (free for individual use)

**Alternative (Future): HubSpot CRM**
- Trigger: When >50 active customers (need better pipeline visibility)
- Cost: $0 (HubSpot free tier)

---

## 3. DATA FLOW

### 3.1 Evaluation Submission Flow

```
Step 1: Form Submission
Participant → Tally Form → POST to Make.com Webhook
Data: {name, email, company, role, dept, 5 responses, timestamp}

Step 2: Data Parsing & Storage
Make.com → Parse JSON → Airtable API
Creates:
  - 1 Participant record
  - 5 Submission records (linked to participant)

Step 3: Scoring Loop (5 iterations)
For each submission:
  Make.com → Fetch challenge text from Airtable
           → Call Anthropic API with (rubric + challenge + response)
           → Parse JSON response (scores + justification)
           → Update Submission record in Airtable

Step 4: Completion Check
Make.com → Query Airtable: All participants submitted?
If yes → Trigger Report Generation
If no → Wait for more submissions

Step 5: Confirmation
Make.com → Gmail API → Send confirmation to participant
Email: "Evaluation complete, report coming in 48h"
```

---

### 3.2 Report Generation Flow

```
Step 1: Batch Completion Trigger
Make.com → Detects all participants submitted
         → Webhook to Report Generation scenario

Step 2: Data Aggregation
Make.com → Airtable API: Fetch all participant scores
         → Calculate team averages, distribution, percentiles

Step 3: Benchmark Lookup
Make.com → Airtable Benchmark Base
         → Fetch industry medians for comparison

Step 4: Report Building
Phase 1 (Manual):
  Founder → Clone Google Slides template
          → Fill data manually
          → Export PDF

Phase 2 (Automated):
  Make.com → Documint API with data payload
           → Receive PDF download URL

Step 5: Delivery
Make.com → Upload PDF to Airtable (Evaluation Batches table)
         → Gmail API: Send report to client
         → Gmail API: Send individual reports to each participant
```

---

## 4. SYSTEM DEPENDENCIES

### Critical Dependencies (System fails without these)

| Dependency | Failure Impact | Mitigation |
|------------|----------------|------------|
| Tally.so | Cannot collect responses | Fallback: Google Forms (24h switch) |
| Anthropic API | Cannot score evaluations | Fallback: OpenAI API (1h switch) |
| Make.com | No automation | Manual workaround: Python scripts (4h setup) |
| Airtable | Cannot store/access data | Daily backups → restore to Google Sheets (8h) |

### Non-Critical Dependencies (Degraded but functional)

| Dependency | Failure Impact | Workaround |
|------------|----------------|------------|
| Gmail | Cannot auto-send emails | Manual email from personal account |
| Carrd.co | Landing page down | Share Google Doc with pitch |
| Documint | Report generation slower | Revert to manual Google Slides |
| Stripe | Cannot process payments | Request bank transfer |

---

## 5. SECURITY ARCHITECTURE

### Authentication & Authorization

**API Keys (Stored Securely):**
- Anthropic API: Environment variable in Make.com
- Airtable API: OAuth tokens, auto-refresh
- Tally Webhook: Signature verification
- Gmail: OAuth 2.0, scoped permissions

**Access Control:**
- Airtable: Creator (founder only)
- Make.com: Creator (founder only)
- Google Drive: Owner (founder), view access for customers on their reports
- Stripe: Admin (founder only)

**Data Privacy:**
- PII encryption: At rest (Airtable handles), in transit (HTTPS)
- API calls: Do NOT include participant names/emails (only response text)
- Reports: Anonymized option available for sensitive companies

---

### Compliance

**GDPR (if serving EU customers):**
- Right to access: Export Airtable data via API → CSV
- Right to deletion: Delete all linked records in Airtable
- Right to portability: Provide CSV export
- Data retention: 90 days for raw submissions, 2 years for scores
- Legal basis: Contract performance

**SOC 2 (Future):**
- Trigger: When selling to enterprise (>500 employees)
- Requirements:
  - Audit logs (Airtable provides)
  - Access reviews (quarterly)
  - Incident response plan (document in Notion)
  - Vendor security assessments (Anthropic, Airtable provide SOC 2 reports)

---

## 6. MONITORING & OBSERVABILITY

### System Health Monitoring

**Make.com Execution Monitoring:**
- Check: Daily execution history
- Alert: Email if error rate >5%
- Metrics: Success rate, avg execution time, operations used

**API Monitoring:**
- Anthropic Console: Token usage, spend, rate limits
- Alert: Email if daily spend >$20
- Alert: Email if error rate >2%

**Database Monitoring:**
- Airtable: Record count (approaching free tier limit?)
- Backup: Daily export success/failure
- Sync: Make.com ↔ Airtable connection health

**Application Monitoring:**
- Tally: Form submission rate (are links working?)
- Gmail: Delivery rate (emails not bouncing?)
- Stripe: Payment success rate

---

### Alerting System

**Email Alerts (Sent to founder@argen.ai):**
- Critical: API key expired, Make.com scenario failure, payment processor down
- Warning: Approaching free tier limits, unusual API spend, customer complaint
- Info: Weekly digest, monthly revenue summary, quarterly review reminder

**Dashboard (Notion):**
- Weekly metrics: Outreach, conversions, evaluations, revenue
- Monthly trends: Customer count, MRR, churn rate
- Quarterly goals: Progress vs. targets

---

## 7. DISASTER RECOVERY

### Backup Strategy

**Data Backups:**
- Frequency: Daily (automated)
- Destination: Google Cloud Storage (encrypted)
- Retention: 30 daily, 12 monthly, 3 yearly
- Test: Monthly restore drill

**Configuration Backups:**
- Make.com scenarios: JSON export monthly
- Tally forms: Clone templates stored in Google Drive
- Airtable schemas: Document in Git repository
- Google Slides templates: Version controlled in Drive

---

### Recovery Procedures

**Scenario 1: Airtable Unavailable**
- RTO: 8 hours
- Process:
  1. Restore latest backup to Google Sheets
  2. Update Make.com integrations to point to Sheets API
  3. Continue operations in degraded mode
  4. Migrate back when Airtable restored

**Scenario 2: Make.com Unavailable**
- RTO: 4 hours
- Process:
  1. Deploy Python scripts for critical workflows
  2. Manual scoring via Anthropic Console (Workbench)
  3. Manual email sends
  4. Resume automation when Make.com restored

**Scenario 3: Anthropic API Unavailable**
- RTO: 1 hour
- Process:
  1. Switch Make.com scenario to OpenAI API
  2. Test scoring consistency on 10 samples
  3. Continue operations
  4. Switch back when Anthropic restored

---

## 8. SCALABILITY PLAN

### Current Capacity

**System Limits (Free Tier):**
- Airtable: 1,200 records = ~200 customers
- Make.com: 1,000 ops/month = ~40 evaluations/month
- Tally: Unlimited submissions
- Anthropic API: No hard limit (pay-as-you-go)

**Bottlenecks:**
1. Report generation (manual, 60 min each)
2. Make.com operations (free tier)
3. Airtable records (free tier)

---

### Scaling Triggers & Actions

| Milestone | Bottleneck | Action | Cost Impact |
|-----------|------------|--------|-------------|
| 40 evals/month | Make.com ops | Upgrade to Core plan | +$9/month |
| 100 evals/month | Report generation | Automate with Documint | +$10/month |
| 200 customers | Airtable records | Upgrade to Plus | +$20/month |
| 500 evals/month | API cost | Switch to GPT-4o-mini | -40% cost |
| 1,000 customers | Airtable + Make.com | Migrate to PostgreSQL + n8n | +$50/month |

**Total Monthly Cost at Scale:**
- 0-40 evals: $0
- 100 evals: $30
- 500 evals: $100
- 1,000+ evals: Custom infrastructure ($200-500/month)

---

## 9. TECHNICAL DEBT REGISTER

### Current Known Issues (Non-Blocking)

1. **Manual report generation**
   - Impact: Founder time (60 min per report)
   - Fix: Automate with Documint (Phase 2)
   - Priority: Medium (after 25 reports)

2. **No automated testing**
   - Impact: Bugs caught in production
   - Fix: Build test suite for scoring agent
   - Priority: Low (stable for now)

3. **Single point of failure (founder)**
   - Impact: Business stops if founder unavailable
   - Fix: Document all processes, hire contractor
   - Priority: Medium (after $5K MRR)

4. **No version control for Make.com scenarios**
   - Impact: Hard to rollback changes
   - Fix: Export JSON monthly, store in Git
   - Priority: Low (monthly manual export sufficient)

---

## 10. FUTURE ARCHITECTURE (Year 2+)

### When to Rebuild

**Trigger:** >1,000 evaluations/month OR enterprise sales (>500 employees)

**Migration Path:**
```
Current: No-code stack (Tally → Make.com → Airtable → Manual reports)
         ↓
Phase 1: Hybrid (Keep Tally, automate reports with Documint)
         ↓
Phase 2: PostgreSQL database, n8n automation (self-hosted)
         ↓
Phase 3: Custom web app (Next.js frontend, FastAPI backend, PostgreSQL)
         ↓
Future:  SaaS platform with self-serve signup, real-time dashboards
```

**When NOT to Rebuild:**
- Current stack handles load fine
- Costs are acceptable (<10% of revenue)
- No enterprise customer demanding it

**Premature Optimization is the Enemy:**
- Build custom infrastructure only when current stack breaks
- Optimize for speed to market, not technical elegance
- Solo founder bandwidth is the real bottleneck, not tech

---

## IMPLEMENTATION CHECKLIST

- [ ] Set up all accounts (Tally, Airtable, Make.com, Anthropic, Stripe)
- [ ] Configure integrations (webhooks, API keys, OAuth)
- [ ] Build database schema in Airtable
- [ ] Create Make.com scenarios (3 total)
- [ ] Design Google Slides report template
- [ ] Test end-to-end flow with dummy data
- [ ] Set up monitoring and alerts
- [ ] Document all logins and credentials (1Password)
- [ ] Create daily/weekly operational checklists
- [ ] Schedule quarterly architecture review

---

**Document Status:** Production Ready  
**Last Tested:** May 2026  
**Next Review Date:** August 2026  
**Owner:** Technical Architecture
