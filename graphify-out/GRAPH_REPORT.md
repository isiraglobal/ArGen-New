# Graph Report - ArGen - New Look  (2026-05-18)

## Corpus Check
- 62 files · ~110,013 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 369 nodes · 451 edges · 27 communities (22 shown, 5 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `599b77b8`
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

## God Nodes (most connected - your core abstractions)
1. `ArGen Platform — Project Context for AI Agents` - 13 edges
2. `dependencies` - 12 edges
3. `dependencies` - 12 edges
4. `initAll()` - 10 edges
5. `protect()` - 9 edges
6. `scoreResponse()` - 8 edges
7. `sendEmail()` - 8 edges
8. `initAdminDashboard()` - 7 edges
9. `project` - 7 edges
10. `createEmailTemplate()` - 7 edges

## Surprising Connections (you probably didn't know these)
- `runTest()` --calls--> `scoreResponse()`  [EXTRACTED]
  test-flow.js → backend/utils/ai-agents.js
- `runTest()` --calls--> `generateCoachingNudge()`  [EXTRACTED]
  test-flow.js → backend/utils/ai-agents.js
- `runTest()` --calls--> `generateWeeklyReport()`  [EXTRACTED]
  test-flow.js → backend/utils/ai-agents.js
- `handleMembershipValid()` --calls--> `generateWelcomeEmail()`  [INFERRED]
  backend/routes/whop.js → backend/utils/emailTemplates.js
- `generatePasswordCodeEmail()` --calls--> `createEmailTemplate()`  [EXTRACTED]
  backend/utils/emailTemplates.js → backend/utils/emailTemplate.js

## Communities (27 total, 5 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.12
Nodes (18): Company, { createEmailTemplate }, express, { generateWeeklyReport, generateCoachingNudge }, html, { protect, authorize }, Response, router (+10 more)

### Community 1 - "Community 1"
Cohesion: 0.05
Nodes (45): authorize(), Company, isApproved(), jwt, protect(), ChallengeSchema, mongoose, EvaluationSchema (+37 more)

### Community 2 - "Community 2"
Cohesion: 0.11
Nodes (24): AI_CONFIG, bootLines, chatHistory, COLORS, initAccordions(), initAiBar(), initAll(), initAuthUI() (+16 more)

### Community 3 - "Community 3"
Cohesion: 0.08
Nodes (24): author, dependencies, bcryptjs, cors, dotenv, express, express-mongo-sanitize, express-rate-limit (+16 more)

### Community 4 - "Community 4"
Cohesion: 0.11
Nodes (16): dotenv, path, mongoose, subscriptionSchema, Company, crypto, expectedSignature, express (+8 more)

### Community 5 - "Community 5"
Cohesion: 0.1
Nodes (18): InvitationSchema, mongoose, bcrypt, Company, { createEmailTemplate }, crypto, express, html (+10 more)

### Community 6 - "Community 6"
Cohesion: 0.09
Nodes (21): fileStructure, backend, docs, frontend, css, html, images, js (+13 more)

### Community 7 - "Community 7"
Cohesion: 0.13
Nodes (20): Company, mongoose, Response, runTest(), { scoreResponse, generateWeeklyReport, generateCoachingNudge }, User, express, { protect, authorize } (+12 more)

### Community 8 - "Community 8"
Cohesion: 0.09
Nodes (16): bcrypt, Company, dotenv, jwt, mongoose, path, User, CompanySchema (+8 more)

### Community 9 - "Community 9"
Cohesion: 0.08
Nodes (24): InvoiceSchema, mongoose, mongoose, SystemMetricSchema, calculatedSubtotal, Company, { createEmailTemplate }, crypto (+16 more)

### Community 10 - "Community 10"
Cohesion: 0.12
Nodes (15): dependencies, bcryptjs, cors, dotenv, express, express-mongo-sanitize, express-rate-limit, helmet (+7 more)

### Community 11 - "Community 11"
Cohesion: 0.19
Nodes (12): checkFlaggedSubmissions(), initAdminDashboard(), initMemberDashboard(), loadDashboardInvoices(), renderAdminLeaderboard(), renderAdminStats(), renderCharts(), renderHeatmap() (+4 more)

### Community 12 - "Community 12"
Cohesion: 0.11
Nodes (18): 🤖 5 AI Agents (backend/utils/ai-agents.js), 🔌 API Base URL Resolution, 🏗️ Architecture Overview, ArGen Platform — Project Context for AI Agents, code:block1 (ArGen - New Look/), code:block2 (/graphify query "how does scoring work"), code:bash (GEMINI_API_KEY=<YOUR_GEMINI_API_KEY> graphify extract . --ba), 🗄️ Database (+10 more)

### Community 13 - "Community 13"
Cohesion: 0.18
Nodes (8): app, app, cors, dotenv, express, filePath, mongoose, path

### Community 14 - "Community 14"
Cohesion: 0.25
Nodes (7): isProtected, memberPaths, role, superadminPaths, teamadminPaths, token, userStr

### Community 15 - "Community 15"
Cohesion: 0.33
Nodes (4): dotenv, mongoose, path, User

### Community 16 - "Community 16"
Cohesion: 0.33
Nodes (5): headers, name, public, rewrites, version

### Community 17 - "Community 17"
Cohesion: 0.5
Nodes (3): decoded, jwt, token

### Community 19 - "Community 19"
Cohesion: 0.5
Nodes (3): dotenv, mongoose, path

## Knowledge Gaps
- **254 isolated node(s):** `🎯 What Is ArGen?`, `code:block1 (ArGen - New Look/)`, `🧠 User Roles`, `🔌 API Base URL Resolution`, `🗄️ Database` (+249 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `protect()` connect `Community 1` to `Community 0`, `Community 9`, `Community 5`, `Community 7`?**
  _High betweenness centrality (0.023) - this node is a cross-community bridge._
- **Why does `sendEmail()` connect `Community 4` to `Community 0`, `Community 9`, `Community 5`?**
  _High betweenness centrality (0.023) - this node is a cross-community bridge._
- **What connects `🎯 What Is ArGen?`, `code:block1 (ArGen - New Look/)`, `🧠 User Roles` to the rest of the system?**
  _254 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.12 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.05 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.11 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.08 - nodes in this community are weakly interconnected._