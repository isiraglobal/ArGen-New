# Graph Report - ArGen - New Look  (2026-06-18)

## Corpus Check
- 60 files · ~142,264 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 564 nodes · 696 edges · 48 communities (35 shown, 13 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 3 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `148d7ee6`
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

## God Nodes (most connected - your core abstractions)
1. `dependencies` - 15 edges
2. `protect()` - 14 edges
3. `dependencies` - 14 edges
4. `ArGen Platform — Project Context for AI Agents` - 13 edges
5. `ArGen Environment Variables` - 11 edges
6. `initAll()` - 10 edges
7. `syncUsage()` - 9 edges
8. `initAdminDashboard()` - 9 edges
9. `createEmailTemplate()` - 9 edges
10. `authorize()` - 8 edges

## Surprising Connections (you probably didn't know these)
- `runTest()` --calls--> `scoreResponse()`  [EXTRACTED]
  test-flow.js → backend/utils/ai-agents.js
- `runTest()` --calls--> `generateWeeklyReport()`  [EXTRACTED]
  test-flow.js → backend/utils/ai-agents.js
- `runTest()` --calls--> `generateCoachingNudge()`  [EXTRACTED]
  test-flow.js → backend/utils/ai-agents.js
- `handleDailyCycle()` --calls--> `syncAllConnections()`  [INFERRED]
  backend/routes/scheduler.js → backend/utils/ai-providers.js
- `handleSyncConnections()` --calls--> `syncAllConnections()`  [INFERRED]
  backend/routes/scheduler.js → backend/utils/ai-providers.js

## Communities (48 total, 13 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.21
Nodes (16): API_KEY_PROVIDERS, { db }, exchangeCode(), getOrgId(), httpGet(), httpPost(), markConnectionError(), OAUTH_CONFIGS (+8 more)

### Community 2 - "Community 2"
Cohesion: 0.11
Nodes (24): AI_CONFIG, bootLines, chatHistory, COLORS, initAccordions(), initAiBar(), initAll(), initAuthUI() (+16 more)

### Community 3 - "Community 3"
Cohesion: 0.07
Nodes (26): author, dependencies, bcryptjs, cors, dotenv, express, express-mongo-sanitize, express-rate-limit (+18 more)

### Community 4 - "Community 4"
Cohesion: 0.06
Nodes (31): dotenv, path, InvitationSchema, mongoose, { createEmailTemplate }, { db }, express, { generateWeeklyReport, generateCoachingNudge } (+23 more)

### Community 5 - "Community 5"
Cohesion: 0.08
Nodes (23): { auth, db, supabase }, bcrypt, company, companyData, { createEmailTemplate }, crypto, emailLower, existingData (+15 more)

### Community 6 - "Community 6"
Cohesion: 0.09
Nodes (21): fileStructure, backend, docs, frontend, css, html, images, js (+13 more)

### Community 7 - "Community 7"
Cohesion: 0.13
Nodes (19): { db }, runTest(), { scoreResponse, generateWeeklyReport, generateCoachingNudge }, express, { protect, authorize }, router, { runCalibration }, challenge (+11 more)

### Community 8 - "Community 8"
Cohesion: 0.32
Nodes (7): { auth, db }, authorize(), isApproved(), parseCookies(), protect(), requirePageAuth(), verifyTokenFromRequest()

### Community 9 - "Community 9"
Cohesion: 0.04
Nodes (44): adminRef, adminUsers, agentTokens, allDocs, allowed, allUsers, { auth, db }, calculatedSubtotal (+36 more)

### Community 10 - "Community 10"
Cohesion: 0.11
Nodes (18): dependencies, bcryptjs, cors, dotenv, express, express-mongo-sanitize, express-rate-limit, firebase (+10 more)

### Community 11 - "Community 11"
Cohesion: 0.16
Nodes (16): checkFlaggedSubmissions(), distributeOpsPanels(), initAdminDashboard(), initMemberDashboard(), loadAIIntelligence(), loadDashboardInvoices(), renderAdminLeaderboard(), renderAdminStats() (+8 more)

### Community 12 - "Community 12"
Cohesion: 0.11
Nodes (18): 🤖 5 AI Agents (backend/utils/ai-agents.js), 🔌 API Base URL Resolution, 🏗️ Architecture Overview, ArGen Platform — Project Context for AI Agents, code:block1 (ArGen - New Look/), code:block2 (/graphify query "how does scoring work"), code:bash (GEMINI_API_KEY=<YOUR_GEMINI_API_KEY> graphify extract . --ba), 🗄️ Database (+10 more)

### Community 13 - "Community 13"
Cohesion: 0.1
Nodes (19): app, allowedOrigins, app, { contactRules, handleValidationErrors }, cors, { db }, dotenv, express (+11 more)

### Community 14 - "Community 14"
Cohesion: 0.14
Nodes (12): isOnboardingPath, isProtected, isSuperadminPath, memberPaths, onboardingPaths, superadminPaths, teamadminPaths, token (+4 more)

### Community 15 - "Community 15"
Cohesion: 0.33
Nodes (4): dotenv, mongoose, path, User

### Community 16 - "Community 16"
Cohesion: 0.4
Nodes (4): crons, name, rewrites, version

### Community 17 - "Community 17"
Cohesion: 0.5
Nodes (3): decoded, jwt, token

### Community 18 - "Community 18"
Cohesion: 0.25
Nodes (6): api, API_BASE_URL, closeBtn, container, lower, toast

### Community 19 - "Community 19"
Cohesion: 0.5
Nodes (3): dotenv, mongoose, path

### Community 27 - "Community 27"
Cohesion: 0.12
Nodes (15): data, { db }, dims, express, longestStreak, minIndex, { protect, isApproved, authorize }, responseData (+7 more)

### Community 28 - "Community 28"
Cohesion: 0.4
Nodes (4): btn, msg, params, token

### Community 30 - "Community 30"
Cohesion: 0.08
Nodes (17): { db }, activeUsers, byDay, byProvider, d, { db }, express, { protect } (+9 more)

### Community 31 - "Community 31"
Cohesion: 0.17
Nodes (11): Admin Bypass, AI Models (Scoring Agents), ArGen Environment Variables, Core, Database Migration, Email, Google OAuth (User Login via Supabase), Google Workspace Admin (AI Usage Connector) (+3 more)

### Community 32 - "Community 32"
Cohesion: 0.29
Nodes (6): admin, fs, path, queryStub, serviceAccount, serviceAccountPath

### Community 34 - "Community 34"
Cohesion: 0.4
Nodes (4): app, auth, firebaseConfig, googleProvider

### Community 35 - "Community 35"
Cohesion: 0.17
Nodes (11): day, { db }, express, finalLeaderboard, now, { protect, isApproved }, router, startOfWeek (+3 more)

### Community 41 - "Community 41"
Cohesion: 0.05
Nodes (31): bcrypt, Company, dotenv, jwt, mongoose, path, User, CompanySchema (+23 more)

### Community 42 - "Community 42"
Cohesion: 0.18
Nodes (10): allowed, data, { db }, departments, departmentsMap, employees, express, { protect, authorize, isApproved } (+2 more)

### Community 43 - "Community 43"
Cohesion: 0.42
Nodes (8): allProviders, apiKeyProviders, connect(), disconnect(), loadConnections(), oauthProviders, showAlert(), syncProvider()

### Community 44 - "Community 44"
Cohesion: 0.22
Nodes (8): { accessToken }, authUrl, data, { db }, express, { protect, authorize }, providers, router

### Community 45 - "Community 45"
Cohesion: 0.14
Nodes (11): ChallengeSchema, mongoose, mongoose, ResponseSchema, challenges, challengesRef, { db }, express (+3 more)

### Community 46 - "Community 46"
Cohesion: 0.5
Nodes (4): createTeamCode(), createUniqueTeamCode(), isTeamCodeAvailable(), limit

## Knowledge Gaps
- **381 isolated node(s):** `express`, `router`, `{ auth, db }`, `{ protect, authorize }`, `crypto` (+376 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **13 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `protect()` connect `Community 8` to `Community 35`, `Community 4`, `Community 5`, `Community 7`, `Community 9`, `Community 41`, `Community 42`, `Community 44`, `Community 45`, `Community 27`, `Community 30`?**
  _High betweenness centrality (0.030) - this node is a cross-community bridge._
- **Why does `sendEmail()` connect `Community 4` to `Community 9`, `Community 5`?**
  _High betweenness centrality (0.014) - this node is a cross-community bridge._
- **What connects `express`, `router`, `{ auth, db }` to the rest of the system?**
  _381 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.11 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.07 - nodes in this community are weakly interconnected._
- **Should `Community 4` be split into smaller, more focused modules?**
  _Cohesion score 0.06 - nodes in this community are weakly interconnected._
- **Should `Community 5` be split into smaller, more focused modules?**
  _Cohesion score 0.08 - nodes in this community are weakly interconnected._