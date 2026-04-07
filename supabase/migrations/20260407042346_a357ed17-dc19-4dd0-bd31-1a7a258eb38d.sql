
-- Add google_place_id to businesses
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS google_place_id text;

-- Update handle_new_user to use 'starter' plan for trial
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  
  INSERT INTO public.subscriptions (user_id, plan, status, is_trial, trial_start, trial_end, current_period_start, current_period_end)
  VALUES (NEW.id, 'starter', 'active', true, now(), now() + interval '7 days', now(), now() + interval '7 days');
  
  RETURN NEW;
END;
$$;
