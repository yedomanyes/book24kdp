-- Run this ONCE in Supabase SQL Editor
-- Creates a SECURITY DEFINER function that saves license_key to profiles, bypassing RLS

-- 1. Make sure license_key column exists
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS license_key text;

-- 2. Create function with elevated privileges
CREATE OR REPLACE FUNCTION public.activate_license_for_user(p_key text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  UPDATE public.profiles
  SET license_key = p_key,
      updated_at = now()
  WHERE id = v_user_id;

  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.activate_license_for_user(text) TO authenticated;
