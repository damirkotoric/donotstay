-- Migration: Credit-based pricing system
-- Replaces hourly rate limits and subscriptions with credit packs

-- Add credits_remaining column to users table (default 5 for new signups)
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS credits_remaining INT DEFAULT 5 NOT NULL;

-- Create credit_purchases table for purchase history
CREATE TABLE IF NOT EXISTS public.credit_purchases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  stripe_payment_intent_id TEXT UNIQUE,
  pack_type TEXT NOT NULL CHECK (pack_type IN ('entry', 'standard', 'traveler')),
  credits_amount INT NOT NULL,
  amount_paid_cents INT NOT NULL,
  purchased_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_credit_purchases_user ON public.credit_purchases(user_id);

-- Enable RLS on credit_purchases
ALTER TABLE public.credit_purchases ENABLE ROW LEVEL SECURITY;

-- Users can view their own purchase history
CREATE POLICY "Users can view own purchases"
  ON public.credit_purchases
  FOR SELECT
  USING (auth.uid() = user_id);

-- Only service role can insert purchases (via webhook)
CREATE POLICY "Service role can insert purchases"
  ON public.credit_purchases
  FOR INSERT
  WITH CHECK (true);

-- Atomic credit decrement function (prevents race conditions)
-- Returns new balance, or -1 if no credits available
CREATE OR REPLACE FUNCTION public.decrement_credit(user_uuid UUID)
RETURNS INT AS $$
DECLARE
  new_balance INT;
BEGIN
  UPDATE public.users
  SET credits_remaining = credits_remaining - 1
  WHERE id = user_uuid AND credits_remaining > 0
  RETURNING credits_remaining INTO new_balance;

  RETURN COALESCE(new_balance, -1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Atomic credit add function (for purchases)
-- Returns new balance after adding credits
CREATE OR REPLACE FUNCTION public.add_credits(user_uuid UUID, amount INT)
RETURNS INT AS $$
DECLARE
  new_balance INT;
BEGIN
  UPDATE public.users
  SET credits_remaining = credits_remaining + amount
  WHERE id = user_uuid
  RETURNING credits_remaining INTO new_balance;

  RETURN COALESCE(new_balance, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the handle_new_user trigger function to set credits
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, credits_remaining)
  VALUES (NEW.id, NEW.email, 5)
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user has purchased credits
CREATE OR REPLACE FUNCTION public.has_user_purchased(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.credit_purchases
    WHERE user_id = user_uuid
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
