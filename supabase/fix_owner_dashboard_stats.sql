-- Updated get_owner_dashboard_data function
-- Properly counts books and pages from the books table payload JSON

CREATE OR REPLACE FUNCTION get_owner_dashboard_data(owner_email_param text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_is_owner boolean;
  v_result jsonb;
BEGIN
  -- Verify the caller is an owner
  SELECT is_owner INTO v_is_owner
  FROM public.profiles
  WHERE email = owner_email_param;

  IF NOT v_is_owner THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT jsonb_agg(
    jsonb_build_object(
      'id', p.id,
      'email', p.email,
      'name', p.name,
      'photo_url', p.photo_url,
      'plan', p.plan,
      'status', p.status,
      'license_key', p.license_key,
      'is_owner', p.is_owner,
      'created_at', p.created_at,
      'last_login_at', p.last_login_at,
      'stats', jsonb_build_object(
        'total_books', COALESCE(bs.total_books, 0),
        'completed_books', COALESCE(bs.completed_books, 0),
        'estimated_gen_time_mins', COALESCE(bs.estimated_gen_time_mins, 0),
        'niches', COALESCE(bs.niches, '[]'::jsonb)
      )
    )
  )
  INTO v_result
  FROM public.profiles p
  LEFT JOIN LATERAL (
    SELECT
      COUNT(b.id)::int AS total_books,
      SUM(
        CASE
          WHEN (
            SELECT COUNT(*)
            FROM jsonb_each_text(COALESCE(b.payload->'pagesStatus', '{}'::jsonb))
            WHERE value = 'done'
          ) = (b.payload->>'totalPages')::int
          AND (b.payload->>'totalPages')::int > 0
          THEN 1 ELSE 0
        END
      )::int AS completed_books,
      -- Estimate: each page takes ~2 minutes of AI generation
      (
        SUM(
          (SELECT COUNT(*)
           FROM jsonb_each_text(COALESCE(b.payload->'pagesStatus', '{}'::jsonb))
           WHERE value = 'done')
        ) * 2
      )::int AS estimated_gen_time_mins,
      jsonb_agg(DISTINCT b.market_niche) FILTER (WHERE b.market_niche IS NOT NULL) AS niches
    FROM public.books b
    WHERE b.user_id = p.id
  ) bs ON true;

  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;
