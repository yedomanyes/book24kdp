-- SCHRITT 1: Führe dieses SQL im Supabase Dashboard aus
-- Dashboard URL: https://supabase.com/dashboard/project/sduylsqjewgbyouccssg/sql/new

-- Erstellt eine neue Admin-Funktion die alle Bücher-Stats als einen Query zurückgibt
CREATE OR REPLACE FUNCTION admin_get_all_books_stats(owner_email_param text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_is_owner boolean;
BEGIN
  SELECT is_owner INTO v_is_owner
  FROM public.profiles
  WHERE email = owner_email_param;

  IF NOT v_is_owner THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN (
    SELECT jsonb_object_agg(
      user_id::text,
      jsonb_build_object(
        'total', total,
        'completed', completed,
        'gen_mins', gen_mins,
        'niches', niches
      )
    )
    FROM (
      SELECT
        b.user_id,
        COUNT(*)::int AS total,
        SUM(CASE
          WHEN (b.payload->>'totalPages')::int > 0
          AND (
            SELECT COUNT(*)
            FROM jsonb_each_text(COALESCE(b.payload->'pagesStatus', '{}'::jsonb))
            WHERE value = 'done'
          ) >= (b.payload->>'totalPages')::int
          THEN 1 ELSE 0
        END)::int AS completed,
        (SUM(
          (SELECT COUNT(*) FROM jsonb_each_text(COALESCE(b.payload->'pagesStatus', '{}'::jsonb)) WHERE value = 'done')
        ) * 2)::int AS gen_mins,
        jsonb_agg(DISTINCT b.market_niche) FILTER (WHERE b.market_niche IS NOT NULL) AS niches
      FROM public.books b
      GROUP BY b.user_id
    ) sub
  );
END;
$$;

-- SCHRITT 2: Löse auch das Transfer-Problem (Bücher von easypeasy3334 zu efecanguner41)
-- Ersetze ZIEL_USER_ID mit der echten ID von efecanguner41@gmail.com (aus Owner Panel)
-- UPDATE public.books SET user_id = 'ZIEL_USER_ID' WHERE user_id = 'QUELLE_USER_ID';
