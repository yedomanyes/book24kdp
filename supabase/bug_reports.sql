-- Run this in the Supabase SQL Editor

-- 1) Create the table (safe to re-run)
CREATE TABLE IF NOT EXISTS public.bug_reports (
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
ALTER TABLE public.bug_reports ENABLE ROW LEVEL SECURITY;

-- 3) Drop old policies if they exist
DROP POLICY IF EXISTS "Anyone can insert bug report" ON public.bug_reports;
DROP POLICY IF EXISTS "Owner can read all bug reports" ON public.bug_reports;

-- 4) Anyone (logged in or not) can INSERT a bug report
CREATE POLICY "Anyone can insert bug report"
  ON public.bug_reports FOR INSERT
  WITH CHECK (true);

-- 5) Drop old RPC function if exists
DROP FUNCTION IF EXISTS public.admin_get_bug_reports();

-- 6) Create secure RPC function for Owner/Admin to fetch bug reports
CREATE OR REPLACE FUNCTION public.admin_get_bug_reports()
RETURNS TABLE (
  id UUID,
  user_id UUID,
  user_email TEXT,
  category TEXT,
  title TEXT,
  description TEXT,
  status TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if the requester is an owner/admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.is_owner = true
  ) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  RETURN QUERY
  SELECT 
    b.id,
    b.user_id,
    b.user_email,
    b.category,
    b.title,
    b.description,
    b.status,
    b.created_at
  FROM public.bug_reports b
  ORDER BY b.created_at DESC
  LIMIT 100;
END;
$$;
