import { NextResponse } from 'next/server'
import { Pool } from 'pg'

// POST /api/migrate - Run database migrations to create missing tables
export async function POST() {
  try {
    // Construct the Supabase database connection URL
    // Format: postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_KEY

    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json(
        { error: 'Missing Supabase environment variables' },
        { status: 500 }
      )
    }

    // Extract project ref from URL (e.g., rexutrcvypdijyzvhkew from https://rexutrcvypdijyzvhkew.supabase.co)
    const projectRef = supabaseUrl.replace('https://', '').replace('.supabase.co', '')

    // The database password is the service role key's secret (need to get from dashboard)
    // For now, try using the direct connection through Supabase's pooler
    const databaseUrl = process.env.DATABASE_URL

    if (!databaseUrl) {
      return NextResponse.json({
        success: false,
        message: 'DATABASE_URL environment variable not set',
        hint: `Please add DATABASE_URL to .env.local. You can find it in Supabase Dashboard > Settings > Database > Connection string (URI).`,
        exampleFormat: 'postgresql://postgres:[YOUR-PASSWORD]@db.rexutrcvypdijyzvhkew.supabase.co:5432/postgres'
      }, { status: 400 })
    }

    const pool = new Pool({
      connectionString: databaseUrl,
      ssl: { rejectUnauthorized: false }
    })

    // Create videos table
    const createVideosTableSQL = `
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
    `

    const createIndexesSQL = `
      CREATE INDEX IF NOT EXISTS idx_videos_account_id ON public.videos(account_id);
      CREATE INDEX IF NOT EXISTS idx_videos_virality_score ON public.videos(virality_score DESC);
    `

    console.log('[API migrate] Creating videos table...')
    await pool.query(createVideosTableSQL)
    console.log('[API migrate] Creating indexes...')
    await pool.query(createIndexesSQL)

    await pool.end()

    return NextResponse.json({
      success: true,
      message: 'Videos table created successfully'
    })
  } catch (error) {
    console.error('[API migrate] Error:', error)
    return NextResponse.json(
      {
        error: 'Migration failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// GET /api/migrate - Check migration status
export async function GET() {
  return NextResponse.json({
    message: 'Use POST to run migrations',
    migrations: [
      'Create videos table with indexes'
    ]
  })
}
