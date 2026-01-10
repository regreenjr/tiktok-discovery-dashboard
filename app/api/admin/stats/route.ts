import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSupabase } from '@/lib/supabase'
import { getAuthenticatedUser, isAdmin } from '@/lib/auth'

// GET /api/admin/stats - Get system-wide statistics (admin only)
export async function GET() {
  try {
    // Check if user is admin
    const user = await getAuthenticatedUser()
    if (!user || !isAdmin(user)) {
      console.log('[API admin/stats] Access denied - not admin')
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    const supabase = getSupabase()

    // Get counts
    const [brandsRes, accountsRes, videosRes] = await Promise.all([
      supabase.from('brands').select('*', { count: 'exact', head: true }),
      supabase.from('competitor_accounts').select('*', { count: 'exact', head: true }),
      supabase.from('competitor_videos').select('*', { count: 'exact', head: true })
    ])

    // Get user count via admin API
    let totalUsers = 0
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

    if (supabaseUrl && supabaseServiceKey) {
      const adminSupabase = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      })
      const { data: { users } } = await adminSupabase.auth.admin.listUsers()
      totalUsers = users?.length || 0
    }

    const stats = {
      totalBrands: brandsRes.count || 0,
      totalAccounts: accountsRes.count || 0,
      totalVideos: videosRes.count || 0,
      totalUsers
    }

    console.log('[API admin/stats] Admin stats:', stats)
    return NextResponse.json({ success: true, data: stats })
  } catch (error) {
    console.error('[API admin/stats] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
