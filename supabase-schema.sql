-- Run this in Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql/new)

-- Applications table (for team application form submissions)
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

-- Enable Row Level Security
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- Allow insert from public (the /api/apply endpoint)
CREATE POLICY "Allow public insert" ON applications
  FOR INSERT WITH CHECK (true);

-- Allow select only for authenticated users with superadmin role
CREATE POLICY "Allow select for authenticated" ON applications
  FOR SELECT USING (auth.role() = 'authenticated');

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_created ON applications(created_at DESC);
