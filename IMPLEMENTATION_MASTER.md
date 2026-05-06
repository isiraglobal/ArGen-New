# 🎯 ArGen Implementation Master Checklist

**Last Updated:** 2026-05-06  
**Status:** Phase 1 Complete (8/8) | Phase 2 Pending | Phase 3 Pending | Phase 4 Pending  
**Source:** docs/implement.txt consolidated into single working checklist  
**Token Budget:** ~43,400 total | Current: ~7,700 used

---

## 📌 QUICK STATUS

| Phase | Status | Progress | Est. Tokens | Used | ETA |
|-------|-------|--------|-----------|------|-----|
| **Phase 1: Essential** | 8 pages | ✅ DONE | 13,600 | ~3,200 | COMPLETE |
| **Phase 2: Secondary** | 4 pages | ✅ DONE | 12,500 | ~4,500 | COMPLETE |
| **Phase 3: Legal** | 2 pages | ✅ DONE | 3,800 | ~1,500 | COMPLETE |
| **Phase 4: Backend** | 5 systems | 🚧 NEXT | 13,500 | ~4,500 | Month 2 |

---

# 🚀 PHASE 1: ESSENTIAL PAGES (WEEK 1-2) ✅ COMPLETE

**Goal:** Convert visitor → free pilot signup. Launch live with these 8 pages.

## Pages to Build (Status)

### ✅ 1. HOME PAGE (`/`)
- **Purpose:** Convert visitor → free pilot signup
- **Status:** COMPLETED
- **Hero Section:**
  - [x] Headline: "Is Your Team Actually Using AI — Or Just Going Through Motions?"
  - [x] Subheadline: "ArGen measures real AI output quality across team in 48 hours. No courses. Just scores + report leadership acts on."
  - [x] Primary CTA: "Run Free Pilot (5 People)" → `/evaluate`
  - [x] Secondary CTA: "Book Demo"
- **Content Sections:**
  - [x] "How It Works" (3-step visual): Challenges → Scores → Report
  - [x] Social Proof: "X teams evaluated | Y companies | Z datapoints"
  - [x] Challenge Examples (locked state with preview)
  - [x] Scoring Rubric (4 dimensions × 25pts)
  - [x] Pricing Table (preview)
  - [x] FAQ (6 questions)
- **Design:**
  - [x] Terminal/neo-brutalist aesthetic
  - [x] Responsive mobile/tablet/desktop
  - [x] Custom cursor effects
  - [x] Animations (boot sequence, particle grid, smooth scroll)
  - [x] Color system: Blue, Cream, Green, Purple, Cyan

---

### ✅ 2. EVALUATE PAGE (`/evaluate`)
- **Purpose:** Pilot signup form (zero payment, pure lead capture)
- **Status:** COMPLETED
- **Form Fields:**
  - [x] Name
  - [x] Email
  - [x] Company
  - [x] Team Size
  - [x] Role
  - [x] AI Tools Currently Used
- **Content:**
  - [x] Form validation (email, required fields)
  - [x] Success message: "We'll send challenge link within 24hr"
  - [x] "What happens next" timeline
  - [x] Trust signals: "No credit card. 5-person limit."
  - [x] Back-to-home link
- **Technical:**
  - [x] Form submission handler (Tally integration)
  - [x] Mobile responsive
  - [x] Linked from home page CTA

---

### ✅ 3. PRICING PAGE (`/pricing`)
- **Purpose:** Show tiers, drive decision
- **Status:** COMPLETED
- **Tiers (4 total):**
  - [x] Free Pilot: 5 people, one-time, $0
  - [x] Team Snapshot: 25 people, one-time, ₹24,999
  - [x] Team Intelligence: ₹12,999/mo, quarterly tracking, *"Coming Q3 2025"* badge
  - [x] Enterprise: Custom pricing, contact sales
- **Features Per Tier:**
  - [x] Feature checklists
  - [x] CTAs: "Start Free Pilot", "Buy Now", "Contact Sales"
  - [x] Badge on recommended tier (Team Snapshot)
- **Additional Content:**
  - [x] FAQ section (5-7 questions)
  - [x] Responsive card layout
  - [x] Comparison table (optional)

---

### ✅ 4. CHALLENGES PAGE (`/challenges`)
- **Purpose:** Challenge library (locked until customer)
- **Status:** COMPLETED
- **Content:**
  - [x] Challenge grid (3-4 columns, responsive)
  - [x] 5-8 sample challenge types
  - [x] Locked/unlocked card states
  - [x] Lock icon + "Customer Only" overlay
  - [x] Description: "These are real challenges your team receives"
  - [x] View-only snippets of challenge examples
  - [x] Link to pricing page for upgrade
  - [x] CTA: "Unlock with pilot"

---

### ✅ 5. ABOUT PAGE (`/about`)
- **Purpose:** Founder story + credibility
- **Status:** COMPLETED
- **Content:**
  - [x] Founder story (why ArGen exists)
  - [x] Problem statement: "Companies deploy AI, can't measure it"
  - [x] Vision statement: "Building AI Performance Intelligence standard"
  - [x] Your background/credentials
  - [x] "Why We Built This" narrative
  - [x] Links to blog & social media

---

### ✅ 6. CONTACT PAGE (`/contact`)
- **Purpose:** Sales conversations
- **Status:** COMPLETED
- **Content:**
  - [x] Contact form (Name, Email, Message, Subject)
  - [x] Calendly embed for demo booking
  - [x] Email contact
  - [x] LinkedIn link
  - [x] "Have questions? Book 15min call"
  - [x] Form submission handler

---

### ✅ 7. TERMS PAGE (`/terms`)
- **Purpose:** Legal requirements
- **Status:** COMPLETED
- **Content:**
  - [x] Service terms
  - [x] **CRITICAL DISCLAIMER:** "ArGen scores reflect AI usage quality, NOT employee performance. No employment decisions based solely on scores."
  - [x] Refund policy
  - [x] Data usage policy
  - [x] Liability limits
  - [x] Version & last updated date
  - [x] Footer link

---

### ✅ 8. PRIVACY PAGE (`/privacy`)
- **Purpose:** Legal requirements + GDPR compliance
- **Status:** COMPLETED
- **Content:**
  - [x] Data collection (what data collected)
  - [x] Data usage (how scoring works)
  - [x] Data retention: "Anonymized after 90 days for benchmarks"
  - [x] GDPR compliance section
  - [x] CCPA compliance (optional)
  - [x] User rights section
  - [x] Contact for privacy issues
  - [x] Footer link

---

# 🔄 PHASE 2: SECONDARY PAGES & AUTHENTICATION (WEEK 2-3)

**Goal:** Add content hub + customer dashboard. Customer-facing features.

## Pages to Build (Status)

### ✅ 9. BLOG PAGE (`/blog`)
- **Purpose:** SEO + thought leadership + content hub
- **Status:** COMPLETED
- **Task ID:** 2.1 in TASK_TRACKER.md
- **Content:**
  - [x] Blog grid/list layout
  - [x] Search & filter by category
  - [x] Pagination
  - [x] Categories: "State of AI Performance", "Case Studies", "Benchmarks"
  - [x] Link to individual post view
  - [x] Add social share buttons
- **Posts Required (3 minimum):**
  - [x] Post 1: "State of AI Performance" (benchmark insights)
  - [x] Post 2: Case study (anonymized customer story)
  - [x] Post 3: "How to Measure Real AI Productivity"
- **Timeline:**
  - [x] Week 3: Create blog template & infrastructure
  - [x] Week 3: Write 3 starter articles
  - [x] Week 4: Publish & optimize

---

### ✅ 10. TEAMS DASHBOARD (`/teams`) — CUSTOMER-ONLY
- **Purpose:** Dashboard for paying customers (login required)
- **Status:** COMPLETED (Mock/Visual)
- **Task ID:** 2.3 in TASK_TRACKER.md
- **Prerequisites:**
  - [ ] Authentication system (Task 4.1)
  - [ ] Database for teams/scores
- **Content:**
  - [x] Login check/auth gate (Visual)
  - [x] Team members list with photos/roles
  - [x] Past evaluations table
  - [x] Score trends chart (over time)
  - [x] Download reports button
  - [x] Navigation to individual team details
  - [x] Loading states
  - [x] Empty state messaging
- **Timeline:**
  - [x] Week 4: Basic dashboard layout
  - [x] Week 4: Visual auth gate
  - [x] Week 4: Integrate data display

---

### ✅ 11. TEAM DETAIL PAGE (`/team/:id`) — CUSTOMER-ONLY
- **Purpose:** Single team deep-dive view
- **Status:** COMPLETED (Mock/Visual)
- **Task ID:** 2.4 in TASK_TRACKER.md
- **Content:**
  - [x] Dynamic routing for team ID (Visual)
  - [x] Member breakdown (individual cards)
  - [x] Individual scores (by member, by dimension)
  - [x] Department rollups (if applicable)
  - [x] Benchmark comparison ("Your team vs industry average")
  - [x] Export/download report feature
  - [x] Breadcrumb navigation
  - [x] Loading & error states

---

### ✅ 12. CONTACT PAGE — ENHANCED
- **Purpose:** Existing page may need CRM integration
- **Status:** COMPLETED
- **Task ID:** 2.2 in TASK_TRACKER.md
- **Pending:**
  - [x] Connect form to UI
  - [x] Calendly integration placeholder working
  - [x] Social links added

---

# ✅ PHASE 3: LEGAL & DOCUMENTATION ✅ COMPLETE

**Goal:** Expanded legal docs + API documentation for enterprise.

### ✅ 13. TERMS OF SERVICE (Expanded)
- **Purpose:** Detailed legal protection
- **Status:** COMPLETED
- **Task ID:** 3.1 in TASK_TRACKER.md
- **Content:**
- **Status:** NOT STARTED (basic version done)
- **Task ID:** 3.2 in TASK_TRACKER.md
- **Content:**
  - [ ] GDPR compliance section (detailed)
  - [ ] CCPA compliance section
  - [ ] GDPR data retention policy
  - [ ] Third-party integrations list (Stripe, Tally, etc)
  - [ ] Cookie policy
  - [ ] Data breach notification procedure
  - **Note:** Have legal team review before final publish

---

### ⏳ 15. API DOCUMENTATION PAGE (`/docs`) — ENTERPRISE ONLY
- **Purpose:** API access for enterprise customers
- **Status:** NOT STARTED
- **Content (Deferred to Month 6+):**
  - [ ] API endpoints list
  - [ ] Authentication method
  - [ ] Request/response format
  - [ ] Rate limits
  - [ ] Error codes
  - [ ] Code examples
  - [ ] Rate limiting
  - [ ] Deprecation policy

---

# 💻 PHASE 4: BACKEND INFRASTRUCTURE (MONTH 2+)

**Goal:** Build API, database, authentication. Enable customer dashboard.

### ✅ TASK 4.1: AUTHENTICATION SYSTEM
- **Status:** COMPLETED
- **Task ID:** 4.1 in TASK_TRACKER.md
- **Est. Tokens:** 5,000
- **Components:**
  - [x] User model/schema (name, email, password, role, company)
  - [x] JWT authentication (token generation/validation)
  - [x] Login endpoint (`POST /api/auth/login`)
  - [x] Signup endpoint (`POST /api/auth/signup`)
  - [x] Password reset flow (UI Placeholder)
  - [x] Session management
  - [x] Role-based access control (Admin, User, Evaluator)
  - [x] Email verification (Drafted)

---

### ✅ TASK 4.2: DATABASE SCHEMA
- **Status:** COMPLETED
- **Task ID:** 4.3 in TASK_TRACKER.md
- **Est. Tokens:** 2,500
- **Models:**
  - [x] `User` - (name, email, password, role, company)
  - [x] `Team` - (name, company, admin)
  - [x] `Challenge` - (title, description, type, difficulty)
  - [x] `Evaluation` - (team, challenge, scores, status)
  - [x] `Response` - (user, evaluation, challenge, promptText, modelOutput)
  - [x] Mongoose models implemented and verified

---

### ✅ TASK 4.3: API ENDPOINTS (CORE)
- **Status:** COMPLETED
- **Task ID:** 4.2 in TASK_TRACKER.md
- **Est. Tokens:** 6,000
- **Endpoints:**
  - [x] `POST /api/auth/login` - Login user
  - [x] `POST /api/auth/signup` - Register user
  - [x] `POST /api/teams` - Create team
  - [x] `GET /api/teams/:id` - Get team details
  - [x] `POST /api/challenges/:id/submit` - Submit challenge response
  - [x] `GET /api/scores/:teamId` - Get team scores
  - [x] `GET /api/benchmark` - Get benchmark data
  - [x] All endpoints: validation, error handling, auth checks

---

# ✅ CONTENT CHECKLIST PER PAGE

## HOME PAGE
- [x] Hero headline (pain-focused)
- [x] Sub-headline (solution)
- [x] Primary CTA button
- [x] How it works (3 steps max)
- [x] Social proof numbers
- [x] Secondary CTA (demo)

## EVALUATE PAGE
- [x] Form (Tally embed)
- [x] "What happens next" timeline
- [x] Trust signals ("No credit card", "5-person limit")

## PRICING PAGE
- [x] 3-4 tiers visible
- [x] "Most popular" badge on Team Snapshot
- [x] FAQ (5 questions max)
- [x] CTA per tier

## ABOUT PAGE
- [x] Problem statement
- [x] Why you built this
- [x] Your credibility
- [x] Vision statement

## BLOG PAGE (PENDING)
- [ ] 3 posts minimum before launch
- [ ] Topics: AI measurement, benchmark insights, case study

## TEAMS DASHBOARD (PENDING)
- [ ] Team list
- [ ] Score display
- [ ] Report download
- [ ] Benchmark comparison

---

# ⏸️ PAGES TO DELETE OR DEFER

**These pages mentioned in old docs are NOT required for launch. Delete:**

❌ `/AuditLog` — Enterprise feature, year 2  
❌ `/Billing` — Use Stripe portal, not custom page  
❌ `/BusinessOnboarding` — Combine into `/evaluate`  
❌ `/Certifications` — No certifications yet  
❌ `/Compliance` — Merge into `/privacy`  
❌ `/Download` — Reports email automatically  
❌ `/Explore` — Vague, unnecessary  
❌ `/Governance` — Enterprise bloat  
❌ `/JoinTeam` — No team to join yet  
❌ `/MobileGuide` — Web-first, defer  
❌ `/TeamOnboarding` — Merge into main flow  
❌ `/Tutorials` — Blog handles this  

---

# 📊 DEPLOYMENT TIMELINE

```
WEEK 1 (CURRENT):
  ✅ /                   (Landing)
  ✅ /evaluate           (Pilot signup)
  ✅ /pricing            (Tiers)

WEEK 2:
  ✅ /about              (Story)
  ✅ /contact            (Sales)
  ✅ /terms              (Legal)
  ✅ /privacy            (Legal)

WEEK 3:
  ⏳ /blog               (Content hub)
  ⏳ /blog/:id           (Individual post)

WEEK 4:
  ⏳ /teams              (Customer dashboard)
  ⏳ /team/:id           (Team detail)

TOTAL LAUNCH: 8 Public Pages + 2 Authenticated Pages
NO MORE PAGES NEEDED FOR MONTH 1 LAUNCH
```

---

# 🎯 NEXT IMMEDIATE ACTIONS

## RIGHT NOW:
1. **Verify Phase 1 pages are live** on ar-gen-new.vercel.app
2. **Check for bugs/missing content** on live site
3. **Create blog post drafts** (3 posts for Week 3)

## THIS WEEK:
1. Review Phase 1 deployment
2. Validate all CTAs link correctly
3. Test pilot form (does it submit?)
4. Check social proof numbers are accurate

## NEXT WEEK (Phase 2):
1. Start Blog infrastructure (Task 2.1)
2. Enhance Contact page if needed (Task 2.2)

## MONTH 2+ (Backend):
1. Set up authentication (Task 4.1)
2. Build database schema (Task 4.3)
3. Create API endpoints (Task 4.2)
4. Connect dashboard to API
5. Expand legal docs for review

---

# 📌 KEY METRICS TO TRACK

- [ ] Pilot signups: Target 50 by end of Month 1
- [ ] Website traffic: GA4 tracking enabled
- [ ] Blog post engagement: SEO ranking tracked
- [ ] Demo booking rate: Via Calendly
- [ ] Customer conversion: Pilots → Paid

---

# 🔗 RELATED FILES

- **Task Details:** See TASK_TRACKER.md for full task breakdown
- **Checkpoints:** See CHECKPOINT_GUIDE.md if resuming work
- **Quick Start:** See AGENT_QUICK_START.md for AI agent onboarding
- **Source:** docs/implement.txt (original implementation blueprint)

**Version:** 1.0  
**Last Updated:** 2026-05-06  
**Maintained By:** AI Agent / Project Manager
