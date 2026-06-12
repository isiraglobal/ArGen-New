# Graph Report - ArGen - New Look  (2026-06-13)

## Corpus Check
- 67 files · ~117,882 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 439 nodes · 529 edges · 37 communities (26 shown, 11 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `7407d0db`
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
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]

## God Nodes (most connected - your core abstractions)
1. `dependencies` - 15 edges
2. `dependencies` - 14 edges
3. `ArGen Platform — Project Context for AI Agents` - 13 edges
4. `protect()` - 11 edges
5. `initAll()` - 10 edges
6. `createEmailTemplate()` - 9 edges
7. `scoreResponse()` - 8 edges
8. `SupabaseCollectionRef` - 8 edges
9. `sendEmail()` - 8 edges
10. `fallbackAiCall()` - 7 edges

## Surprising Connections (you probably didn't know these)
- `handleMembershipValid()` --calls--> `generateWelcomeEmail()`  [INFERRED]
  backend/routes/whop.js → backend/utils/emailTemplates.js
- `runTest()` --calls--> `scoreResponse()`  [EXTRACTED]
  test-flow.js → backend/utils/ai-agents.js
- `runTest()` --calls--> `generateWeeklyReport()`  [EXTRACTED]
  test-flow.js → backend/utils/ai-agents.js
- `runTest()` --calls--> `generateCoachingNudge()`  [EXTRACTED]
  test-flow.js → backend/utils/ai-agents.js
- `generatePasswordCodeEmail()` --calls--> `createEmailTemplate()`  [EXTRACTED]
  backend/utils/emailTemplates.js → backend/utils/emailTemplate.js

## Communities (37 total, 11 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.14
Nodes (12): { createEmailTemplate }, { db }, express, { generateWeeklyReport, generateCoachingNudge }, { protect, authorize }, router, sendEmail, createEmailTemplate() (+4 more)

### Community 2 - "Community 2"
Cohesion: 0.11
Nodes (24): AI_CONFIG, bootLines, chatHistory, COLORS, initAccordions(), initAiBar(), initAll(), initAuthUI() (+16 more)

### Community 3 - "Community 3"
Cohesion: 0.07
Nodes (26): author, dependencies, bcryptjs, cors, dotenv, express, express-mongo-sanitize, express-rate-limit (+18 more)

### Community 4 - "Community 4"
Cohesion: 0.1
Nodes (16): dotenv, path, InvitationSchema, mongoose, { createEmailTemplate }, crypto, { db }, expectedSignature (+8 more)

### Community 5 - "Community 5"
Cohesion: 0.09
Nodes (20): { auth, db, supabase }, bcrypt, company, companyData, { createEmailTemplate }, crypto, emailLower, existingData (+12 more)

### Community 6 - "Community 6"
Cohesion: 0.09
Nodes (21): fileStructure, backend, docs, frontend, css, html, images, js (+13 more)

### Community 7 - "Community 7"
Cohesion: 0.17
Nodes (15): { db }, runTest(), { scoreResponse, generateWeeklyReport, generateCoachingNudge }, challenge, { db }, fallbackAiCall(), generateChallenge(), generateCoachingNudge() (+7 more)

### Community 8 - "Community 8"
Cohesion: 0.09
Nodes (16): bcrypt, Company, dotenv, jwt, mongoose, path, User, CompanySchema (+8 more)

### Community 9 - "Community 9"
Cohesion: 0.05
Nodes (36): InvoiceSchema, mongoose, agentTokens, calculatedSubtotal, chartData, companies, company, companyRef (+28 more)

### Community 10 - "Community 10"
Cohesion: 0.11
Nodes (18): dependencies, bcryptjs, cors, dotenv, express, express-mongo-sanitize, express-rate-limit, firebase (+10 more)

### Community 11 - "Community 11"
Cohesion: 0.19
Nodes (12): checkFlaggedSubmissions(), initAdminDashboard(), initMemberDashboard(), loadDashboardInvoices(), renderAdminLeaderboard(), renderAdminStats(), renderCharts(), renderHeatmap() (+4 more)

### Community 12 - "Community 12"
Cohesion: 0.11
Nodes (18): 🤖 5 AI Agents (backend/utils/ai-agents.js), 🔌 API Base URL Resolution, 🏗️ Architecture Overview, ArGen Platform — Project Context for AI Agents, code:block1 (ArGen - New Look/), code:block2 (/graphify query "how does scoring work"), code:bash (GEMINI_API_KEY=<YOUR_GEMINI_API_KEY> graphify extract . --ba), 🗄️ Database (+10 more)

### Community 13 - "Community 13"
Cohesion: 0.09
Nodes (12): app, app, cors, { db }, dotenv, express, filePath, path (+4 more)

### Community 14 - "Community 14"
Cohesion: 0.22
Nodes (7): isProtected, isSuperadminPath, memberPaths, superadminPaths, teamadminPaths, token, userStr

### Community 15 - "Community 15"
Cohesion: 0.33
Nodes (4): dotenv, mongoose, path, User

### Community 16 - "Community 16"
Cohesion: 0.33
Nodes (5): crons, name, public, rewrites, version

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
Cohesion: 0.06
Nodes (35): { auth, db }, authorize(), isApproved(), parseCookies(), protect(), express, { protect, authorize }, router (+27 more)

### Community 28 - "Community 28"
Cohesion: 0.07
Nodes (26): ChallengeSchema, mongoose, mongoose, ResponseSchema, challenges, challengesRef, { db }, express (+18 more)

### Community 32 - "Community 32"
Cohesion: 0.29
Nodes (6): admin, fs, path, queryStub, serviceAccount, serviceAccountPath

### Community 34 - "Community 34"
Cohesion: 0.4
Nodes (4): app, auth, firebaseConfig, googleProvider

## Knowledge Gaps
- **302 isolated node(s):** `🎯 What Is ArGen?`, `code:block1 (ArGen - New Look/)`, `🧠 User Roles`, `🔌 API Base URL Resolution`, `🗄️ Database` (+297 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **11 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `protect()` connect `Community 27` to `Community 0`, `Community 4`, `Community 5`, `Community 9`, `Community 28`?**
  _High betweenness centrality (0.024) - this node is a cross-community bridge._
- **Why does `sendEmail()` connect `Community 4` to `Community 0`, `Community 9`, `Community 5`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **What connects `🎯 What Is ArGen?`, `code:block1 (ArGen - New Look/)`, `🧠 User Roles` to the rest of the system?**
  _302 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.14 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.11 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.07 - nodes in this community are weakly interconnected._
- **Should `Community 4` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._