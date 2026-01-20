-- Migration: Remove unused onboarding_checks_remaining column
-- This column was never used in the application logic (only credits_remaining is checked)

-- First, transfer any onboarding checks to credits_remaining for users who have them
UPDATE public.users
SET credits_remaining = credits_remaining + COALESCE(onboarding_checks_remaining, 0)
WHERE onboarding_checks_remaining IS NOT NULL AND onboarding_checks_remaining > 0;

-- Drop the unused column
ALTER TABLE public.users
DROP COLUMN IF EXISTS onboarding_checks_remaining;
