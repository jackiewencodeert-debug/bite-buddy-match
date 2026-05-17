CREATE TABLE public.dish_match_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid,
  menu_id uuid,
  verified_count integer NOT NULL DEFAULT 0,
  ingredient_inferred_count integer NOT NULL DEFAULT 0,
  unknown_count integer NOT NULL DEFAULT 0,
  total_count integer NOT NULL DEFAULT 0,
  dishes jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.dish_match_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert dish match events"
ON public.dish_match_events FOR INSERT
WITH CHECK ((user_id IS NULL) OR (auth.uid() = user_id));

CREATE POLICY "Admins can view all dish match events"
ON public.dish_match_events FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their own dish match events"
ON public.dish_match_events FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE INDEX idx_dish_match_events_created_at ON public.dish_match_events(created_at DESC);
CREATE INDEX idx_dish_match_events_user_id ON public.dish_match_events(user_id);