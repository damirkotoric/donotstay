-- Migration: Per-user verdict caching
-- Each user's checks are stored independently, no shared cache

-- Create user_verdicts table for authenticated users
CREATE TABLE IF NOT EXISTS public.user_verdicts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  hotel_id TEXT NOT NULL,
  hotel_url TEXT NOT NULL,
  verdict TEXT NOT NULL CHECK (verdict IN ('Stay', 'Questionable', 'Do Not Stay')),
  confidence INT NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
  one_liner TEXT NOT NULL,
  red_flags JSONB DEFAULT '[]'::jsonb,
  avoid_if JSONB DEFAULT '[]'::jsonb,
  bottom_line TEXT NOT NULL,
  review_count INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Each user can only have one verdict per hotel
  UNIQUE(user_id, hotel_id)
);

-- Create anonymous_verdicts table for anonymous users (by device_id)
CREATE TABLE IF NOT EXISTS public.anonymous_verdicts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id TEXT NOT NULL,
  hotel_id TEXT NOT NULL,
  hotel_url TEXT NOT NULL,
  verdict TEXT NOT NULL CHECK (verdict IN ('Stay', 'Questionable', 'Do Not Stay')),
  confidence INT NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
  one_liner TEXT NOT NULL,
  red_flags JSONB DEFAULT '[]'::jsonb,
  avoid_if JSONB DEFAULT '[]'::jsonb,
  bottom_line TEXT NOT NULL,
  review_count INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Each device can only have one verdict per hotel
  UNIQUE(device_id, hotel_id)
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_user_verdicts_user_hotel ON public.user_verdicts(user_id, hotel_id);
CREATE INDEX IF NOT EXISTS idx_anonymous_verdicts_device_hotel ON public.anonymous_verdicts(device_id, hotel_id);

-- Enable RLS
ALTER TABLE public.user_verdicts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anonymous_verdicts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_verdicts
CREATE POLICY "Users can view own verdicts"
  ON public.user_verdicts
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage user_verdicts"
  ON public.user_verdicts
  FOR ALL
  USING (true);

-- RLS Policies for anonymous_verdicts (service role only)
CREATE POLICY "Service role can manage anonymous_verdicts"
  ON public.anonymous_verdicts
  FOR ALL
  USING (true);
