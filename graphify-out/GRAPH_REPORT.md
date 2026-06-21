# Graph Report - ArGen - New Look  (2026-06-22)

## Corpus Check
- 70 files · ~152,151 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 714 nodes · 907 edges · 52 communities (38 shown, 14 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 3 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `9225e576`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 47|Community 47]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Community 49|Community 49]]
- [[_COMMUNITY_Community 50|Community 50]]
- [[_COMMUNITY_Community 51|Community 51]]

## God Nodes (most connected - your core abstractions)
1. `protect()` - 16 edges
2. `ArGen Platform — Project Context for AI Agents` - 14 edges
3. `dependencies` - 12 edges
4. `dependencies` - 12 edges
5. `initAdminDashboard()` - 11 edges
6. `ArGen Environment Variables` - 11 edges
7. `authorize()` - 10 edges
8. `$()` - 10 edges
9. `initAll()` - 10 edges
10. `createEmailTemplate()` - 10 edges

## Surprising Connections (you probably didn't know these)
- `handleDailyCycle()` --calls--> `syncAllConnections()`  [INFERRED]
  backend/routes/scheduler.js → backend/utils/ai-providers.js
- `handleSyncConnections()` --calls--> `syncAllConnections()`  [INFERRED]
  backend/routes/scheduler.js → backend/utils/ai-providers.js
- `runTest()` --calls--> `scoreResponse()`  [EXTRACTED]
  test-flow.js → backend/utils/ai-agents.js
- `runTest()` --calls--> `generateWeeklyReport()`  [EXTRACTED]
  test-flow.js → backend/utils/ai-agents.js
- `runTest()` --calls--> `generateCoachingNudge()`  [EXTRACTED]
  test-flow.js → backend/utils/ai-agents.js

## Communities (52 total, 14 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.14
Nodes (21): handleDailyCycle(), handleSyncConnections(), API_KEY_PROVIDERS, crypto, { db }, decrypt(), exchangeCode(), getOrgId() (+13 more)

### Community 2 - "Community 2"
Cohesion: 0.11
Nodes (24): AI_CONFIG, bootLines, chatHistory, COLORS, initAccordions(), initAiBar(), initAll(), initAuthUI() (+16 more)

### Community 3 - "Community 3"
Cohesion: 0.08
Nodes (24): author, dependencies, bcryptjs, cors, dotenv, express, express-rate-limit, express-validator (+16 more)

### Community 4 - "Community 4"
Cohesion: 0.08
Nodes (25): benchmarks, byDepartment, byIntent, byUser, d, dailyTrend, { db }, departments (+17 more)

### Community 5 - "Community 5"
Cohesion: 0.06
Nodes (31): InvitationSchema, mongoose, { auth, db }, autoPassword, bcrypt, company, companyData, { createEmailTemplate } (+23 more)

### Community 6 - "Community 6"
Cohesion: 0.09
Nodes (21): fileStructure, backend, docs, frontend, css, html, images, js (+13 more)

### Community 7 - "Community 7"
Cohesion: 0.07
Nodes (39): { db }, runTest(), { scoreResponse, generateWeeklyReport, generateCoachingNudge }, ChallengeSchema, mongoose, mongoose, ResponseSchema, challenge (+31 more)

### Community 8 - "Community 8"
Cohesion: 0.06
Nodes (28): dotenv, path, CompanySchema, mongoose, { createEmailTemplate }, { db }, express, { generateWeeklyReport, generateCoachingNudge } (+20 more)

### Community 9 - "Community 9"
Cohesion: 0.04
Nodes (45): adminRef, adminUsers, agentTokens, allDocs, allowed, allUsers, { auth, db }, calculatedSubtotal (+37 more)

### Community 10 - "Community 10"
Cohesion: 0.11
Nodes (18): dependencies, bcryptjs, cors, dotenv, express, express-rate-limit, express-validator, firebase-admin (+10 more)

### Community 11 - "Community 11"
Cohesion: 0.13
Nodes (28): $(), adminSection, checkFlaggedSubmissions(), copyInviteCode(), distributeOpsPanels(), generatePDFReport(), hideLoading(), initAdminDashboard() (+20 more)

### Community 12 - "Community 12"
Cohesion: 0.1
Nodes (19): 🤖 5 AI Agents (backend/utils/ai-agents.js), 🔌 API Base URL Resolution, 🏗️ Architecture Overview, ArGen Platform — Project Context for AI Agents, code:block1 (ArGen - New Look/), code:block2 (/graphify query "how does scoring work"), code:bash (GEMINI_API_KEY=<YOUR_GEMINI_API_KEY> graphify extract . --ba), 🟢 Current System Status (+11 more)

### Community 13 - "Community 13"
Cohesion: 0.15
Nodes (23): allowedOrigins, app, { contactRules, handleValidationErrors }, cors, { db }, dotenv, express, frontendDir (+15 more)

### Community 14 - "Community 14"
Cohesion: 0.14
Nodes (12): isOnboardingPath, isProtected, isSuperadminPath, memberPaths, onboardingPaths, superadminPaths, teamadminPaths, token (+4 more)

### Community 15 - "Community 15"
Cohesion: 0.33
Nodes (4): dotenv, mongoose, path, User

### Community 16 - "Community 16"
Cohesion: 0.33
Nodes (5): crons, headers, name, rewrites, version

### Community 17 - "Community 17"
Cohesion: 0.5
Nodes (3): decoded, jwt, token

### Community 18 - "Community 18"
Cohesion: 0.25
Nodes (6): api, API_BASE_URL, closeBtn, container, lower, toast

### Community 19 - "Community 19"
Cohesion: 0.5
Nodes (3): dotenv, mongoose, path

### Community 22 - "Community 22"
Cohesion: 0.26
Nodes (10): aiLimiter, Anthropic, express, fullMessages, geminiBody, providers, rateLimit, router (+2 more)

### Community 27 - "Community 27"
Cohesion: 0.08
Nodes (24): port, emulators, auth, firestore, functions, hosting, pubsub, ui (+16 more)

### Community 28 - "Community 28"
Cohesion: 0.4
Nodes (4): btn, msg, params, token

### Community 30 - "Community 30"
Cohesion: 0.06
Nodes (25): { db }, activeUsers, byDay, byProvider, d, { db }, express, { protect } (+17 more)

### Community 31 - "Community 31"
Cohesion: 0.17
Nodes (11): Admin Bypass, AI Models (Scoring Agents), ArGen Environment Variables, Core, Database Migration, Email, Google OAuth (User Login via Supabase), Google Workspace Admin (AI Usage Connector) (+3 more)

### Community 32 - "Community 32"
Cohesion: 0.1
Nodes (18): aggUpdates, batch, { db }, endTime, event, events, express, limit (+10 more)

### Community 34 - "Community 34"
Cohesion: 0.4
Nodes (4): app, auth, firebaseConfig, googleProvider

### Community 35 - "Community 35"
Cohesion: 0.12
Nodes (15): challengeIds, challengePromises, company, { createEmailTemplate }, data, { db }, evaluationData, evaluations (+7 more)

### Community 42 - "Community 42"
Cohesion: 0.06
Nodes (25): bcrypt, Company, dotenv, jwt, mongoose, path, User, bcrypt (+17 more)

### Community 43 - "Community 43"
Cohesion: 0.42
Nodes (8): allProviders, apiKeyProviders, connect(), disconnect(), loadConnections(), oauthProviders, showAlert(), syncProvider()

### Community 44 - "Community 44"
Cohesion: 0.07
Nodes (27): application, { createEmailTemplate }, { db }, embed, express, html, router, sendEmail (+19 more)

### Community 45 - "Community 45"
Cohesion: 0.17
Nodes (11): auth_provider_x509_cert_url, auth_uri, client_email, client_id, client_x509_cert_url, private_key, private_key_id, project_id (+3 more)

### Community 46 - "Community 46"
Cohesion: 0.5
Nodes (4): createTeamCode(), createUniqueTeamCode(), isTeamCodeAvailable(), limit

### Community 48 - "Community 48"
Cohesion: 0.23
Nodes (10): { auth, db }, authorize(), isApproved(), parseCookies(), protect(), verifyTokenFromRequest(), express, { protect, authorize } (+2 more)

### Community 49 - "Community 49"
Cohesion: 0.18
Nodes (10): allowed, data, { db }, departments, departmentsMap, employees, express, { protect, authorize, isApproved } (+2 more)

### Community 50 - "Community 50"
Cohesion: 0.2
Nodes (8): crypto, data, { db }, express, key, keys, { protect, authorize }, router

## Knowledge Gaps
- **467 isolated node(s):** `🎯 What Is ArGen?`, `code:block1 (ArGen - New Look/)`, `🧠 User Roles`, `🔌 API Base URL Resolution`, `🗄️ Database` (+462 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **14 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `protect()` connect `Community 48` to `Community 35`, `Community 4`, `Community 5`, `Community 7`, `Community 8`, `Community 9`, `Community 42`, `Community 44`, `Community 49`, `Community 50`, `Community 30`?**
  _High betweenness centrality (0.028) - this node is a cross-community bridge._
- **Why does `authorize()` connect `Community 48` to `Community 35`, `Community 4`, `Community 7`, `Community 8`, `Community 9`, `Community 44`, `Community 49`, `Community 50`?**
  _High betweenness centrality (0.011) - this node is a cross-community bridge._
- **What connects `🎯 What Is ArGen?`, `code:block1 (ArGen - New Look/)`, `🧠 User Roles` to the rest of the system?**
  _467 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.14 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.11 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.08 - nodes in this community are weakly interconnected._
- **Should `Community 4` be split into smaller, more focused modules?**
  _Cohesion score 0.08 - nodes in this community are weakly interconnected._