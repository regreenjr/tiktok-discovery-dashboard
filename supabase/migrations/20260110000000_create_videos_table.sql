-- Create videos table for storing scraped TikTok video data
CREATE TABLE IF NOT EXISTS public.videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES public.competitor_accounts(id) ON DELETE CASCADE,
  tiktok_id TEXT UNIQUE NOT NULL,
  description TEXT DEFAULT '',
  views INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  saves INTEGER DEFAULT 0,
  virality_score DECIMAL DEFAULT 0,
  hook_type TEXT,
  format TEXT,
  emotion TEXT,
  posted_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_videos_account_id ON public.videos(account_id);
CREATE INDEX IF NOT EXISTS idx_videos_virality_score ON public.videos(virality_score DESC);
CREATE INDEX IF NOT EXISTS idx_videos_posted_at ON public.videos(posted_at DESC);

-- Enable RLS
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;

-- Create policy for public access (adjust as needed for multi-tenant)
CREATE POLICY "Allow all operations on videos" ON public.videos
  FOR ALL USING (true) WITH CHECK (true);
