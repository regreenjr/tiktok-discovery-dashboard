import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'
import { getAuthenticatedUser } from '@/lib/auth'

// POST /api/admin/migrate - Run database migrations
// This endpoint adds the user_id column to the brands table
export async function POST(request: NextRequest) {
  try {
    // Get the authenticated user (for logging)
    const user = await getAuthenticatedUser()
    console.log('[API admin/migrate] Triggered by user:', user?.id)

    const supabase = getSupabase()

    // Check if user_id column already exists by trying to select it
    const { data: testData, error: testError } = await supabase
      .from('brands')
      .select('id, user_id')
      .limit(1)

    if (!testError) {
      console.log('[API admin/migrate] user_id column already exists')
      return NextResponse.json({
        success: true,
        message: 'user_id column already exists',
        migrated: false
      })
    }

    // Column doesn't exist - we need to add it
    // Unfortunately, we can't run raw SQL through the standard Supabase client
    // We need to create the column through a workaround

    // Try using the postgres function if available
    const { error: rpcError } = await supabase.rpc('exec_sql', {
      query: `
        ALTER TABLE public.brands ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
        CREATE INDEX IF NOT EXISTS idx_brands_user_id ON public.brands(user_id);
      `
    })

    if (rpcError) {
      console.log('[API admin/migrate] RPC not available:', rpcError.message)

      // Return instructions for manual migration
      return NextResponse.json({
        success: false,
        message: 'Manual migration required. Please run the following SQL in Supabase SQL Editor.',
        sql: `
ALTER TABLE public.brands ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
CREATE INDEX IF NOT EXISTS idx_brands_user_id ON public.brands(user_id);
        `.trim(),
        dashboardUrl: 'https://supabase.com/dashboard/project/rexutrcvypdijyzvhkew/sql/new'
      }, { status: 400 })
    }

    console.log('[API admin/migrate] Migration completed successfully')
    return NextResponse.json({
      success: true,
      message: 'Migration completed - user_id column added to brands table',
      migrated: true
    })

  } catch (error) {
    console.error('[API admin/migrate] Error:', error)
    return NextResponse.json(
      { error: 'Migration failed' },
      { status: 500 }
    )
  }
}
