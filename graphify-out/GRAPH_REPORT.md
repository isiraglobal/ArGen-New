# Graph Report - ArGen - New Look  (2026-06-22)

## Corpus Check
- 100 files · ~173,117 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1137 nodes · 1356 edges · 87 communities (64 shown, 23 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 3 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `b0d21009`
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
- [[_COMMUNITY_Community 52|Community 52]]
- [[_COMMUNITY_Community 53|Community 53]]
- [[_COMMUNITY_Community 54|Community 54]]
- [[_COMMUNITY_Community 55|Community 55]]
- [[_COMMUNITY_Community 56|Community 56]]
- [[_COMMUNITY_Community 57|Community 57]]
- [[_COMMUNITY_Community 58|Community 58]]
- [[_COMMUNITY_Community 59|Community 59]]
- [[_COMMUNITY_Community 60|Community 60]]
- [[_COMMUNITY_Community 61|Community 61]]
- [[_COMMUNITY_Community 62|Community 62]]
- [[_COMMUNITY_Community 63|Community 63]]
- [[_COMMUNITY_Community 64|Community 64]]
- [[_COMMUNITY_Community 65|Community 65]]
- [[_COMMUNITY_Community 66|Community 66]]
- [[_COMMUNITY_Community 67|Community 67]]
- [[_COMMUNITY_Community 68|Community 68]]
- [[_COMMUNITY_Community 69|Community 69]]
- [[_COMMUNITY_Community 70|Community 70]]
- [[_COMMUNITY_Community 71|Community 71]]
- [[_COMMUNITY_Community 72|Community 72]]
- [[_COMMUNITY_Community 73|Community 73]]
- [[_COMMUNITY_Community 74|Community 74]]
- [[_COMMUNITY_Community 76|Community 76]]
- [[_COMMUNITY_Community 77|Community 77]]
- [[_COMMUNITY_Community 80|Community 80]]
- [[_COMMUNITY_Community 82|Community 82]]
- [[_COMMUNITY_Community 83|Community 83]]
- [[_COMMUNITY_Community 84|Community 84]]
- [[_COMMUNITY_Community 85|Community 85]]
- [[_COMMUNITY_Community 86|Community 86]]
- [[_COMMUNITY_Community 87|Community 87]]
- [[_COMMUNITY_Community 88|Community 88]]
- [[_COMMUNITY_Community 89|Community 89]]
- [[_COMMUNITY_Community 90|Community 90]]

## God Nodes (most connected - your core abstractions)
1. `What To Test (hit every endpoint)` - 22 edges
2. `protect()` - 19 edges
3. `ArGen Platform — Project Context for AI Agents` - 14 edges
4. `authorize()` - 12 edges
5. `initAdminDashboard()` - 12 edges
6. `dependencies` - 12 edges
7. `dependencies` - 12 edges
8. `ArGenDetector` - 11 edges
9. `ArGen Environment Variables` - 11 edges
10. `$()` - 10 edges

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

## Communities (87 total, 23 thin omitted)

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
Cohesion: 0.05
Nodes (35): { auth, db }, autoPassword, bcrypt, callerEmail, company, companyData, { createEmailTemplate }, crypto (+27 more)

### Community 6 - "Community 6"
Cohesion: 0.09
Nodes (21): fileStructure, backend, docs, frontend, css, html, images, js (+13 more)

### Community 7 - "Community 7"
Cohesion: 0.08
Nodes (24): action, default_icon, default_popup, default_title, author, background, service_worker, type (+16 more)

### Community 8 - "Community 8"
Cohesion: 0.05
Nodes (36): dotenv, path, CompanySchema, mongoose, application, { createEmailTemplate }, { db }, embed (+28 more)

### Community 9 - "Community 9"
Cohesion: 0.04
Nodes (46): adminRef, adminUsers, agentTokens, allDocs, allowed, allUsers, { auth, db }, calculatedSubtotal (+38 more)

### Community 10 - "Community 10"
Cohesion: 0.1
Nodes (20): dependencies, bcryptjs, cors, dotenv, express, express-rate-limit, express-validator, firebase-admin (+12 more)

### Community 11 - "Community 11"
Cohesion: 0.12
Nodes (29): $(), adminSection, checkFlaggedSubmissions(), copyInviteCode(), distributeOpsPanels(), generatePDFReport(), hideLoading(), initAdminDashboard() (+21 more)

### Community 12 - "Community 12"
Cohesion: 0.1
Nodes (19): 🤖 5 AI Agents (backend/utils/ai-agents.js), 🔌 API Base URL Resolution, 🏗️ Architecture Overview, ArGen Platform — Project Context for AI Agents, code:block1 (ArGen - New Look/), code:block2 (/graphify query "how does scoring work"), code:bash (GEMINI_API_KEY=<YOUR_GEMINI_API_KEY> graphify extract . --ba), 🟢 Current System Status (+11 more)

### Community 13 - "Community 13"
Cohesion: 0.16
Nodes (21): allowedOrigins, app, { contactRules, handleValidationErrors }, cors, criticalEnv, { db }, dotenv, express (+13 more)

### Community 14 - "Community 14"
Cohesion: 0.11
Nodes (16): isAdminPath, isOnboardingPath, isProtected, isSuperadminPath, memberPaths, onboardingPaths, regularToken, regularUser (+8 more)

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
Cohesion: 0.17
Nodes (11): activeUsers, byDay, byProvider, d, { db }, express, { protect }, router (+3 more)

### Community 31 - "Community 31"
Cohesion: 0.17
Nodes (11): Admin Bypass, AI Models (Scoring Agents), ArGen Environment Variables, Core, Database Migration, Email, Google OAuth (User Login via Supabase), Google Workspace Admin (AI Usage Connector) (+3 more)

### Community 32 - "Community 32"
Cohesion: 0.05
Nodes (42): checkBillingLimit(), { db }, getBillingInfo(), getCurrentCycleCount(), getNextMonthStart(), PLAN_LIMITS, dailyCounts, data (+34 more)

### Community 34 - "Community 34"
Cohesion: 0.4
Nodes (4): app, auth, firebaseConfig, googleProvider

### Community 35 - "Community 35"
Cohesion: 0.09
Nodes (21): analyses, { analyzeCaptureData }, companyConfig, config, data, { db }, downloadMap, events (+13 more)

### Community 42 - "Community 42"
Cohesion: 0.05
Nodes (38): activationEvents, default, description, type, default, description, type, default (+30 more)

### Community 43 - "Community 43"
Cohesion: 0.42
Nodes (8): allProviders, apiKeyProviders, connect(), disconnect(), loadConnections(), oauthProviders, showAlert(), syncProvider()

### Community 44 - "Community 44"
Cohesion: 0.15
Nodes (12): accessToken, authUrl, crypto, data, { db }, express, { protect, authorize }, providers (+4 more)

### Community 45 - "Community 45"
Cohesion: 0.17
Nodes (11): auth_provider_x509_cert_url, auth_uri, client_email, client_id, client_x509_cert_url, private_key, private_key_id, project_id (+3 more)

### Community 46 - "Community 46"
Cohesion: 0.5
Nodes (4): createTeamCode(), createUniqueTeamCode(), isTeamCodeAvailable(), limit

### Community 48 - "Community 48"
Cohesion: 0.06
Nodes (30): 10. Challenges, 11. Evaluations, 12. Responses, 13. Analytics, 14. AI, 15. Benchmark, 16. Scheduler, 17. Apply (+22 more)

### Community 49 - "Community 49"
Cohesion: 0.17
Nodes (11): isApproved(), allowed, data, { db }, departments, departmentsMap, employees, express (+3 more)

### Community 50 - "Community 50"
Cohesion: 0.2
Nodes (8): crypto, data, { db }, express, key, keys, { protect, authorize }, router

### Community 52 - "Community 52"
Cohesion: 0.09
Nodes (18): apiKeyInput, flushBtn, formatNumber(), key, lastFlushEl, openDashboard, openDashboardFooter, queueCountEl (+10 more)

### Community 53 - "Community 53"
Cohesion: 0.08
Nodes (23): author, background, persistent, scripts, browser_action, default_icon, default_popup, default_title (+15 more)

### Community 54 - "Community 54"
Cohesion: 0.08
Nodes (23): d, dailyRef, { db }, { decrypt }, estimateTokens(), express, getTotalInputTokens(), inputCost (+15 more)

### Community 55 - "Community 55"
Cohesion: 0.23
Nodes (12): buildPayload(), eventQueue, flushQueue(), generateId(), getSettings(), getStatus(), handleCapturedInteraction(), postWithRetry() (+4 more)

### Community 56 - "Community 56"
Cohesion: 0.13
Nodes (13): mongoose, ResponseSchema, day, { db }, express, finalLeaderboard, now, { protect, isApproved } (+5 more)

### Community 58 - "Community 58"
Cohesion: 0.15
Nodes (10): ChallengeSchema, mongoose, { body, validationResult }, challenges, challengesRef, { db }, express, { protect } (+2 more)

### Community 59 - "Community 59"
Cohesion: 0.28
Nodes (8): buildChrome(), buildFirefox(), copyDir(), DIST, { execSync }, fs, path, SRC

### Community 61 - "Community 61"
Cohesion: 0.25
Nodes (4): { db }, { createClient }, dotenv, path

### Community 62 - "Community 62"
Cohesion: 0.29
Nodes (4): detectModel(), extractLastExchange(), script, SELECTORS

### Community 68 - "Community 68"
Cohesion: 0.67
Nodes (3): cloned, notifyTokenData(), parseStreamingResponse()

### Community 69 - "Community 69"
Cohesion: 0.08
Nodes (23): action, default_icon, default_popup, default_title, background, service_worker, type, content_scripts (+15 more)

### Community 71 - "Community 71"
Cohesion: 0.12
Nodes (16): challengeIds, challengePromises, company, { createEmailTemplate }, data, { db }, evaluationData, evaluations (+8 more)

### Community 72 - "Community 72"
Cohesion: 0.12
Nodes (15): data, { db }, dims, express, longestStreak, minIndex, { protect, isApproved, authorize }, responseData (+7 more)

### Community 73 - "Community 73"
Cohesion: 0.14
Nodes (13): apiKey, apiKeyInput, apiUrlInput, captureCount, captureNowBtn, currentSite, errorMsg, openDashboardBtn (+5 more)

### Community 74 - "Community 74"
Cohesion: 0.17
Nodes (11): API Endpoints, ArGen VS Code Extension, Auto-Capture, code:bash (# Install dependencies), Development, Disable Auto-Capture, Features, Installation (+3 more)

### Community 76 - "Community 76"
Cohesion: 0.2
Nodes (9): API Key, Architecture, ArGen Browser Extension (Manifest V3), code:block1 (popup.html/js ──→ chrome.storage.sync ←── background.js (ser), How It Works, Installation (Developer Mode), License, Permissions (+1 more)

### Community 77 - "Community 77"
Cohesion: 0.24
Nodes (6): captureInteraction(), generateSessionId(), http, https, postToArGen(), vscode

### Community 80 - "Community 80"
Cohesion: 0.38
Nodes (5): captureConversationTurn(), CHATGPT_SELECTORS, extractModelInfo(), observer, sendToArGen()

### Community 83 - "Community 83"
Cohesion: 0.47
Nodes (5): captureGeneric(), detectPlatform(), observer, PLATFORM_RULES, sendToArGen()

### Community 84 - "Community 84"
Cohesion: 0.67
Nodes (3): extractMessages(), observer, sendToArGen()

### Community 85 - "Community 85"
Cohesion: 0.11
Nodes (14): bcrypt, Company, dotenv, jwt, mongoose, path, User, bcrypt (+6 more)

### Community 86 - "Community 86"
Cohesion: 0.38
Nodes (6): http, httpRequest(), https, logResult(), RESULTS, testAll()

### Community 87 - "Community 87"
Cohesion: 0.53
Nodes (5): buildStats(), createBatch(), path, printStats(), seed()

### Community 88 - "Community 88"
Cohesion: 0.18
Nodes (20): { db }, runTest(), { scoreResponse, generateWeeklyReport, generateCoachingNudge }, analyzeCaptureData(), callAnthropic(), callGemini(), callNvidia(), callOpenAI() (+12 more)

### Community 89 - "Community 89"
Cohesion: 0.23
Nodes (10): { auth, db }, authorize(), jwt, parseCookies(), protect(), verifyTokenFromRequest(), express, { protect, authorize } (+2 more)

### Community 90 - "Community 90"
Cohesion: 0.2
Nodes (9): { body, validationResult }, challengeRules, contactRules, evaluationRules, handleValidationErrors(), invoiceRules, loginRules, registerRules (+1 more)

## Knowledge Gaps
- **715 isolated node(s):** `Login Credentials`, `1. Auth`, `2. API Keys`, `3. Capture API (core)`, `4. Warehouse` (+710 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **23 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `protect()` connect `Community 89` to `Community 32`, `Community 35`, `Community 4`, `Community 5`, `Community 71`, `Community 8`, `Community 9`, `Community 72`, `Community 44`, `Community 49`, `Community 50`, `Community 54`, `Community 56`, `Community 58`, `Community 30`?**
  _High betweenness centrality (0.036) - this node is a cross-community bridge._
- **Why does `authorize()` connect `Community 89` to `Community 32`, `Community 35`, `Community 4`, `Community 71`, `Community 72`, `Community 9`, `Community 8`, `Community 44`, `Community 49`, `Community 50`?**
  _High betweenness centrality (0.010) - this node is a cross-community bridge._
- **Why does `createEmailTemplate()` connect `Community 8` to `Community 9`, `Community 5`, `Community 71`?**
  _High betweenness centrality (0.006) - this node is a cross-community bridge._
- **What connects `Login Credentials`, `1. Auth`, `2. API Keys` to the rest of the system?**
  _715 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.14 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.11 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.08 - nodes in this community are weakly interconnected._