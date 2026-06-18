-- ═══════════════════════════════════════════════════════════
-- ArGen - Supabase Schema
-- Run this in Supabase SQL Editor to add missing tables/columns
-- ═══════════════════════════════════════════════════════════

-- ── Applications (team signup form - NEW table) ──────────
CREATE TABLE IF NOT EXISTS applications (
  id text NOT NULL DEFAULT (gen_random_uuid())::text,
  name text NOT NULL,
  email text NOT NULL,
  company text NOT NULL,
  title text NOT NULL,
  teamSize text DEFAULT ''::text,
  website text DEFAULT ''::text,
  referral text DEFAULT ''::text,
  message text NOT NULL,
  status text DEFAULT 'new'::text,
  createdAt timestamp with time zone DEFAULT now(),
  CONSTRAINT applications_pkey PRIMARY KEY (id)
);

-- ── Contact Submissions (NEW table) ──────────────────────
CREATE TABLE IF NOT EXISTS contact_submissions (
  id text NOT NULL DEFAULT (gen_random_uuid())::text,
  name text,
  email text,
  subject text DEFAULT ''::text,
  message text,
  createdAt timestamp with time zone DEFAULT now(),
  CONSTRAINT contact_submissions_pkey PRIMARY KEY (id)
);

-- ── Oauth States (NEW table) ─────────────────────────────
CREATE TABLE IF NOT EXISTS oauth_states (
  id text NOT NULL DEFAULT (gen_random_uuid())::text,
  nonce text,
  provider text,
  createdAt timestamp with time zone DEFAULT now(),
  CONSTRAINT oauth_states_pkey PRIMARY KEY (id)
);

-- ═══════════════════════════════════════════════════════════
-- 🔧 ADD MISSING COLUMNS — covers pre-existing tables
--     and tables created by earlier schema versions
-- ═══════════════════════════════════════════════════════════
ALTER TABLE applications    ADD COLUMN IF NOT EXISTS "createdAt" timestamp with time zone DEFAULT now();
ALTER TABLE applications    ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'new'::text;
ALTER TABLE applications    ADD COLUMN IF NOT EXISTS "teamSize" text DEFAULT ''::text;
ALTER TABLE contact_submissions ADD COLUMN IF NOT EXISTS "createdAt" timestamp with time zone DEFAULT now();
ALTER TABLE contact_submissions ADD COLUMN IF NOT EXISTS "subject" text DEFAULT ''::text;
ALTER TABLE oauth_states    ADD COLUMN IF NOT EXISTS "createdAt" timestamp with time zone DEFAULT now();
ALTER TABLE companies        ADD COLUMN IF NOT EXISTS "domain" text;
ALTER TABLE companies        ADD COLUMN IF NOT EXISTS "seatLimit" integer DEFAULT 15;
ALTER TABLE users            ADD COLUMN IF NOT EXISTS "avatar" text DEFAULT ''::text;
ALTER TABLE users            ADD COLUMN IF NOT EXISTS "password" text;
ALTER TABLE users            ADD COLUMN IF NOT EXISTS "profileComplete" boolean DEFAULT false;
ALTER TABLE users            ADD COLUMN IF NOT EXISTS "profileStatus" text DEFAULT 'pending'::text;
ALTER TABLE users            ADD COLUMN IF NOT EXISTS "isApproved" boolean DEFAULT false;
ALTER TABLE users            ADD COLUMN IF NOT EXISTS "currentStreak" integer DEFAULT 0;
ALTER TABLE users            ADD COLUMN IF NOT EXISTS "employeeId" text DEFAULT ''::text;
ALTER TABLE users            ADD COLUMN IF NOT EXISTS "phone" text DEFAULT ''::text;
ALTER TABLE users            ADD COLUMN IF NOT EXISTS "jobRole" text DEFAULT ''::text;
ALTER TABLE responses        ADD COLUMN IF NOT EXISTS "companyId" text;
ALTER TABLE responses        ADD COLUMN IF NOT EXISTS "promptText" text DEFAULT ''::text;
ALTER TABLE responses        ADD COLUMN IF NOT EXISTS "modelOutput" text DEFAULT ''::text;
ALTER TABLE responses        ADD COLUMN IF NOT EXISTS "scores" jsonb DEFAULT '{}'::jsonb;
ALTER TABLE responses        ADD COLUMN IF NOT EXISTS "overallScore" numeric DEFAULT 0;
ALTER TABLE responses        ADD COLUMN IF NOT EXISTS "scoringStatus" text DEFAULT 'Pending'::text;
ALTER TABLE responses        ADD COLUMN IF NOT EXISTS "flags" jsonb DEFAULT '[]'::jsonb;
ALTER TABLE responses        ADD COLUMN IF NOT EXISTS "justification" text DEFAULT ''::text;
ALTER TABLE responses        ADD COLUMN IF NOT EXISTS "improvement" text DEFAULT ''::text;
ALTER TABLE responses        ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'Pending'::text;
ALTER TABLE evaluations      ADD COLUMN IF NOT EXISTS "companyId" text;
ALTER TABLE evaluations      ADD COLUMN IF NOT EXISTS "createdBy" text;
ALTER TABLE evaluations      ADD COLUMN IF NOT EXISTS "challengeCount" integer DEFAULT 0;
ALTER TABLE evaluations      ADD COLUMN IF NOT EXISTS "scoringAgentVersion" text DEFAULT ''::text;
ALTER TABLE challenges       ADD COLUMN IF NOT EXISTS "companyId" text;
ALTER TABLE challenges       ADD COLUMN IF NOT EXISTS "type" text DEFAULT ''::text;
ALTER TABLE challenges       ADD COLUMN IF NOT EXISTS "difficulty" text DEFAULT ''::text;
ALTER TABLE challenges       ADD COLUMN IF NOT EXISTS "text" text DEFAULT ''::text;
ALTER TABLE challenges       ADD COLUMN IF NOT EXISTS "wordLimit" integer DEFAULT 500;
ALTER TABLE challenges       ADD COLUMN IF NOT EXISTS "timeEstimate" integer DEFAULT 15;
ALTER TABLE challenges       ADD COLUMN IF NOT EXISTS "evalId" text;
ALTER TABLE invitations      ADD COLUMN IF NOT EXISTS "companyName" text;
ALTER TABLE invoices         ADD COLUMN IF NOT EXISTS "companyId" text;
ALTER TABLE invoices         ADD COLUMN IF NOT EXISTS "invoiceNumber" text;
ALTER TABLE invoices         ADD COLUMN IF NOT EXISTS "clientName" text;
ALTER TABLE invoices         ADD COLUMN IF NOT EXISTS "clientContact" text;
ALTER TABLE invoices         ADD COLUMN IF NOT EXISTS "clientAddress" text DEFAULT ''::text;
ALTER TABLE invoices         ADD COLUMN IF NOT EXISTS "items" jsonb DEFAULT '[]'::jsonb;
ALTER TABLE invoices         ADD COLUMN IF NOT EXISTS "subtotal" numeric DEFAULT 0;
ALTER TABLE invoices         ADD COLUMN IF NOT EXISTS "totalDue" numeric DEFAULT 0;
ALTER TABLE invoices         ADD COLUMN IF NOT EXISTS "poNumber" text DEFAULT ''::text;
ALTER TABLE invoices         ADD COLUMN IF NOT EXISTS "amount" numeric;
ALTER TABLE system_metrics   ADD COLUMN IF NOT EXISTS "type" text DEFAULT ''::text;
ALTER TABLE system_metrics   ADD COLUMN IF NOT EXISTS "agentName" text DEFAULT ''::text;
ALTER TABLE system_metrics   ADD COLUMN IF NOT EXISTS "tokensUsed" integer DEFAULT 0;
ALTER TABLE system_metrics   ADD COLUMN IF NOT EXISTS "cost" numeric DEFAULT 0;
ALTER TABLE system_metrics   ADD COLUMN IF NOT EXISTS "qualityScore" numeric DEFAULT 0;
ALTER TABLE system_metrics   ADD COLUMN IF NOT EXISTS "status" text DEFAULT ''::text;

-- ═══════════════════════════════════════════════════════════
-- INDEXES for new tables
-- ═══════════════════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_created ON applications("createdAt" DESC);

-- ═══════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY for new tables
-- ═══════════════════════════════════════════════════════════
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public insert applications" ON applications
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert contact" ON contact_submissions
  FOR INSERT WITH CHECK (true);
