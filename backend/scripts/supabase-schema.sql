-- ArGen Supabase Database Schema
-- Run this script in your Supabase SQL Editor to create the necessary tables.

-- Enable gen_random_uuid() extension if not enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Companies table
CREATE TABLE IF NOT EXISTS "companies" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "name" TEXT UNIQUE NOT NULL,
  "industry" TEXT,
  "size" TEXT,
  "country" TEXT,
  "primaryContact" JSONB,
  "inviteCode" TEXT UNIQUE,
  "status" TEXT DEFAULT 'pending',
  "createdAt" TIMESTAMPTZ DEFAULT now()
);

-- 2. Users table
CREATE TABLE IF NOT EXISTS "users" (
  "id" TEXT PRIMARY KEY, -- Maps to Supabase Auth user ID (UUID as text)
  "name" TEXT NOT NULL,
  "email" TEXT UNIQUE NOT NULL,
  "password" TEXT,          -- bcrypt hash (used in local auth flow)
  "role" TEXT DEFAULT 'member',
  "companyId" TEXT REFERENCES "companies"("id") ON DELETE SET NULL,
  "isApproved" BOOLEAN DEFAULT false,
  "jobRole" TEXT DEFAULT '',
  "department" TEXT DEFAULT '',
  "currentStreak" INTEGER DEFAULT 0,   -- Consecutive days with a submission
  "longestStreak" INTEGER DEFAULT 0,   -- All-time best streak
  "weakestDimension" TEXT DEFAULT '',  -- Lowest-scoring eval dimension
  "passcode" TEXT DEFAULT '',          -- Team passcode used on /teams page
  "createdAt" TIMESTAMPTZ DEFAULT now()
);

-- Safe migrations for existing deployments (ignore errors if column already exists)
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "password" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "isApproved" BOOLEAN DEFAULT false;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "currentStreak" INTEGER DEFAULT 0;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "longestStreak" INTEGER DEFAULT 0;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "weakestDimension" TEXT DEFAULT '';
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "passcode" TEXT DEFAULT '';

-- Employee profile fields
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "phone" TEXT DEFAULT '';
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "employeeId" TEXT DEFAULT '';
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "departmentId" TEXT DEFAULT '';
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "profileComplete" BOOLEAN DEFAULT false;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "profileStatus" TEXT DEFAULT 'pending';
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "approvedBy" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "approvedAt" TIMESTAMPTZ;

-- Add missing columns to companies table for approval workflow
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "approvedBy" TEXT;
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "approvedAt" TIMESTAMPTZ;

-- Whop / subscription columns on companies
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "whopUserId" TEXT;
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "subscriptionStatus" TEXT DEFAULT 'pending';
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "plan" TEXT;
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "seatLimit" INTEGER DEFAULT 15;
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "metadata" JSONB DEFAULT '{}'::jsonb;
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "paidAt" TIMESTAMPTZ;

-- Add missing columns to responses table
ALTER TABLE "responses" ADD COLUMN IF NOT EXISTS "promptText" TEXT;
ALTER TABLE "responses" ADD COLUMN IF NOT EXISTS "challengeId" TEXT;
ALTER TABLE "responses" ADD COLUMN IF NOT EXISTS "overallScore" NUMERIC;
ALTER TABLE "responses" ADD COLUMN IF NOT EXISTS "userName" TEXT;


-- 3. Invitations table
CREATE TABLE IF NOT EXISTS "invitations" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "email" TEXT NOT NULL,
  "companyName" TEXT NOT NULL,
  "token" TEXT UNIQUE NOT NULL,
  "used" BOOLEAN DEFAULT false,
  "usedBy" TEXT REFERENCES "users"("id") ON DELETE SET NULL,
  "usedAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ DEFAULT now()
);

-- 4. Challenges table
CREATE TABLE IF NOT EXISTS "challenges" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "instructions" TEXT,
  "evalId" TEXT,
  "active" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMPTZ DEFAULT now(),
  "scenario" TEXT,
  "type" TEXT,
  "difficulty" TEXT,
  "text" TEXT,
  "wordLimit" INTEGER DEFAULT 500,
  "timeEstimate" INTEGER DEFAULT 20,
  "dimensions" JSONB DEFAULT '{}'::jsonb,
  "companyId" TEXT,
  "task" TEXT
);

ALTER TABLE "challenges" ADD COLUMN IF NOT EXISTS "task" TEXT;

-- 5. Evaluations table
CREATE TABLE IF NOT EXISTS "evaluations" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "companyId" TEXT REFERENCES "companies"("id") ON DELETE CASCADE,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "challenges" JSONB DEFAULT '[]'::jsonb, -- Array of challenge IDs
  "createdBy" TEXT,
  "deadline" TIMESTAMPTZ,
  "status" TEXT DEFAULT 'active',
  "createdAt" TIMESTAMPTZ DEFAULT now()
);

-- 6. Responses table
CREATE TABLE IF NOT EXISTS "responses" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "user" TEXT REFERENCES "users"("id") ON DELETE CASCADE,
  "companyId" TEXT REFERENCES "companies"("id") ON DELETE SET NULL,
  "evaluationId" TEXT REFERENCES "evaluations"("id") ON DELETE SET NULL,
  "challenge" TEXT REFERENCES "challenges"("id") ON DELETE CASCADE,
  "responseText" TEXT NOT NULL,
  "workflowApproach" TEXT,
  "timeTaken" INTEGER,
  "baselineTime" INTEGER,
  "scores" JSONB,
  "justification" TEXT,
  "improvement" TEXT,
  "flags" JSONB DEFAULT '[]'::jsonb,
  "scoringStatus" TEXT,
  "modelUsed" TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT now()
);

-- 7. System Metrics table
CREATE TABLE IF NOT EXISTS "system_metrics" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "type" TEXT,
  "agentName" TEXT,
  "status" TEXT,
  "tokensUsed" INTEGER,
  "cost" NUMERIC,
  "qualityScore" NUMERIC,
  "metadata" JSONB,
  "createdAt" TIMESTAMPTZ DEFAULT now()
);

-- 8. Invoices table
CREATE TABLE IF NOT EXISTS "invoices" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "invoiceNumber" TEXT,
  "poNumber" TEXT,
  "companyId" TEXT REFERENCES "companies"("id") ON DELETE CASCADE,
  "clientName" TEXT,
  "clientAddress" TEXT,
  "clientContact" TEXT,
  "productName" TEXT,
  "productDescription" TEXT,
  "usageTerms" TEXT,
  "periodOfUse" TEXT,
  "items" JSONB DEFAULT '[]'::jsonb,
  "subtotal" NUMERIC,
  "totalDue" NUMERIC,
  "status" TEXT DEFAULT 'Draft',
  "date" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ DEFAULT now()
);

-- 9. Subscriptions table (Whop)
CREATE TABLE IF NOT EXISTS "subscriptions" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "companyId" TEXT REFERENCES "companies"("id") ON DELETE CASCADE,
  "whopMembershipId" TEXT UNIQUE NOT NULL,
  "whopUserId" TEXT,
  "plan" TEXT,
  "seatLimit" INTEGER DEFAULT 15,
  "status" TEXT DEFAULT 'active',
  "createdAt" TIMESTAMPTZ DEFAULT now()
);

-- 10. AI Provider Connections per Company
CREATE TABLE IF NOT EXISTS "ai_connections" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "companyId" TEXT REFERENCES "companies"("id") ON DELETE CASCADE,
  "provider" TEXT NOT NULL,
  "connectionStatus" TEXT DEFAULT 'pending',
  "accessToken" TEXT,
  "refreshToken" TEXT,
  "scope" TEXT,
  "orgId" TEXT,
  "connectedAt" TIMESTAMPTZ DEFAULT now(),
  "lastSyncedAt" TIMESTAMPTZ,
  "metadata" JSONB DEFAULT '{}'::jsonb
);

-- 11. Raw AI Usage Events
CREATE TABLE IF NOT EXISTS "ai_usage_events" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "companyId" TEXT REFERENCES "companies"("id") ON DELETE CASCADE,
  "userId" TEXT REFERENCES "users"("id") ON DELETE SET NULL,
  "provider" TEXT NOT NULL,
  "eventType" TEXT,
  "model" TEXT,
  "inputTokens" INTEGER DEFAULT 0,
  "outputTokens" INTEGER DEFAULT 0,
  "costUsd" NUMERIC(10,6) DEFAULT 0,
  "qualityScore" INTEGER,
  "qualityDimensions" JSONB,
  "rawPrompt" TEXT,
  "rawCompletion" TEXT,
  "eventTimestamp" TIMESTAMPTZ,
  "metadata" JSONB DEFAULT '{}'::jsonb,
  "createdAt" TIMESTAMPTZ DEFAULT now()
);

-- 12. Daily AI Usage Aggregates
CREATE TABLE IF NOT EXISTS "ai_usage_daily" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "companyId" TEXT REFERENCES "companies"("id") ON DELETE CASCADE,
  "userId" TEXT REFERENCES "users"("id") ON DELETE CASCADE,
  "provider" TEXT,
  "date" DATE NOT NULL,
  "totalRequests" INTEGER DEFAULT 0,
  "totalInputTokens" INTEGER DEFAULT 0,
  "totalOutputTokens" INTEGER DEFAULT 0,
  "totalCostUsd" NUMERIC(10,4) DEFAULT 0,
  "avgQualityScore" NUMERIC(5,2),
  "activeMinutes" INTEGER DEFAULT 0,
  UNIQUE("userId", "provider", "date")
);

-- Indexes for AI usage queries
CREATE INDEX IF NOT EXISTS idx_usage_events_company ON "ai_usage_events"("companyId", "eventTimestamp" DESC);
CREATE INDEX IF NOT EXISTS idx_usage_events_user ON "ai_usage_events"("userId", "eventTimestamp" DESC);
CREATE INDEX IF NOT EXISTS idx_usage_daily_company ON "ai_usage_daily"("companyId", "date" DESC);
CREATE INDEX IF NOT EXISTS idx_ai_connections_company ON "ai_connections"("companyId");
