-- Run this SQL in Supabase Dashboard to enable migrations
-- https://supabase.com/dashboard/project/rexutrcvypdijyzvhkew/sql/new

-- Step 1: Add user_id column to brands table
ALTER TABLE public.brands ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Step 2: Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_brands_user_id ON public.brands(user_id);

-- Step 3: Assign existing brands to the first user (for testing)
-- This updates all brands that don't have a user_id
UPDATE public.brands
SET user_id = (SELECT id FROM auth.users LIMIT 1)
WHERE user_id IS NULL;

-- Verify the migration
SELECT id, name, user_id FROM public.brands;
