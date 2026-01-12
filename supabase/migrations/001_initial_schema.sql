-- DoNotStay Database Schema
-- Run this migration in your Supabase SQL editor

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  stripe_customer_id TEXT UNIQUE,
  subscription_status TEXT DEFAULT 'free' CHECK (subscription_status IN ('free', 'monthly', 'annual')),
  subscription_ends_at TIMESTAMPTZ
);

-- Verdicts cache table
CREATE TABLE IF NOT EXISTS public.verdicts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  hotel_id TEXT NOT NULL UNIQUE,
  platform TEXT DEFAULT 'booking.com',
  verdict TEXT NOT NULL CHECK (verdict IN ('Stay', 'It depends', 'Do Not Stay')),
  confidence INT NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
  one_liner TEXT NOT NULL,
  red_flags JSONB DEFAULT '[]'::jsonb,
  avoid_if JSONB DEFAULT '[]'::jsonb,
  bottom_line TEXT NOT NULL,
  review_count INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days')
);

-- User checks tracking (for rate limiting)
CREATE TABLE IF NOT EXISTS public.checks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  hotel_id TEXT NOT NULL,
  checked_at TIMESTAMPTZ DEFAULT NOW()
);

-- Feedback table
CREATE TABLE IF NOT EXISTS public.feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  verdict_id UUID REFERENCES public.verdicts(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('inaccurate', 'helpful', 'other')),
  details TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_verdicts_hotel_id ON public.verdicts(hotel_id);
CREATE INDEX IF NOT EXISTS idx_verdicts_expires_at ON public.verdicts(expires_at);
CREATE INDEX IF NOT EXISTS idx_checks_user_id_checked_at ON public.checks(user_id, checked_at);
CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON public.feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_verdict_id ON public.feedback(verdict_id);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verdicts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users: Can only read own data
CREATE POLICY "Users can read own data" ON public.users
  FOR SELECT USING (auth.uid() = id);

-- Verdicts: Anyone can read (public cache)
CREATE POLICY "Verdicts are public" ON public.verdicts
  FOR SELECT USING (true);

-- Verdicts: Only service role can insert/update
CREATE POLICY "Service role can manage verdicts" ON public.verdicts
  FOR ALL USING (auth.role() = 'service_role');

-- Checks: Users can view their own checks
CREATE POLICY "Users can view own checks" ON public.checks
  FOR SELECT USING (auth.uid() = user_id);

-- Checks: Service role can manage all checks
CREATE POLICY "Service role can manage checks" ON public.checks
  FOR ALL USING (auth.role() = 'service_role');

-- Feedback: Users can insert their own feedback
CREATE POLICY "Users can insert own feedback" ON public.feedback
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Feedback: Users can view their own feedback
CREATE POLICY "Users can view own feedback" ON public.feedback
  FOR SELECT USING (auth.uid() = user_id);

-- Function to automatically create user record on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call function on user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to clean expired verdicts (run via cron or scheduled task)
CREATE OR REPLACE FUNCTION public.clean_expired_verdicts()
RETURNS void AS $$
BEGIN
  DELETE FROM public.verdicts WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Optional: Schedule cleanup (requires pg_cron extension)
-- SELECT cron.schedule('clean-expired-verdicts', '0 0 * * *', 'SELECT public.clean_expired_verdicts()');
