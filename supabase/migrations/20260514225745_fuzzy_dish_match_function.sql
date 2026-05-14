-- Fuzzy dish match RPC: zoekt curated_dishes (en aliases) op naam met trigram similarity.
-- Aanroepvanuit edge function match-menu (zero-AI scan flow).

CREATE OR REPLACE FUNCTION public.fuzzy_dish_match(
  search_text TEXT,
  threshold FLOAT DEFAULT 0.4
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  allergens TEXT[],
  ingredients TEXT[],
  similarity_score FLOAT
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.id,
    d.name,
    d.description,
    d.allergens,
    d.ingredients,
    GREATEST(
      similarity(d.name, search_text),
      COALESCE(
        (SELECT MAX(similarity(da.alias_name, search_text))
           FROM public.dish_aliases da
          WHERE da.dish_id = d.id),
        0
      )
    )::FLOAT AS score
  FROM public.curated_dishes d
  WHERE d.verified = true
    AND (
      similarity(d.name, search_text) > threshold
      OR EXISTS (
        SELECT 1 FROM public.dish_aliases da2
         WHERE da2.dish_id = d.id
           AND similarity(da2.alias_name, search_text) > threshold
      )
    )
  ORDER BY score DESC
  LIMIT 5;
END;
$$;

REVOKE ALL ON FUNCTION public.fuzzy_dish_match(TEXT, FLOAT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.fuzzy_dish_match(TEXT, FLOAT) TO authenticated, anon;
