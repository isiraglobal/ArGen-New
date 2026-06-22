# ArGen Production QA Test — Agent Prompt

Test the live app at **https://argen.isira.club** and find ALL bugs/issues.

## Login Credentials

| Type | Value |
|------|-------|
| Admin bypass | `test@isira.club` / `testaccount` (returns `mock-token`) |
| Google OAuth | `isiraglobal@gmail.com` (superadmin) |
| API base | `https://argen.isira.club/api` |

## What To Test (hit every endpoint)

### 1. Auth
- [ ] `POST /api/auth/login` with admin creds → returns token + user
- [ ] `POST /api/auth/register-company` with unique email → creates company + returns inviteCode
- [ ] `GET /api/auth/me` with Bearer `<token>` → returns user profile
- [ ] `POST /api/auth/complete-profile` → sets profile
- [ ] `POST /api/auth/join-team` → joins via invite code
- [ ] `POST /api/auth/forgot-password` → should return link
- [ ] `GET /api/auth/env-creds` → should return empty in production
- [ ] `GET /api/auth/google/callback` (check if OAuth flow works)

### 2. API Keys
- [ ] `GET /api/keys` → list keys (if auth works)
- [ ] `POST /api/keys` → generate key with `ag_` prefix
- [ ] `DELETE /api/keys/:id` → revoke

### 3. Capture API (core)
- [ ] `POST /api/capture/interaction` → `{provider, model, prompt, completion}`
- [ ] `POST /api/capture/batch` → array of interactions
- [ ] `POST /api/capture/session` → `{startTime, endTime, interactions}`
- [ ] `GET /api/capture/events` → recent activity

### 4. Warehouse
- [ ] `GET /api/warehouse/overview` → usage overview
- [ ] `GET /api/warehouse/departments/:deptId` → by department
- [ ] `GET /api/warehouse/workflows` → workflow analysis
- [ ] `GET /api/warehouse/efficiency` → efficiency scores
- [ ] `GET /api/warehouse/communication` → communication patterns

### 5. AI Proxy
- [ ] `GET /api/proxy/stats` → tx count, active users, tokens, cost
- [ ] `GET /api/proxy/transactions` → paginated transaction list
- [ ] `GET /api/proxy/transactions?provider=openai` → filtered
- [ ] `POST /api/proxy/:provider/:endpoint` → proxy call

### 6. Billing
- [ ] `GET /api/proxy/stats` → tx count, active users, tokens, cost
- [ ] `GET /api/proxy/transactions` → paginated transaction list
- [ ] `GET /api/proxy/transactions?provider=openai` → filtered
- [ ] `POST /api/proxy/:provider/:endpoint` → proxy call

### 6. Billing
- [ ] `GET /api/billing/plan` → current plan
- [ ] `PUT /api/billing/plan` → change plan
- [ ] `GET /api/billing/usage` → billing period usage

### 7. Integrations
- [ ] `GET /api/integrations` → system integration statuses
- [ ] `PUT /api/integrations/capture` → toggle
- [ ] `GET /api/integrations/user` → user preferences
- [ ] `PUT /api/integrations/user` → update prefs
- [ ] `GET /api/integrations/agents` → AI agent configs
- [ ] `PUT /api/integrations/agents/scorer` → toggle agent
- [ ] `POST /api/integrations/agents/analyze` → analyze capture data
- [ ] `GET /api/integrations/agents/analyses` → past analyses
- [ ] `GET /api/integrations/download/vscode` → VS Code ext
- [ ] `GET /api/integrations/download/browser` → browser ext
- [ ] `GET /api/integrations/instructions/vscode` → instructions

### 8. HR
- [ ] `GET /api/hr/employees` → list company employees
- [ ] `GET /api/hr/employees/:id` → employee detail
- [ ] `GET /api/hr/stats` → HR stats
- [ ] `GET /api/hr/operations-summary` → ops summary

### 9. Connect (OAuth providers)
- [ ] `GET /api/connect` → list connected providers
- [ ] `GET /api/connect/oauth/:provider` → get OAuth URL
- [ ] `POST /api/connect/apikey` → save API key
- [ ] `POST /api/connect/sync/:provider` → sync data
- [ ] `DELETE /api/connect/:connectionId` → disconnect

### 10. Challenges
- [ ] `GET /api/challenges` → list challenges
- [ ] `GET /api/challenges/active` → active challenges
- [ ] `POST /api/challenges` → create challenge
- [ ] `POST /api/challenges/:id/submit` → submit response

### 11. Evaluations
- [ ] `GET /api/evaluations` → list evaluation batches
- [ ] `POST /api/evaluations` → create evaluation
- [ ] `GET /api/evaluations/:id` → batch detail
- [ ] `POST /api/evaluations/generate-ai` → generate via AI

### 12. Responses
- [ ] `GET /api/responses/my` → my responses
- [ ] `POST /api/responses/submit` → submit response
- [ ] `GET /api/responses/batch/:batchId` → batch responses

### 13. Analytics
- [ ] `GET /api/analytics/summary` → analytics overview
- [ ] `GET /api/analytics/users` → user analytics
- [ ] `GET /api/analytics/roi` → ROI data

### 14. AI
- [ ] `GET /api/ai/health` → AI agent health
- [ ] `POST /api/ai/ask` → ask AI agent

### 15. Benchmark
- [ ] `GET /api/benchmark` → calibration data
- [ ] `POST /api/benchmark/calibrate` → run calibration

### 16. Scheduler
- [ ] `POST /api/scheduler/daily` → trigger daily tasks
- [ ] `POST /api/scheduler/daily-nudges` → send nudges
- [ ] `POST /api/scheduler/weekly-reports` → generate reports
- [ ] `POST /api/scheduler/streak-check` → check streaks
- [ ] `POST /api/scheduler/sync-connections` → sync OAuth

### 17. Apply
- [ ] `POST /api/apply` → submit application

### 18. Whop (payment)
- [ ] `GET /api/whop/portal` → customer portal URL
- [ ] `POST /api/whop/checkout-url` → checkout URL

### 19. Leaderboard
- [ ] `GET /api/leaderboard` → team rankings

### 20. Frontend Pages
- [ ] `GET /` → index page loads
- [ ] `GET /login` → login page loads (check for QUICK LOGIN button)
- [ ] `GET /dashboard` → dashboard page loads (check JS console for errors)
- [ ] `GET /integrations` → integrations hub loads
- [ ] `GET /extensions` → extension download page loads
- [ ] `GET /connect` → OAuth connect page loads
- [ ] `GET /pricing` → pricing page loads
- [ ] `GET /challenges` → challenges page loads
- [ ] `GET /teams` → teams page loads
- [ ] `GET /evaluate` → evaluate page loads
- [ ] `GET /registration` → registration loads
- [ ] `GET /about` → about page loads
- [ ] `GET /contact` → contact page loads

## Error Handling Checks
- [ ] Hit any protected route without token → 401
- [ ] `POST /api/capture/interaction` with empty body → 400/422
- [ ] `POST /api/auth/login` with wrong password → 401
- [ ] `GET /api/nonexistent` → 404
- [ ] `POST /api/challenges/:nonexistent/submit` → 404

## Known Suspects (high-probability bugs)
- **Bypass login broken in production**: `test@isira.club` login returns `mock-token` but auth middleware rejects it when `NODE_ENV=production` — all API calls after bypass login get 401. Use Google OAuth instead.
- **Missing dashboard route**: No `backend/routes/dashboard.js` and no `app.use('/api/dashboard', ...)` in server.js. Frontend dashboard page will 404 on its data calls.
- **Register-company returns no token**: After registering, user gets an inviteCode but no auth token — they have to login separately.
- **No `/api/capture/activity`**: The frontend might call this but only `/api/capture/events` exists.
- **No `/api/teams` route**: Teams page at `/teams` exists but no backend route.

## Report Format

For each endpoint, output a row in this table:

| # | Route | Method | Status (✅/⚠️/❌/⏭️) | Status Code | Notes |
|---|-------|--------|---------------------|-------------|-------|
| 1 | /api/auth/login | POST | ✅ PASS | 200 | Returns token + user |
| 2 | /api/auth/me | GET | ❌ FAIL | 401 | mock-token rejected in production |

Also write a **"Critical Bugs"** section at the top listing the most urgent issues with file paths and line numbers.

## Verification approach

```bash
curl -s -w "\n%{http_code}" -X POST https://argen.isira.club/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@isira.club","password":"testaccount"}'
```

Extract the token and use it for authenticated calls:

```bash
TOKEN="<token from login>"
curl -s -w "\n%{http_code}" https://argen.isira.club/api/proxy/stats \
  -H "Authorization: Bearer $TOKEN"
```
