# ArGen Platform Master Technical & Final Build Report
**Version:** 1.2.0 (Final Release Candidate)
**Date:** May 10, 2026
**Status:** Feature Complete & Production Hardened (100% Progress)

This document serves as the absolute single source of truth and final post-mortem for the ArGen platform. It details every workflow, file layout, database connection, AI swarm integration, architectural pivot, and UI/UX design principle implemented during the build phase. **When exported to an AI assistant (like Claude), this file provides complete context for future iterations, bug fixes, and feature expansions.**

---

## 1. Project Overview & Philosophy

**ArGen** is an autonomous AI Workflow Intelligence platform. It utilizes a "Swarm" of specialized AI agents to research client organizations, generate contextual daily challenges, score responses to identify top performers, and extract their best practices into replicable, time-saving workflow playbooks for Ops and Product leaders.

*   **"Zero Intervention" Architecture:** Once a company is onboarded, ArGen runs completely autonomously. It does not require human administrators to generate content, score tests, or compile reports.
*   **Design Philosophy ("Soulful Brutalism"):** The platform eschews complex UI frameworks (like React/Tailwind) in favor of high-performance Vanilla CSS, CSS Grid, and custom GSAP micro-animations. It uses deep blacks, glassmorphism, glowing accents (ArGen Blue `#2b60e2`), and italicized "Soul Text" to create a premium, editorial, and slightly futuristic aesthetic.

---

## 2. Development Journey & Architectural Pivots

Throughout the development lifecycle, several critical pivots were made to enhance security, usability, and maintainability:

1.  **Authentication Security Pivot:**
    *   *Initial State:* Hardcoded admin credentials inside the source code.
    *   *Final State:* Total removal of hardcoded credentials. Superadmin access is now securely isolated and bypasses the database entirely, relying strictly on Vercel Environment Variables (`ADMIN_EMAIL` and `ADMIN_PASSWORD`). This ensures "Safe Run" capability—even if the database is compromised, platform control remains locked to the Vercel infrastructure.
2.  **Onboarding & Registration Pivot:**
    *   *Initial State:* Open registration form for anyone to create a company.
    *   *Final State:* Transitioned to an **Invite-Only Onboarding System**. Superadmins generate cryptographically secure, single-use hex tokens via the Admin Portal (`/api/admin/invitations`). These tokens are emailed to prospects, who use them to bypass manual approval via the `registration.html?approval=true&team_id=TOKEN` flow. This prevents spam and locks down platform access.
3.  **UI/UX Consolidation Pivot:**
    *   *Initial State:* Disjointed pages, including a public-facing blog, and inline CSS grid styling.
    *   *Final State:* Legacy content (like the blog) was deprecated. The entire platform was consolidated into a cohesive "web-window" editorial design. Inline styling was replaced by a robust, reusable CSS Grid system (`.grid-4`, `.grid-2-1`, `.grid-1-1`) to guarantee perfect mobile/tablet responsiveness across the 12-panel TeamAdmin dashboard.
4.  **Adversarial AI Detection Pivot:**
    *   *Initial State:* AI scoring agents blindly evaluated all user input.
    *   *Final State:* The Scoring Agent prompt was hardened with strict heuristics to detect `TOO_SHORT`, `LOW_EFFORT`, `PROMPT_INJECTION`, `PLAGIARISM`, and `AI_DETECTED` content. Offending responses automatically score zero and are flagged in the database (`Manual Review` status). A dedicated `/api/admin/flagged` endpoint surfaces these anomalies directly to the TeamAdmin dashboard for auditing.
5.  **OWASP Security Hardening Pivot:**
    *   *Final State:* Added `helmet` for strict Content Security Policies (CSP), and `express-rate-limit` to prevent brute-force API attacks and AI credit exhaustion.
6.  **Strategic Pivot to Workflow Intelligence:**
    *   *Initial State:* Positioned as an HR/L&D cognitive evaluation tool focused on scores and leaderboards.
    *   *Final State:* Repositioned for VP/Ops leaders to focus on shipping velocity. Scores are now a discovery mechanism to find top performers. The end product is the extraction of replicable AI workflows that save 10+ hours/week, driving team-wide productivity rather than individual performance reviews.
    *   *Implementation Details:* 
        *   Added `workflowApproach`, `timeTaken`, and `baselineTime` telemetry fields to the frontend evaluation form, backend API (`/api/responses/submit`), and Mongoose `Response` schema.
        *   Updated the Report Agent and Coaching Agent prompts in `ai-agents.js` to focus on workflow replication and time efficiency rather than strict performance grading.
        *   Created the `Workflow_Extraction_SOP.md` document to define the manual and automated pipeline for converting raw telemetry into standardized playbooks.

---

## 3. Comprehensive Technology Stack & External Connections

### Frontend (Client-Side)
*   **Structure:** Vanilla HTML5 (Multi-Page Application architecture).
*   **Styling:** Vanilla CSS3. Global variables managed in `style.css` (e.g., `--bg-black`, `--argen-blue`, `--text-sec`).
*   **Interactions & Animations:** Vanilla JavaScript (ES6+).
    *   **GSAP (GreenSock):** Used extensively on the landing page (`index.html`) for scroll triggers, text reveals, and smooth element entrances.
*   **Data Visualization:** **Chart.js** via CDN. Used for Radar charts, Line graphs, and Bar charts in the dashboards.
*   **Export Utility:** **html2pdf.js** integrated for TeamAdmin reporting exports.

### Backend (Server-Side)
*   **Runtime & Framework:** Node.js with Express.js.
*   **Authentication:** JWT (JSON Web Tokens) for session management, Bcrypt for password hashing.
*   **Security Middleware:** `helmet`, `express-rate-limit`, plus custom `protect` and `authorize` middleware to strictly enforce Role-Based Access Control (RBAC).

### Database & Storage
*   **Database:** **Supabase** (PostgreSQL).
*   **Client:** `@supabase/supabase-js` SDK with service role key for backend access.

### AI & External APIs (Safe Run Connections)
*   **OpenAI API:** The core intelligence engine. Uses `gpt-4o` or `o1-mini` for the agent swarm. Connection secured via `OPENAI_API_KEY`.
*   **Email Utility:** Pluggable notification wrapper (`backend/utils/email.js`) configured for transactional invites.

### Deployment Infrastructure
*   **Platform:** **Vercel**.
*   **Configuration:** Relies on `vercel.json` to rewrite API calls (`/api/*` to `backend/server.js`) and serve static frontend assets.

---

## 4. Directory & File Layout

```text
ArGen - New Look/
├── .env.example                # Template for external connections (Mongo, OpenAI, Admin)
├── vercel.json                 # Serverless routing rules
├── backend/                    # Node.js API
│   ├── server.js               # Express app entry point (Secured with Helmet, RateLimit)
│   ├── config/                 # DB connection logic
│   ├── middleware/             # Auth & Error handling
│   ├── models/                 # Mongoose Schemas (User, Company, Response, etc.)
│   ├── routes/                 # API Endpoints (auth.js, admin.js, ai.js, etc.)
│   ├── utils/                  # AI Swarm logic (ai-agents.js), Email utility (email.js)
│   └── scripts/                # Cron jobs and schedulers (scheduler.js)
├── frontend/                   # Client-facing assets
│   ├── css/
│   │   └── style.css           # Global "Soulful Brutalism" stylesheet (CSS Grid classes)
│   ├── js/
│   │   ├── api.js              # Centralized fetch wrapper & JWT handler
│   │   ├── auth-guard.js       # Client-side route protection
│   │   └── dashboard.js        # Logic for 12-panel/4-panel rendering, PDF generation
│   ├── html/
│   │   ├── index.html          # GSAP-animated landing page
│   │   ├── login.html          # Clean, distraction-free authentication
│   │   ├── registration.html   # Invite-only onboarding flow
│   │   ├── admin-portal.html   # Superadmin 4-tab control center
│   │   ├── dashboard.html      # TeamAdmin & Member dynamic portal
│   │   └── take-evaluation.html# Interactive AI challenge environment
└── docs/                       # Project specifications
```

---

## 5. Database Schema Interconnections

The system relies on a tightly coupled relational graph within MongoDB:

1.  **`Company`**: The root entity. Stores domain, industry, and AI profile data generated by the Research Agent.
2.  **`Invitation`**: Ephemeral tokens linked to a `Company` name. Consumed during registration.
3.  **`User`**: Linked to a `Company` via `companyId`. Contains `role` (`superadmin`, `teamadmin`, `member`), streak counters, and performance averages.
4.  **`Challenge`**: Linked to a `Company`. Contains the daily scenario text, evaluation rubrics, and expiration dates.
5.  **`Response`**: The intersection of `User` and `Challenge`. Stores the user's answer, AI-generated dimension scores (Clarity, Ethics, etc.), and the AI Coach's feedback. Uses `scoringStatus` to track adversarial flags (`Manual Review`).
6.  **`SystemMetric`**: Globally tracks the platform's health. Records every agent invocation, tokens used, cost, and API quality score. Completely independent of user data.

---

## 6. The 5-Agent Swarm (Workflow & Telemetry)

The heart of ArGen is `backend/utils/ai-agents.js`. Every agent is instrumented to record its execution to the `SystemMetric` collection.

1.  **Agent 1: Research Agent**
    *   **Trigger:** Fired immediately when a Superadmin approves a new company.
    *   **Function:** Scrapes the web (or relies on LLM knowledge) to deduce the company's industry, tech stack, and primary challenges.
2.  **Agent 2: Challenge Agent**
    *   **Trigger:** Fired daily at midnight via `scheduler.js`.
    *   **Function:** Reads the Company profile and generates highly specific, contextual role-playing scenarios.
3.  **Agent 3: Scoring Agent (Adversarial Hardened)**
    *   **Trigger:** Fired instantly when a user submits a response in `take-evaluation.html`.
    *   **Function:** Objectively grades text against 5 dimensions: Clarity, Constraints, Specificity, Iteration, and Ethics. Also acts as an intrusion detection system for Prompt Injection and Plagiarism.
4.  **Agent 4: Report Agent**
    *   **Trigger:** Fired weekly via `scheduler.js`.
    *   **Function:** Aggregates all `Response` data for a company to identify skill gaps and trends.
5.  **Agent 5: Coaching Agent**
    *   **Trigger:** Fired concurrently with the Scoring Agent.
    *   **Function:** Translates the harsh numerical scores into empathetic, actionable feedback ("Soulful Coaching").

---

## 7. Page Layouts, UI Modules, and Logic

### A. The Landing Page (`index.html`)
*   **Tech:** Uses GSAP `ScrollTrigger`. Text splits into spans and fades upward. Uses `clip-path` and `transform` for buttery smooth 60fps animations.

### B. Authentication & Onboarding
*   **`login.html`**: A stark, centered form. **CRITICAL BYPASS:** If the email matches the Vercel `ADMIN_EMAIL` env var, it ignores the DB and verifies against `ADMIN_PASSWORD`, returning a hardcoded Superadmin JWT.
*   **`registration.html`**: Requires an `?approval=true&team_id=TOKEN` URL parameter. Fails instantly if the token is missing or invalid in the `Invitation` collection.

### C. The Superadmin Control Center (`admin-portal.html`)
*   **Layout:** 4-Tab Interface.
    1.  **Organizations:** Approve/Reject pending companies.
    2.  **User Audit:** Global list of all registered users.
    3.  **Invitations:** Generate secure signup links. Triggers the transactional email utility.
    4.  **System Monitor:** The crown jewel of observability. Contains 3 Chart.js graphs mapping `SystemMetric` data.

### D. The Dynamic Dashboard (`dashboard.html` & `dashboard.js`)
This page dynamically renders based on the user's JWT role.
*   **TeamAdmin View (12-Panel UI):** Features Dimension Heatmaps, Industry Benchmark Radars, a Live Leaderboard, an Adversarial Flag queue, and a one-click PDF Generation utility (`html2pdf.js`).
*   **Member View (4-Panel UI):** Features the active daily challenge, streak counters, mini-leaderboard, and historical submission timeline.

---

## 8. Comprehensive API Routing

*   **Auth (`/api/auth/*`)**
    *   `POST /register`: Consumes an invite token, creates a Company and User.
    *   `POST /login`: Issues JWT. Handles the Env Var override for Superadmin.
*   **Admin (`/api/admin/*`)**
    *   `GET /stats`: (Superadmin) Global system metrics from `SystemMetric`.
    *   `GET /company-dashboard-stats`: (TeamAdmin) Aggregated performance metrics specific to the user's `companyId`.
    *   `GET /flagged`: (TeamAdmin) Retrieves adversarial or manually flagged submissions.
    *   `POST /invitations`: (Superadmin) Generates a random hex token and dispatches email.
*   **AI & Responses (`/api/ai/*`, `/api/responses/*`)**
    *   `POST /responses/submit`: Validates text, triggers Scoring & Coaching agents, updates Streaks.
*   **Cron Simulators (`/api/scheduler/*`)**
    *   `POST /daily`: Forces the Challenge Agent to run.

---

## 9. Export Instructions & Future Prompts

**For the Human:** Export this file and upload it to a new Claude.ai Project or chat window. This marks the 100% completion of the ArGen MVP Build Phase.

**For the AI (Claude):**
> "You are now acting as the lead software architect for ArGen. You have read the `ARGEN-MASTER-STATUS-REPORT.md`. Your goals for this session must strictly adhere to the 'Soulful Brutalism' CSS architecture, rely on Vanilla JS (no React unless explicitly requested), and utilize the `SystemMetric` collection whenever modifying backend agent logic. The platform is fully secured (Helmet, RateLimit, MongoSanitize) and autonomous. If asked to create a new page, you must use the `web-window` container class and `argenApi.request()` wrapper from `api.js` for data fetching. Acknowledge this by summarizing the 5-Agent swarm."
