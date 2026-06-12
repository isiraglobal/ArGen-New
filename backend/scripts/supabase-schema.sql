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
  "role" TEXT DEFAULT 'member',
  "companyId" TEXT REFERENCES "companies"("id") ON DELETE SET NULL,
  "jobRole" TEXT DEFAULT '',
  "department" TEXT DEFAULT '',
  "createdAt" TIMESTAMPTZ DEFAULT now()
);

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
  "companyId" TEXT
);

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
