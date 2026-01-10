import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAuthenticatedUser, isAdmin } from '@/lib/auth'

// GET /api/admin/users - List ALL users (admin only)
export async function GET() {
  try {
    // Check if user is admin
    const user = await getAuthenticatedUser()
    if (!user || !isAdmin(user)) {
      console.log('[API admin/users] Access denied - not admin')
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    // Use service key to access admin functions
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Get ALL users via admin API
    const { data: { users }, error } = await supabase.auth.admin.listUsers()

    if (error) {
      console.error('[API admin/users] Error fetching users:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Map to safe user data (don't expose sensitive info)
    const safeUsers = users.map(u => ({
      id: u.id,
      email: u.email,
      user_metadata: {
        brand_ids: u.user_metadata?.brand_ids,
        role: u.user_metadata?.role
      },
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at
    }))

    console.log('[API admin/users] Admin fetched all users:', safeUsers.length)
    return NextResponse.json({ success: true, data: safeUsers })
  } catch (error) {
    console.error('[API admin/users] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
