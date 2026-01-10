import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// POST /api/setup - Create missing database tables
export async function POST() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Missing Supabase environment variables' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Check if videos table exists by trying to query it
    const { error: checkError } = await supabase
      .from('videos')
      .select('id')
      .limit(1)

    if (checkError && checkError.message.includes('Could not find the table')) {
      // Table doesn't exist, we need to create it
      // Unfortunately, Supabase REST API doesn't support DDL
      // We need to use the database connection directly or Supabase dashboard

      return NextResponse.json({
        success: false,
        message: 'Videos table does not exist. Please create it manually in Supabase dashboard.',
        sql: `
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

CREATE INDEX IF NOT EXISTS idx_videos_account_id ON public.videos(account_id);
CREATE INDEX IF NOT EXISTS idx_videos_virality_score ON public.videos(virality_score DESC);
        `.trim()
      })
    }

    // Table exists
    return NextResponse.json({
      success: true,
      message: 'Videos table already exists'
    })
  } catch (error) {
    console.error('[API setup] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET /api/setup - Check database status
export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Missing Supabase environment variables' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const tables = ['brands', 'competitor_accounts', 'scrape_jobs', 'videos']
    const status: Record<string, boolean> = {}

    for (const table of tables) {
      const { error } = await supabase.from(table).select('id').limit(1)
      status[table] = !error || !error.message.includes('Could not find the table')
    }

    return NextResponse.json({
      success: true,
      tables: status
    })
  } catch (error) {
    console.error('[API setup] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
