# ArGen Environment Variables

Set these in your local `.env` file and in the Vercel project dashboard under Settings → Environment Variables.

## Core

| Key | Purpose |
|-----|---------|
| `JWT_SECRET` | Legacy JWT signing (min 32 chars) |
| `NODE_ENV` | `production` or development |
| `CLIENT_URL` | Public app URL, e.g. `https://argen.isira.club` |
| `CRON_SECRET` | Bearer token for Vercel cron jobs (must match Authorization header) |

## Supabase

| Key | Purpose |
|-----|---------|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_ANON_KEY` | Public anon key (served via `/api/config`) |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key for backend DB access |

## AI Models (Scoring Agents)

| Key | Purpose |
|-----|---------|
| `NVIDIA_API_KEY` | NVIDIA NIM global fallback |
| `META_LLAMA_3_1_8B_INSTRUCT_API_KEY` | Llama 3.1 8B |
| `META_LLAMA_3_3_70B_INSTRUCT_API_KEY` | Llama 3.3 70B |
| `ANTHROPIC_API_KEY` | Claude fallback |
| `GEMINI_API_KEY` | Gemini fallback |
| `OPENAI_API_KEY` | OpenAI fallback |

## Google OAuth (User Login via Supabase)

Configure Google provider in Supabase Auth dashboard with redirect URL: `https://argen.isira.club/oauth`

| Key | Purpose |
|-----|---------|
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |

## Google Workspace Admin (AI Usage Connector)

Separate OAuth app for Workspace admin reports — used by `/api/connect/oauth/google`.

| Key | Purpose |
|-----|---------|
| `GOOGLE_WORKSPACE_CLIENT_ID` | Workspace OAuth client ID |
| `GOOGLE_WORKSPACE_CLIENT_SECRET` | Workspace OAuth client secret |
| `GOOGLE_WORKSPACE_REDIRECT_URI` | e.g. `https://argen.isira.club/api/connect/oauth/google/callback` |

## Microsoft (Copilot Usage Connector)

| Key | Purpose |
|-----|---------|
| `MICROSOFT_CLIENT_ID` | Azure app client ID |
| `MICROSOFT_CLIENT_SECRET` | Azure app client secret |
| `MICROSOFT_REDIRECT_URI` | e.g. `https://argen.isira.club/api/connect/oauth/microsoft/callback` |

## Payments (Whop)

| Key | Purpose |
|-----|---------|
| `WHOP_API_KEY` | Whop SDK API key |
| `WHOP_WEBHOOK_SECRET` | HMAC secret for webhook signature verification |
| `NEXT_PUBLIC_WHOP_APP_ID` | Whop app/company ID for checkout |

## Email

| Key | Purpose |
|-----|---------|
| `EMAIL_USER` | SMTP username |
| `EMAIL_PASS` | SMTP password / app password |

## Admin Bypass

| Key | Purpose |
|-----|---------|
| `ADMIN_EMAIL` | Superadmin login bypass email |
| `ADMIN_PASSWORD` | Superadmin login bypass password |

## Database Migration

After setting Supabase credentials, run the SQL in `backend/scripts/supabase-schema.sql` in the Supabase SQL Editor to create all required tables including `ai_connections`, `ai_usage_events`, `ai_usage_daily`, and `subscriptions`.
