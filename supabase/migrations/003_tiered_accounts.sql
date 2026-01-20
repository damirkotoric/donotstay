-- Tiered User Accounts Migration
-- Adds support for anonymous users and onboarding checks

-- Anonymous checks table (for tracking device-based rate limiting)
CREATE TABLE IF NOT EXISTS public.anonymous_checks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id TEXT NOT NULL,
  hotel_id TEXT NOT NULL,
  checked_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_anonymous_checks_device_id ON public.anonymous_checks(device_id);
CREATE INDEX IF NOT EXISTS idx_anonymous_checks_device_hotel ON public.anonymous_checks(device_id, hotel_id);

-- Enable RLS
ALTER TABLE public.anonymous_checks ENABLE ROW LEVEL SECURITY;

-- Only service role can manage anonymous checks (API handles access control)
CREATE POLICY "Service role can manage anonymous checks" ON public.anonymous_checks
  FOR ALL USING (auth.role() = 'service_role');

-- Add onboarding checks tracking to users table
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS onboarding_checks_remaining INT DEFAULT 4;

-- Update the trigger function to set onboarding_checks_remaining for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, onboarding_checks_remaining)
  VALUES (NEW.id, NEW.email, 4)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: Existing users will have NULL onboarding_checks_remaining
-- They will be treated as having 0 onboarding checks (rate-limit code handles this)
