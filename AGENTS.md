# ArGen Platform — Project Context for AI Agents

> **READ THIS FIRST:** This file is the single source of truth for the ArGen platform. Every AI agent, assistant, or developer starting work on this project MUST read this file before making any changes.

---

## 🎯 What Is ArGen?

ArGen (**AI Workflow Intelligence Platform**) is a B2B SaaS product that autonomously evaluates how well employees use AI tools in their daily workflows. It is NOT a quiz app — it is a scoring and intelligence engine for enterprise procurement and HR decisions.

**Live URL:** https://argen.isira.club  
**GitHub Repo:** https://github.com/isiraglobal/ArGen-New  
**Brand Name:** ArGen — "AI Workflow Intelligence"

---

## 🏗️ Architecture Overview

```
ArGen - New Look/
├── frontend/            # Static HTML/CSS/JS frontend (no framework)
│   ├── html/            # All page HTML files
│   ├── css/style.css    # Single global stylesheet — brand design system
│   ├── js/              # Client-side JavaScript
│   │   ├── api.js       # API client — all backend calls go here
│   │   ├── auth-guard.js # Client-side route protection
│   │   └── dashboard.js, take-evaluation.js, etc.
│   └── images/          # Brand assets (ArGen Logo.png, etc.)
├── backend/             # Node.js/Express API server
│   ├── server.js        # Express app entry point + Supabase (PostgreSQL) connection
│   ├── routes/          # All API route handlers
│   │   ├── auth.js      # Login, register, JWT, password reset
│   │   ├── admin.js     # TeamAdmin + Superadmin dashboard APIs
│   │   ├── challenges.js # Challenge CRUD + submission
│   │   ├── evaluations.js # Evaluation batch management
│   │   ├── responses.js # Scoring + response history
│   │   ├── ai.js        # AI proxy endpoint (OpenAI)
│   │   ├── scheduler.js # Automated email/coaching scheduler
│   │   ├── benchmark.js # Calibration & benchmarking
│   │   └── leaderboard.js # Team rankings
│   ├── middleware/auth.js # JWT protect + role authorize middleware
│   └── utils/
│       ├── ai-agents.js # 5 AI agents: Research, Challenge Generator, Scorer, Report Writer, Coach
│       ├── sendEmail.js # Nodemailer email dispatcher
│       └── emailTemplate.js # Brutalist HTML email template factory
├── api/index.js         # Vercel serverless entry point (imports backend/server.js)
├── vercel.json          # Vercel routing + rewrite rules
├── .env                 # Environment variables (see section below)
└── graphify-out/        # AI knowledge graph — use /graphify to query this project
```

---

## 🧠 User Roles

| Role | Access | Description |
|------|--------|-------------|
| `superadmin` | Everything | Platform owner (ArGen team). Manages all companies. |
| `teamadmin` | Company-level | Company admin. Manages members, runs reports, sees team analytics. |
| `member` | Personal | Employee. Takes challenges, sees personal dashboard. |

**Login bypass for testing:**
- Email: `admin@argen` / Password: `argen@admin` → logs in as **superadmin/teamadmin** (bypass, no DB needed)
- Email: `test@argen` / Password: `argen@admin` → logs in as **test teamadmin**

---

## 🔌 API Base URL Resolution

The `frontend/js/api.js` file auto-detects the environment:
- **Production** (argen.isira.club): calls `/api/*` (same domain, Vercel serverless)
- **Local** (localhost): calls `http://localhost:3001/api`

---

## 🗄️ Database

- **Provider:** Firebase Firestore (PostgreSQL via Supabase was removed)
- **Auth:** Firebase Auth (Admin SDK v14 with JWT tokens + custom JWT fallback)
- **Connection:** Configured via `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY_BASE64` in `.env`
- **Firestore database name:** `default` (not `(default)`) — the REST API and gcloud CLI require explicit `--database=default` flag
- **Admin SDK call:** `getFirestore('default')` — v14 requires explicit database ID
- **Mock fallback:** If Firebase connection fails, `global.MOCK_DB = true` — mock data only for local dev, blocked in production

---

## 🤖 5 AI Agents (backend/utils/ai-agents.js)

All agents use a primary provider chain prioritizing NVIDIA NIM models (Llama 3.3 70B & Llama 3.1 8B) with fallback to Anthropic Claude → Gemini → OpenAI. If all fail, a deterministic mock kicks in.

1. **Research Agent** — Profiles a company's industry, AI tools, tone, competitors
2. **Challenge Generator** — Creates a personalized daily AI challenge per employee role/department  
3. **Scoring Agent** — Scores submissions 0-100 across 4 dimensions: Clarity, Constraint Application, Output Specificity, Iteration Quality. Detects adversarial inputs (prompt injection, low-effort, AI-generated boilerplate)
4. **Report Writer** — Generates weekly Markdown executive reports with workflow ROI analysis
5. **Coaching Agent** — Writes 3-5 sentence personalized nudges based on submission performance + streak

---

## 🎨 Design System

- **Theme:** Dark brutalist / premium SaaS. Black backgrounds (#0a0a0a), electric green accents (#00ff88), sharp typography.
- **Font:** Inter (Google Fonts)
- **Logo:** `frontend/images/ArGen Logo.png` — must be visible at top of EVERY page
- **CSS:** All styles in `frontend/css/style.css`. No Tailwind, no frameworks — pure CSS custom properties.
- **Brand color vars:** `--accent: #00ff88`, `--bg: #0a0a0a`, `--card-bg: rgba(255,255,255,0.03)`

---

## 🚀 Deployment

- **Hosting:** Vercel (connected to GitHub `isiraglobal/ArGen-New` repo)
- **Trigger:** Any `git push origin main` triggers a Vercel rebuild
- **Serverless Entry:** `api/index.js` → imports `backend/server.js` → exports Express app
- **Static Files:** Served directly by Vercel from `frontend/`
- **Rewrites:** Configured in `vercel.json` — `/api/*` → `api/index.js`, all other routes → corresponding HTML files

---

## ⚙️ Environment Variables (.env)

| Key | Purpose |
|-----|---------|
| Key | Purpose | Required |
|-----|---------|----------|
| `FIREBASE_PROJECT_ID` | Firebase project ID | ✅ |
| `FIREBASE_CLIENT_EMAIL` | Firebase Admin SDK service account email | ✅ |
| `FIREBASE_PRIVATE_KEY_BASE64` | Firebase Admin SDK private key (base64) | ✅ |
| `FIREBASE_WEB_API_KEY` | Firebase Web API key (for client-side auth) | ✅ |
| `JWT_SECRET` | JSON Web Token signing secret | ✅ |
| `TOKEN_ENCRYPTION_KEY` | Encryption key for OAuth tokens (ai_connections) | ✅ |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Superadmin login bypass credentials | Optional |
| `ADMIN_ACCESS` / `ADMIN_PORTAL_CODE` | Admin portal passcode | Optional |
| `NVIDIA_API_KEY` | NVIDIA NIM global fallback API key | Optional |
| `META_LLAMA_3_1_8B_INSTRUCT_API_KEY` | NVIDIA NIM API key for Llama 3.1 8B | Optional |
| `META_LLAMA_3_3_70B_INSTRUCT_API_KEY` | NVIDIA NIM API key for Llama 3.3 70B | Optional |
| `ANTHROPIC_API_KEY` | Claude API for AI agents (fallback) | Optional |
| `GEMINI_API_KEY` | Gemini API for AI agents (fallback) | Optional |
| `OPENAI_API_KEY` / `AI_API_KEY` | OpenAI for AI agents (fallback) | Optional |
| `EMAIL_USER` / `EMAIL_PASS` | Gmail SMTP for automated emails | Optional |
| `WHOP_API_KEY` | Whop payment platform API key | Optional |
| `WHOP_WEBHOOK_SECRET` | Whop webhook signature verification | Optional |
| `DISCORD_WEBHOOK_URL` | Discord webhook for application notifications | Optional |
| `CRON_SECRET` | Secret for scheduler cron endpoints | Optional |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` / `GOOGLE_REDIRECT_URI` | Google OAuth for AI connections | Optional |
| `MICROSOFT_CLIENT_ID` / `MICROSOFT_CLIENT_SECRET` / `MICROSOFT_REDIRECT_URI` | Microsoft OAuth for AI connections | Optional |
| `GOOGLE_WORKSPACE_CLIENT_ID` / `GOOGLE_WORKSPACE_CLIENT_SECRET` / `GOOGLE_WORKSPACE_REDIRECT_URI` | Google Workspace admin integration | Optional |
| `CLIENT_URL` | Frontend URL for redirects (default: argen.isira.club) | Optional |
| `FROM_NAME` / `FROM_EMAIL` | Sender name/email for automated emails | Optional |
| `NVIDIA_MODEL_NAME` | Custom NVIDIA NIM model name override | Optional |
| `SUPABASE_ANON_KEY` | Supabase anonymous public API key (exposed to client) | Optional |

**Note:** `.env` is gitignored. For Vercel production, set these same vars in the Vercel dashboard under Project → Settings → Environment Variables.

---

## 🐛 Known Issues & History

### Resolved
- ✅ **Firestore indexes deployed (all 18):** All composite indexes for `where()`+`orderBy()` queries across `ai_usage_events`, `ai_proxy_transactions`, `ai_usage_daily`, `workflow_sessions`, `system_metrics`, `agent_analyses`, `api_keys`, `users`, `responses` are now in `CREATING` state. Deployed via `gcloud firestore indexes composite create --database=default`. Database name is literally `default` (not `(default)` as `gcloud` docs claim).
- ✅ **Redirect loop fixed:** Root cause was missing Firestore composite indexes causing API 500 errors. Fixes: (1) `?cleared=1` URL param guard in auth-guard.js (replaces broken sessionStorage), (2) 18 indexes deployed, (3) proxy.js orderBy-before-where bug fixed, (4) duplicate `const urlParams` fixed
- ✅ **Proxy reworked to zero-cost:** No longer uses user API keys from `ai_connections` — only records transaction metadata passively. `getArgenApiKey()` uses ArGen's own env vars for internal analysis only.
- ✅ `api/index.js` had a literal `\n` instead of a real newline (caused `FUNCTION_INVOCATION_FAILED` on all Vercel API calls). Fixed.
- ✅ Root `package.json` was missing `helmet`, `express-rate-limit`, `@whop/sdk`. Fixed.
- ✅ macOS EPERM port binding — resolved by removing Screen Time/content restrictions on user's machine
- ✅ Auth guard bypasses via clean URLs (no `.html` extension) — fixed in `auth-guard.js`
- ✅ Scroll indicator obscuring UI clicks — fixed with `pointer-events: none` in `style.css`
- ✅ Admin portal layout broken — refactored to CSS grid sidebar layout
- ✅ Missing mockup images causing 404 — replaced with working remote images
- ✅ **MongoDB removal:** Deleted all Mongoose models, scripts, deps. Backend now uses only Firebase/Firestore.
- ✅ **Firebase frontend cleanup:** Removed "Supabase" from all visible UI text across login, onboarding, forgot-password, reset-password, oauth, and index pages.
- ✅ **Header visibility:** Nav is now always visible (`transform: translateY(0)` by default). Removed scroll-hide behavior.
- ✅ **Admin portal redesign:** Clean layout with sidebar tabs (Dashboard, Organizations, Users, Invitations, Monitor, Invoices), search/filter bars, edit/delete capabilities, organized modals.
- ✅ **PDF report:** Branded standalone PDF with exec summary, dimension scores (with progress bars), recommendations, activity summary — generated in an iframe from `dashboard.js`.
- ✅ **Legal/industry-standard:** Cookie consent banner in `script.js`, terms acceptance checkbox in registration, robust privacy and terms pages, robots.txt, sitemap.xml, SEO meta tags.
- ✅ **Firestore API enabled + database created** (`eur3`, Native mode). Fix: `getFirestore('default')` instead of bare `getFirestore()` — v14 Admin SDK requires explicit database ID.
- ✅ **Firestore CRUD verified** — all `.add()`, `.doc().get()`, `.update()`, `.delete()`, `.where().get()` working.
- ✅ **Admin portal unlocking fixed** — two-layer auth mismatch resolved:
  - `middleware/auth.js`: mock-token now maps to `superadmin` (was `teamadmin`)
  - `admin.js` passcode now accepts `ADMIN_PASSWORD` as well as `ADMIN_ACCESS`/`ADMIN_PORTAL_CODE`
  - `admin-portal.html`: auto-unlocks if already authenticated, better error messages

### Pending / In Progress
- ⚠️ **Google OAuth:** Keys exist in `.env` but implementation is incomplete.

---

## 📋 Page Inventory

| Route | HTML File | Auth Required | Role |
|-------|-----------|---------------|------|
| Route | HTML File | Auth Required | Role |
|-------|-----------|---------------|------|
| `/` | `index.html` | No | Public |
| `/login` | `login.html` | No | Public |
| `/registration` | `registration.html` | No | Public |
| `/dashboard` | `dashboard.html` | Yes | member |
| `/admin-portal` | `admin-portal.html` | Yes | teamadmin |
| `/admin-access` | `admin-access.html` | No | Public |
| `/take-evaluation` | `take-evaluation.html` | Yes | member |
| `/evaluate` | `evaluate.html` | Yes | member |
| `/challenges` | `challenges.html` | Yes | member |
| `/teams` | `teams.html` | Yes | teamadmin |
| `/team/:id` | `team-detail.html` | Yes | teamadmin |
| `/pricing` | `pricing.html` | No | Public |
| `/about` | `about.html` | No | Public |
| `/contact` | `contact.html` | No | Public |
| `/waitlist` | `waitlist.html` | No | Public |
| `/privacy` | `privacy.html` | No | Public |
| `/terms` | `terms.html` | No | Public |
| `/forgot-password` | `forgot-password.html` | No | Public |
| `/reset-password` | `reset-password.html` | No | Public |
| `/apply` | `apply.html` | No | Public |
| `/onboarding` | `onboarding.html` | Yes | member |
| `/connect` | `connect.html` | Yes | teamadmin |
| `/invoice` | `invoice.html` | No | Public |
| `/oauth` | `oauth.html` | No | Public |
| `/payment-success` | `payment-success.html` | No | Public |
| `/payment-failed` | `payment-failed.html` | No | Public |
| `/cookie-policy` | `cookie-policy.html` | No | Public |
| `/gdpr` | `gdpr.html` | No | Public |
| `/dpa` | `dpa.html` | No | Public |
| `/aup` | `aup.html` | No | Public |

---

## 🔄 graphify Knowledge Graph

This project has a live graphify knowledge graph in `graphify-out/`. To query the project structure:
```
/graphify query "how does scoring work"
/graphify explain "scoreResponse"
/graphify path "login" "dashboard"
```

The graph auto-rebuilds on every `git commit` via git hooks. To manually rebuild:
```bash
GEMINI_API_KEY=<YOUR_GEMINI_API_KEY> graphify extract . --backend gemini
```

---
*Last updated: June 2026 | Maintained by ArGen Development Team*

## 🟢 Current System Status

| Component | Status | Details |
|-----------|--------|---------|
| **Firebase Auth** | ✅ 100% | createUser, getUser, updateUser, deleteUser, verifyIdToken, setCustomUserClaims, generatePasswordResetLink, signInWithPassword |
| **Firestore** | ✅ 100% | CRUD, queries, where/orderBy/limit chaining — `eur3` Native mode, `getFirestore('default')` in Admin SDK v14 |
| **Firestore Indexes** | ✅ 18 deployed | All composite indexes for `where()`+`orderBy()` across 9 collections — deployed via gcloud with `--database=default` |
| **Admin Portal** | ✅ Working | Two-layer auth fixed, mock-token → superadmin, passcode accepts ADMIN_PASSWORD |
| **Capture API** | ✅ Working | POST interaction/batch/session, mock-token + API key auth |
| **API Keys** | ✅ Working | Generate/L/Revoke with `ag_` prefix |
| **Warehouse** | ✅ Working | Overview, departments, workflows, efficiency, communication |
| **Auth Routes** | ✅ Working | Login, register-company, Google OAuth flow |
| **Admin Routes** | ✅ Working | Stats, companies, users, invoices, agent-logs, flagged submissions |
| **All Routes** | ✅ 22 files | Syntax-verified, server starts on port 3001 |
