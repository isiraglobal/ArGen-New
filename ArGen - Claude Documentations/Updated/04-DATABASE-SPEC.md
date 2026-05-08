# ArGen Database & Data Model — Complete Specification

**Version:** 1.0  
**Last Updated:** May 2026  
**Platform:** Airtable (Primary), Google Sheets (Backup)

---

## 1. DATABASE PLATFORM SELECTION

### Primary: Airtable

**Why Airtable:**
- No-code database with powerful automation
- Native API for integrations
- 1,200 records free (sufficient for first 200 customers)
- Rich field types (long text, attachments, formulas, rollups)
- Built-in views and filters
- Webhook support
- Collaboration features
- Mobile app for on-the-go access

**Limitations:**
- 1,200 record limit on free tier (upgrade at $20/user/month needed at scale)
- Rate limits: 5 requests/second per base
- Not ideal for real-time analytics (acceptable for ArGen use case)

**Cost Projections:**

| Records | Users Needed | Monthly Cost |
|---------|--------------|--------------|
| 0-1,200 | 1 | $0 |
| 1,200-50,000 | 2 | $40 |
| 50,000+ | 3 | $60 |

---

### Backup: Google Sheets

**Use Cases:**
- Client-facing reports (exportable)
- Quick data analysis
- Temporary staging before Airtable import
- Failover if Airtable API is down

**Not Used For:**
- Primary database (no proper relational structure)
- Automation trigger source
- Long-term storage

---

## 2. DATABASE ARCHITECTURE

### Base Structure

**ArGen operates across 2 Airtable bases:**

1. **Operations Base** (Internal)
   - Companies Table
   - Evaluation Batches Table
   - Participants Table
   - Submissions Table
   - Scores Table
   - Challenges Library Table

2. **Benchmark Base** (Aggregate Data)
   - Industry Benchmarks Table
   - Role Benchmarks Table
   - Quarterly Trends Table

---

## 3. TABLE SCHEMAS

### 3.1 COMPANIES TABLE

**Purpose:** Track all client companies using ArGen

**Fields:**

| Field Name | Field Type | Description | Required | Example |
|------------|------------|-------------|----------|---------|
| Company ID | Auto-number | Unique identifier | Yes | COMP-0001 |
| Company Name | Single line text | Legal company name | Yes | Acme Corporation |
| Industry | Single select | Primary industry | Yes | SaaS, Finance, Healthcare, etc. |
| Company Size | Single select | Employee count bracket | Yes | 10-50, 51-200, 201-500, 501+ |
| Country | Single select | Headquarters location | Yes | India, USA, Singapore, etc. |
| Account Status | Single select | Current relationship | Yes | Active, Churned, Paused |
| Primary Contact Name | Single line text | Main decision maker | Yes | Jane Doe |
| Primary Contact Email | Email | Main contact email | Yes | jane@acme.com |
| Primary Contact Phone | Phone number | Contact number | No | +91-9876543210 |
| Plan Type | Single select | Pricing tier | Yes | Free Pilot, Team Snapshot, Team Intelligence |
| Contract Start Date | Date | When they became customer | Yes | 2026-05-01 |
| Contract End Date | Date | Renewal or end date | No | 2027-05-01 |
| MRR | Currency | Monthly recurring revenue | No | $299 |
| Total Evaluations | Rollup | Count of all evaluations run | Auto | 3 |
| Last Evaluation Date | Rollup | Most recent evaluation | Auto | 2026-04-15 |
| NPS Score | Number | Net Promoter Score | No | 9 |
| Notes | Long text | Internal notes | No | "Interested in API access" |
| Created At | Created time | Auto-timestamp | Auto | 2026-05-06T10:00:00Z |

**Views:**
- Active Customers (Status = Active)
- Churned (Status = Churned)
- Up for Renewal (Contract End Date within 30 days)
- High Value (MRR > $500)

---

### 3.2 EVALUATION BATCHES TABLE

**Purpose:** Track each evaluation cycle for a company

**Fields:**

| Field Name | Field Type | Description | Required | Example |
|------------|------------|-------------|----------|---------|
| Batch ID | Formula | Auto-generated unique ID | Auto | EVAL-COMP0001-001 |
| Company | Link to Companies | Which company is this for | Yes | Acme Corporation |
| Batch Name | Single line text | Descriptive name | Yes | Acme Q2 2026 Evaluation |
| Evaluation Date | Date | When evaluation started | Yes | 2026-05-06 |
| Number of Participants | Number | How many people evaluated | Yes | 25 |
| Participants | Link to Participants | All participants in batch | Auto | [Links] |
| Status | Single select | Current state | Yes | Scheduled, In Progress, Scoring, Complete, Delivered |
| Challenge Set Used | Multiple select | Which challenges used | Yes | C001, C009, C017, C025, C033 |
| Expected Completion Date | Date | When all responses due | Yes | 2026-05-13 |
| Actual Completion Date | Date | When last response received | No | 2026-05-12 |
| Report Delivered Date | Date | When report sent to client | No | 2026-05-15 |
| Average Team Score | Rollup | Mean of all participant totals | Auto | 67.4 |
| Team Clarity Avg | Rollup | Average clarity score | Auto | 18.2 |
| Team Constraint Avg | Rollup | Average constraint score | Auto | 16.8 |
| Team Specificity Avg | Rollup | Average specificity score | Auto | 15.1 |
| Team Iteration Avg | Rollup | Average iteration score | Auto | 17.3 |
| Report PDF URL | Attachment | Final report file | No | [PDF link] |
| Invoiced | Checkbox | Payment processed | Yes | ✓ |
| Revenue | Currency | Amount charged | Yes | $299 |
| Created At | Created time | Auto-timestamp | Auto | 2026-05-01T09:00:00Z |

**Views:**
- In Progress (Status = In Progress or Scoring)
- Awaiting Report Delivery (Status = Complete, Report Delivered Date is blank)
- Completed This Month
- Revenue by Month

---

### 3.3 PARTICIPANTS TABLE

**Purpose:** Individual employees being evaluated

**Fields:**

| Field Name | Field Type | Description | Required | Example |
|------------|------------|-------------|----------|---------|
| Participant ID | Auto-number | Unique identifier | Auto | PART-00001 |
| Full Name | Single line text | Participant name | Yes | John Smith |
| Email | Email | Contact email | Yes | john@acme.com |
| Company | Link to Companies | Employer | Yes | Acme Corporation |
| Evaluation Batch | Link to Evaluation Batches | Which eval cycle | Yes | EVAL-COMP0001-001 |
| Job Role | Single select | Position level | Yes | Executive, Manager, IC, Other |
| Department | Single select | Functional area | Yes | Sales, Marketing, Product, Eng, Ops |
| Years of Experience | Number | Total work experience | No | 7 |
| Prior AI Tool Experience | Single select | Familiarity level | No | None, Basic, Intermediate, Advanced |
| Evaluation Link Sent | Checkbox | Has link been sent | Auto | ✓ |
| Link Sent Date | Date | When link sent | Auto | 2026-05-06 |
| Submission Status | Single select | Completion state | Auto | Not Started, In Progress, Submitted |
| Submission Date | Date | When they submitted | Auto | 2026-05-08 |
| Time to Complete (min) | Number | Minutes from start to submit | Auto | 42 |
| Submissions | Link to Submissions | Their 5 challenge responses | Auto | [Links] |
| Total Score | Rollup | Sum of all 5 challenges | Auto | 342 |
| Average Score | Formula | Total / 5 | Auto | 68.4 |
| Clarity Avg | Rollup | Average across 5 challenges | Auto | 17.2 |
| Constraint Avg | Rollup | Average across 5 challenges | Auto | 16.8 |
| Specificity Avg | Rollup | Average across 5 challenges | Auto | 16.1 |
| Iteration Avg | Rollup | Average across 5 challenges | Auto | 18.3 |
| Percentile Rank | Formula | Within their company batch | Auto | 72nd percentile |
| Report Sent | Checkbox | Individual report delivered | No | ✓ |
| Notes | Long text | Internal observations | No | "Asked thoughtful questions" |
| Created At | Created time | Auto-timestamp | Auto | 2026-05-06T10:15:00Z |

**Views:**
- Pending Submissions (Submission Status ≠ Submitted)
- Completed Submissions
- High Performers (Average Score > 75)
- Need Improvement (Average Score < 50)
- By Department
- By Role

---

### 3.4 SUBMISSIONS TABLE

**Purpose:** Individual challenge responses and their scores

**Fields:**

| Field Name | Field Type | Description | Required | Example |
|------------|------------|-------------|----------|---------|
| Submission ID | Auto-number | Unique identifier | Auto | SUB-000001 |
| Participant | Link to Participants | Who submitted | Yes | John Smith |
| Company | Lookup from Participant | Auto-populated | Auto | Acme Corporation |
| Evaluation Batch | Lookup from Participant | Auto-populated | Auto | EVAL-COMP0001-001 |
| Challenge ID | Link to Challenges Library | Which challenge | Yes | C001 |
| Challenge Type | Lookup from Challenge | Auto-populated | Auto | Strategy |
| Response Text | Long text | User's actual response | Yes | [500-1000 words] |
| Word Count | Formula | Count words in response | Auto | 287 |
| Process Notes | Long text | Optional user notes | No | "Used Claude Sonnet" |
| Submitted At | Date & time | Submission timestamp | Yes | 2026-05-08T14:32:00Z |
| Scoring Status | Single select | Scoring state | Auto | Pending, Scored, Manual Review, Error |
| Clarity Score | Number | 0-25 | Auto | 18 |
| Constraint Score | Number | 0-25 | Auto | 22 |
| Specificity Score | Number | 0-25 | Auto | 16 |
| Iteration Score | Number | 0-25 | Auto | 19 |
| Total Score | Formula | Sum of 4 dimensions | Auto | 75 |
| AI Justification | Long text | Scoring rationale | Auto | "Response demonstrates..." |
| AI Improvement | Long text | Suggested improvements | Auto | "Include specific metrics..." |
| Manual Review Flag | Checkbox | Needs human check | No | ✓ |
| Manual Review Notes | Long text | Human reviewer notes | No | "Score seems too high" |
| Model Used | Single line text | Which AI model scored | Auto | claude-sonnet-4-20250514 |
| API Cost | Currency | Cost of scoring call | Auto | $0.009 |
| Created At | Created time | Auto-timestamp | Auto | 2026-05-08T14:32:00Z |

**Views:**
- Pending Scoring (Scoring Status = Pending)
- Needs Manual Review (Manual Review Flag = checked)
- High Scores (Total Score > 85)
- Low Scores (Total Score < 40)
- By Challenge Type
- By Company
- Scoring Errors (Scoring Status = Error)

---

### 3.5 CHALLENGES LIBRARY TABLE

**Purpose:** Master repository of all evaluation challenges

**Fields:**

| Field Name | Field Type | Description | Required | Example |
|------------|------------|-------------|----------|---------|
| Challenge ID | Single line text | Unique identifier | Yes | C001 |
| Challenge Name | Single line text | Descriptive title | Yes | GTM Strategy - Remote PM Tool |
| Challenge Type | Single select | Category | Yes | Strategy, Data, Communication, Research, Iteration |
| Difficulty Level | Single select | Complexity | Yes | Beginner, Intermediate, Advanced |
| Industry Focus | Single select | Sector relevance | Yes | Generic, Tech, Finance, Healthcare, Retail |
| Challenge Text | Long text | Full challenge prompt | Yes | [See Challenge Delivery App doc] |
| Word Limit | Number | Max response length | Yes | 300 |
| Time Estimate (min) | Number | Suggested duration | Yes | 15 |
| Primary Dimension | Single select | Main evaluation focus | Yes | Clarity, Constraint, Specificity, Iteration |
| Secondary Dimension | Single select | Secondary focus | No | Same options |
| Active | Checkbox | Currently in rotation | Yes | ✓ |
| Times Used | Rollup | Usage count | Auto | 47 |
| Average Score | Rollup | Mean score across all uses | Auto | 64.2 |
| Last Used Date | Rollup | Most recent usage | Auto | 2026-05-01 |
| Created By | Single line text | Author | Yes | Founder |
| Created At | Created time | Auto-timestamp | Auto | 2026-03-15T10:00:00Z |

**Views:**
- Active Challenges (Active = checked)
- By Challenge Type
- By Difficulty
- Overused (Times Used > 100)
- Never Used (Times Used = 0)
- High Performing (Average Score > 70)

---

### 3.6 SCORES TABLE (Aggregate/Derived)

**Purpose:** Rollup table for reporting and benchmarking

**Note:** This is a view/rollup table, not primary data storage

**Fields:**

| Field Name | Source | Description |
|------------|--------|-------------|
| Score ID | Auto | Unique identifier |
| Company | Link | Company reference |
| Evaluation Batch | Link | Batch reference |
| Participant | Link | Individual reference |
| Total Score | Rollup | From Submissions |
| Clarity Avg | Rollup | From Submissions |
| Constraint Avg | Rollup | From Submissions |
| Specificity Avg | Rollup | From Submissions |
| Iteration Avg | Rollup | From Submissions |
| Job Role | Lookup | From Participant |
| Department | Lookup | From Participant |
| Industry | Lookup | From Company |
| Company Size | Lookup | From Company |
| Evaluation Date | Lookup | From Evaluation Batch |

**Purpose:** Enable cross-company benchmarking queries without exposing raw data

---

## 4. BENCHMARK BASE (SEPARATE)

### 4.1 INDUSTRY BENCHMARKS TABLE

**Purpose:** Aggregate performance data by industry

**Fields:**

| Field Name | Type | Description |
|------------|------|-------------|
| Benchmark ID | Auto | Unique identifier |
| Industry | Single select | Industry category |
| Time Period | Single line text | Quarter/Year (e.g., Q2-2026) |
| Sample Size | Number | Number of companies included |
| Participant Count | Number | Total individuals evaluated |
| Median Score | Number | 50th percentile |
| P25 Score | Number | 25th percentile |
| P75 Score | Number | 75th percentile |
| P90 Score | Number | 90th percentile (top performers) |
| Median Clarity | Number | Industry median clarity |
| Median Constraint | Number | Industry median constraint |
| Median Specificity | Number | Industry median specificity |
| Median Iteration | Number | Industry median iteration |
| Top Company (anonymized) | Single line text | Highest performer (ID only) |
| Last Updated | Last modified time | Auto-timestamp |

---

### 4.2 ROLE BENCHMARKS TABLE

**Purpose:** Performance data by job role across industries

**Fields:**

| Field Name | Type | Description |
|------------|------|-------------|
| Benchmark ID | Auto | Unique identifier |
| Job Role | Single select | Executive, Manager, IC |
| Time Period | Single line text | Quarter/Year |
| Sample Size | Number | Number of individuals |
| Median Score | Number | 50th percentile |
| P25 Score | Number | 25th percentile |
| P75 Score | Number | 75th percentile |
| Best Dimension | Single line text | Strongest area for this role |
| Weakest Dimension | Single line text | Improvement opportunity |
| Last Updated | Last modified time | Auto-timestamp |

---

## 5. RELATIONSHIPS & LINKS

### Entity Relationship Diagram

```
COMPANIES (1) ←→ (Many) EVALUATION BATCHES
    ↓
    └→ (Many) PARTICIPANTS
            ↓
            └→ (Many) SUBMISSIONS
                    ↓
                    └→ (1) CHALLENGES LIBRARY
```

### Key Relationships

1. **Company → Evaluation Batches:** One-to-Many
   - One company can have multiple evaluation cycles
   - Each batch belongs to exactly one company

2. **Evaluation Batch → Participants:** One-to-Many
   - One batch includes multiple participants
   - Each participant can be in multiple batches (over time)

3. **Participant → Submissions:** One-to-Many
   - One participant submits 5 responses (one per challenge)
   - Each submission belongs to exactly one participant

4. **Challenge Library → Submissions:** One-to-Many
   - One challenge can be used by many participants
   - Each submission references exactly one challenge

---

## 6. DATA RETENTION POLICY

### Storage Duration

| Data Type | Retention Period | Reason |
|-----------|------------------|--------|
| Raw submissions text | 90 days | Privacy compliance, reduce storage |
| Scores + anonymized justifications | Indefinite | Benchmark data, product IP |
| Participant PII (name, email) | 2 years or until deletion request | Legal requirement |
| Company information | Indefinite (while customer) | Business relationship |
| API logs | 30 days | Debugging only |
| Webhook payloads | 7 days | Troubleshooting only |

### Archival Process

**Quarterly Archive (Automated):**
```python
# Pseudocode
submissions_older_than_90_days = Submissions.filter(created_at < 90_days_ago)

for submission in submissions_older_than_90_days:
    # Export to cold storage (Google Cloud Storage)
    archive_to_gcs(submission)
    
    # Delete raw text, keep scores
    submission.response_text = "[ARCHIVED]"
    submission.process_notes = "[ARCHIVED]"
    submission.save()
```

---

## 7. DATA SECURITY

### Access Control

**Airtable Permissions:**
- Founder: Creator (full access)
- Future hires: Editor (cannot delete bases)
- Clients: Never given direct access

**API Keys:**
- Stored in environment variables
- Rotated every 90 days
- Separate keys for dev/staging/prod

### Encryption

**At Rest:**
- Airtable handles encryption automatically (AES-256)
- Attachments (PDFs) encrypted in Airtable storage

**In Transit:**
- All API calls over HTTPS/TLS 1.3
- Webhook payloads encrypted

### Compliance

**GDPR Requirements:**
- Right to access: Export Airtable data via API
- Right to deletion: Delete all linked records
- Right to portability: Provide CSV export
- Data processing agreement: Airtable provides DPA

**SOC 2 (Future):**
- Audit logs enabled
- Access reviews quarterly
- Incident response plan documented

---

## 8. BACKUP STRATEGY

### Automated Backups

**Daily:**
- Full base export via Airtable API
- Stored in Google Cloud Storage (3 versions retained)
- Automated at 2:00 AM UTC

**Weekly:**
- Manual verification of backup integrity
- Test restore from backup

**Monthly:**
- Download backup to local encrypted storage
- Archive previous month's backup

### Disaster Recovery

**RTO (Recovery Time Objective):** 4 hours
**RPO (Recovery Point Objective):** 24 hours (daily backup)

**Recovery Process:**
1. Create new Airtable base from template
2. Restore data from most recent backup
3. Reconnect automation webhooks
4. Verify data integrity
5. Resume operations

---

## 9. REPORTING QUERIES

### Common Reports (Views in Airtable)

**1. Monthly Revenue Report:**
- Group by: Evaluation Batches
- Filter: Report Delivered Date within last 30 days
- Sum: Revenue

**2. Average Scores by Industry:**
- Link to Benchmark Base
- Group by: Industry
- Average: Total Score, Clarity, Constraint, Specificity, Iteration

**3. Customer Health Dashboard:**
- Companies table
- Filter: Account Status = Active
- Show: Last Evaluation Date, Total Evaluations, NPS Score
- Flag: Red if Last Evaluation > 120 days

**4. Scoring Accuracy Audit:**
- Submissions table
- Filter: Manual Review Flag = checked
- Compare: AI scores vs. human reviewer adjustments
- Calculate: Variance

---

## 10. SCALING PLAN

### Growth Triggers

| Milestone | Action Required |
|-----------|-----------------|
| 1,000 records | Upgrade to Airtable Plus ($20/user/month) |
| 50,000 records | Migrate to PostgreSQL + Airtable frontend |
| 200,000 records | Full PostgreSQL migration, deprecate Airtable |

### Migration Path (When Needed)

**Airtable → PostgreSQL:**

**Trigger:** 50,000+ records or need for complex queries

**Process:**
1. Set up PostgreSQL database (AWS RDS or Supabase)
2. Design schema matching Airtable structure
3. Build ETL pipeline (Airtable API → PostgreSQL)
4. Run parallel systems for 30 days
5. Cutover to PostgreSQL as source of truth
6. Optionally keep Airtable as frontend (via API sync)

**Benefits:**
- Unlimited records
- Complex SQL queries
- Better performance
- Lower cost at scale

**Trade-offs:**
- Requires technical expertise
- More complex maintenance
- Lose Airtable's no-code interface

---

## 11. DATA QUALITY RULES

### Validation Rules

**Companies Table:**
- Company Name: Must be unique
- Primary Contact Email: Must be valid email format
- MRR: Cannot be negative

**Participants Table:**
- Email: Must be unique within Evaluation Batch
- Submission Status: Auto-updates based on Submissions linkage

**Submissions Table:**
- Total Score: Must equal sum of 4 dimensions
- Each dimension: Must be 0-25
- Response Text: Minimum 50 words (enforced at form level)

### Data Cleaning

**Monthly:**
- Check for duplicate participant emails
- Verify all Evaluation Batches have Report Delivered Date
- Flag submissions with anomalous scores (e.g., all 0s or all 25s)
- Review Manual Review flags

---

## 12. API INTEGRATION SPECIFICATIONS

### Airtable API Usage

**Base API Key:** Stored in environment variables

**Common Operations:**

**1. Create New Participant:**
```javascript
// POST to Participants table
{
  "fields": {
    "Full Name": "Jane Doe",
    "Email": "jane@company.com",
    "Company": ["recCompanyID"],
    "Evaluation Batch": ["recBatchID"],
    "Job Role": "Manager",
    "Department": "Marketing"
  }
}
```

**2. Update Submission with Scores:**
```javascript
// PATCH to Submissions table
{
  "fields": {
    "Scoring Status": "Scored",
    "Clarity Score": 18,
    "Constraint Score": 22,
    "Specificity Score": 16,
    "Iteration Score": 19,
    "AI Justification": "...",
    "AI Improvement": "...",
    "Model Used": "claude-sonnet-4-20250514",
    "API Cost": 0.009
  }
}
```

**3. Fetch Company Benchmarks:**
```javascript
// GET from Companies table with formula filter
filterByFormula: "AND({Account Status} = 'Active', {Industry} = 'SaaS')"
fields: ["Company Name", "Average Team Score", "Last Evaluation Date"]
```

---

## 13. COST ANALYSIS

### Airtable Costs

| Tier | Records | Users | Monthly Cost |
|------|---------|-------|--------------|
| Free | 0-1,200 | 1 | $0 |
| Plus | 1,200-50,000 | 2 | $40 ($20/user) |
| Pro | 50,000-125,000 | 3 | $60 ($20/user) |

**Projected Costs:**
- Year 1: $0 (stay on free tier)
- Year 2: $40/month (upgrade at 1,200 records)
- Year 3: $60/month or migrate to PostgreSQL

### Storage Costs (if migrating to PostgreSQL)

**AWS RDS PostgreSQL:**
- db.t3.micro: $15/month (dev/staging)
- db.t3.small: $30/month (production, <100K records)
- db.m5.large: $150/month (production, >500K records)

**Supabase (Alternative):**
- Free tier: 500MB database, 2GB bandwidth
- Pro tier: $25/month, 8GB database, 100GB bandwidth

---

## IMPLEMENTATION CHECKLIST

- [ ] Create Airtable account and Operations Base
- [ ] Build Companies table with all fields from schema
- [ ] Build Evaluation Batches table with rollup formulas
- [ ] Build Participants table with lookups configured
- [ ] Build Submissions table with scoring fields
- [ ] Build Challenges Library table and import 40+ challenges
- [ ] Set up table relationships (links between tables)
- [ ] Create all views specified in each table section
- [ ] Configure automated backup script (daily export)
- [ ] Test data flow: Form → Webhook → Airtable
- [ ] Document data retention and archival process
- [ ] Set up access control and API keys
- [ ] Create Benchmark Base (separate) with Industry/Role tables

---

**Document Status:** Production Ready  
**Next Review Date:** August 2026  
**Owner:** Data & Operations
