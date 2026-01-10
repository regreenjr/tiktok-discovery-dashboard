import { NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'
import { getAuthenticatedUser, isAdmin } from '@/lib/auth'

// GET /api/admin/brands - List ALL brands (admin only)
export async function GET() {
  try {
    // Check if user is admin
    const user = await getAuthenticatedUser()
    if (!user || !isAdmin(user)) {
      console.log('[API admin/brands] Access denied - not admin')
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    const supabase = getSupabase()

    // Get ALL brands (no user filtering for admin)
    const { data, error } = await supabase
      .from('brands')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[API admin/brands] Error fetching brands:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('[API admin/brands] Admin fetched all brands:', data?.length)
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('[API admin/brands] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
