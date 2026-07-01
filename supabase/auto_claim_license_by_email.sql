-- SQL-Skript zur automatischen Übernahme von Lizenzen bei gleicher E-Mail-Adresse
-- Führe dieses SQL einmal im Supabase Dashboard aus:
-- https://supabase.com/dashboard/project/sduylsqjewgbyouccssg/sql/new

CREATE OR REPLACE FUNCTION public.auto_claim_license_by_email(p_user_id uuid, p_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_license_key text;
BEGIN
  -- Suche nach einer anderen Registrierung mit derselben E-Mail, die eine Lizenz besitzt
  SELECT license_key INTO v_license_key
  FROM public.profiles
  WHERE email = p_email
    AND id != p_user_id
    AND license_key IS NOT NULL
    AND license_key != ''
  LIMIT 1;

  -- Wenn eine Lizenz gefunden wurde und das aktuelle Profil noch keine hat, übertragen wir sie
  IF v_license_key IS NOT NULL THEN
    UPDATE public.profiles
    SET license_key = v_license_key
    WHERE id = p_user_id
      AND (license_key IS NULL OR license_key = '');
    RETURN true;
  END IF;

  RETURN false;
END;
$$;
