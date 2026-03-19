
-- Add trial columns to subscriptions
ALTER TABLE public.subscriptions 
  ADD COLUMN IF NOT EXISTS trial_start timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS trial_end timestamptz DEFAULT (now() + interval '7 days'),
  ADD COLUMN IF NOT EXISTS is_trial boolean DEFAULT true;

-- Create payments table
CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  subscription_id uuid REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  amount integer NOT NULL,
  currency text NOT NULL DEFAULT 'INR',
  status text NOT NULL DEFAULT 'pending',
  razorpay_payment_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payments"
  ON public.payments FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Update handle_new_user to also create trial subscription
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  
  INSERT INTO public.subscriptions (user_id, plan, status, is_trial, trial_start, trial_end, current_period_start, current_period_end)
  VALUES (NEW.id, 'trial', 'active', true, now(), now() + interval '7 days', now(), now() + interval '7 days');
  
  RETURN NEW;
END;
$$;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
