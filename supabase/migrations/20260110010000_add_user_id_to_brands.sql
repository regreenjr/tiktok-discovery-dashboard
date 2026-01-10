-- Add user_id column to brands table for multi-user support
ALTER TABLE public.brands ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_brands_user_id ON public.brands(user_id);
