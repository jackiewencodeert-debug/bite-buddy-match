-- BiteBuddyMatch scan telemetry — één event per scan met match-source aggregaat.
-- Voedt: cold-start analyse (% unknown daalt over tijd), confidence-threshold tuning,
-- curatie-prioritering ("welke unknown gerechten komen het meeste voor?").

CREATE TABLE IF NOT EXISTS public.dish_match_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  total_count INT NOT NULL,
  verified_count INT NOT NULL DEFAULT 0,
  ingredient_inferred_count INT NOT NULL DEFAULT 0,
  unknown_count INT NOT NULL DEFAULT 0,
  dishes JSONB NOT NULL,  -- [{name, source, confidence}]
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dish_match_events_created
  ON public.dish_match_events (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_dish_match_events_user_created
  ON public.dish_match_events (user_id, created_at DESC);

-- Voor "welke unknown dishes komen het meeste voor?" queries op JSONB
CREATE INDEX IF NOT EXISTS idx_dish_match_events_dishes_gin
  ON public.dish_match_events USING GIN (dishes);

ALTER TABLE public.dish_match_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can insert match events" ON public.dish_match_events;
CREATE POLICY "Anyone can insert match events"
  ON public.dish_match_events
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users see own events; admins see all" ON public.dish_match_events;
CREATE POLICY "Users see own events; admins see all"
  ON public.dish_match_events
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()));
