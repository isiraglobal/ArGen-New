-- ═══════════════════════════════════════════════════════════
-- ArGen - Complete Supabase Schema
-- Run this ENTIRE file in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════

-- ── 1. Applications ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT NOT NULL,
  title TEXT NOT NULL,
  team_size TEXT DEFAULT '',
  website TEXT DEFAULT '',
  referral TEXT DEFAULT '',
  message TEXT NOT NULL,
  status TEXT DEFAULT 'new',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 2. Users ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT,
  name TEXT,
  role TEXT DEFAULT 'member',
  avatar TEXT DEFAULT '',
  password TEXT,
  profile_complete BOOLEAN DEFAULT false,
  profile_status TEXT DEFAULT 'pending',
  is_approved BOOLEAN DEFAULT false,
  current_streak INTEGER DEFAULT 0,
  department TEXT DEFAULT '',
  employee_id TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 3. Companies ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS companies (
  id TEXT PRIMARY KEY,
  name TEXT,
  industry TEXT DEFAULT '',
  size TEXT DEFAULT '',
  country TEXT DEFAULT '',
  domain TEXT DEFAULT '',
  status TEXT DEFAULT 'pending',
  invite_code TEXT,
  seat_limit INTEGER DEFAULT 15,
  primary_contact JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 4. Responses ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS responses (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  challenge_id TEXT,
  evaluation_id TEXT,
  prompt_text TEXT DEFAULT '',
  model_output TEXT DEFAULT '',
  scores JSONB DEFAULT '{}',
  overall_score NUMERIC DEFAULT 0,
  scoring_status TEXT DEFAULT 'Pending',
  flags JSONB DEFAULT '[]',
  justification TEXT DEFAULT '',
  improvement TEXT DEFAULT '',
  status TEXT DEFAULT 'Pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 5. Evaluations ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS evaluations (
  id TEXT PRIMARY KEY,
  title TEXT DEFAULT '',
  description TEXT DEFAULT '',
  created_by TEXT,
  status TEXT DEFAULT 'active',
  challenge_count INTEGER DEFAULT 0,
  scoring_agent_version TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 6. Challenges ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS challenges (
  id TEXT PRIMARY KEY,
  name TEXT DEFAULT '',
  type TEXT DEFAULT '',
  difficulty TEXT DEFAULT '',
  text TEXT DEFAULT '',
  word_limit INTEGER DEFAULT 500,
  time_estimate INTEGER DEFAULT 15,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 7. Invitations ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS invitations (
  id TEXT PRIMARY KEY,
  email TEXT,
  company_name TEXT,
  token TEXT,
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 8. Invoices ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS invoices (
  id TEXT PRIMARY KEY,
  invoice_number TEXT,
  client_name TEXT,
  client_contact TEXT,
  client_address TEXT DEFAULT '',
  items JSONB DEFAULT '[]',
  subtotal NUMERIC DEFAULT 0,
  total_due NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'Draft',
  po_number TEXT DEFAULT '',
  date TIMESTAMPTZ DEFAULT NOW()
);

-- ── 9. Contact Submissions ───────────────────────────────
CREATE TABLE IF NOT EXISTS contact_submissions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT,
  email TEXT,
  subject TEXT DEFAULT '',
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 10. System Metrics ───────────────────────────────────
CREATE TABLE IF NOT EXISTS system_metrics (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  type TEXT DEFAULT '',
  status TEXT DEFAULT '',
  agent_name TEXT DEFAULT '',
  tokens_used INTEGER DEFAULT 0,
  cost NUMERIC DEFAULT 0,
  quality_score NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 11. OAuth States ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS oauth_states (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  nonce TEXT,
  provider TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════
-- 🔧 ADD ALL MISSING COLUMNS (for pre-existing tables)
--     Runs safely — ADD COLUMN IF NOT EXISTS no-ops if column exists
-- ═══════════════════════════════════════════════════════════
ALTER TABLE users        ADD COLUMN IF NOT EXISTS company_id TEXT;
ALTER TABLE responses    ADD COLUMN IF NOT EXISTS company_id TEXT;
ALTER TABLE evaluations  ADD COLUMN IF NOT EXISTS company_id TEXT;
ALTER TABLE challenges   ADD COLUMN IF NOT EXISTS company_id TEXT;
ALTER TABLE invoices     ADD COLUMN IF NOT EXISTS company_id TEXT;
ALTER TABLE oauth_states ADD COLUMN IF NOT EXISTS company_id TEXT;
ALTER TABLE companies    ADD COLUMN IF NOT EXISTS invite_code TEXT;
ALTER TABLE companies    ADD COLUMN IF NOT EXISTS status TEXT;
ALTER TABLE responses    ADD COLUMN IF NOT EXISTS scoring_status TEXT;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS status TEXT;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ;
ALTER TABLE responses    ADD COLUMN IF NOT EXISTS user_id TEXT;
ALTER TABLE invitations  ADD COLUMN IF NOT EXISTS token TEXT;
ALTER TABLE invitations  ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE oauth_states ADD COLUMN IF NOT EXISTS nonce TEXT;

-- ═══════════════════════════════════════════════════════════
-- INDEXES
-- ═══════════════════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_company ON users(company_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_companies_status ON companies(status);
CREATE INDEX IF NOT EXISTS idx_companies_invite ON companies(invite_code);
CREATE INDEX IF NOT EXISTS idx_responses_user ON responses(user_id);
CREATE INDEX IF NOT EXISTS idx_responses_company ON responses(company_id);
CREATE INDEX IF NOT EXISTS idx_responses_status ON responses(scoring_status);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_created ON applications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_invitations_token ON invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON invitations(email);
CREATE INDEX IF NOT EXISTS idx_invoices_company ON invoices(company_id);
CREATE INDEX IF NOT EXISTS idx_metrics_type ON system_metrics(type);
CREATE INDEX IF NOT EXISTS idx_metrics_created ON system_metrics(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_oauth_nonce ON oauth_states(nonce);

-- ═══════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ═══════════════════════════════════════════════════════════
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public insert applications" ON applications
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert contact" ON contact_submissions
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow authenticated select applications" ON applications
  FOR SELECT USING (auth.role() = 'authenticated');
