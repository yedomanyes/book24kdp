-- Run this in the Supabase SQL Editor

-- 1) Create the table (safe to re-run)
CREATE TABLE IF NOT EXISTS bug_reports (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID,
  user_email  TEXT,
  category    TEXT,
  title       TEXT,
  description TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'open',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2) Enable RLS
ALTER TABLE bug_reports ENABLE ROW LEVEL SECURITY;

-- 3) Drop old policies if they exist
DROP POLICY IF EXISTS "Anyone can insert bug report" ON bug_reports;
DROP POLICY IF EXISTS "Owner can read all bug reports" ON bug_reports;

-- 4) Anyone (logged in or not) can INSERT a bug report
CREATE POLICY "Anyone can insert bug report"
  ON bug_reports FOR INSERT
  WITH CHECK (true);

-- 5) Only the owner email can SELECT (reads from client-side)
CREATE POLICY "Owner can read all bug reports"
  ON bug_reports FOR SELECT
  USING (auth.email() = 'yedomanyes@gmail.com');
