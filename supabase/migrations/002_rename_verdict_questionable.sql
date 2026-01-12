-- Migration: Rename "It depends" verdict to "Questionable"
-- This migration updates the verdict CHECK constraint and existing data

-- Step 1: Update existing data from "It depends" to "Questionable"
UPDATE public.verdicts
SET verdict = 'Questionable'
WHERE verdict = 'It depends';

-- Step 2: Drop the old CHECK constraint and add the new one
ALTER TABLE public.verdicts
DROP CONSTRAINT IF EXISTS verdicts_verdict_check;

ALTER TABLE public.verdicts
ADD CONSTRAINT verdicts_verdict_check
CHECK (verdict IN ('Stay', 'Questionable', 'Do Not Stay'));
