import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAuthenticatedUser, isAdmin } from '@/lib/auth'

// GET /api/admin/users/[id] - Get a specific user (admin only)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Check if user is admin
    const user = await getAuthenticatedUser()
    if (!user || !isAdmin(user)) {
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

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    const { data: { user: targetUser }, error } = await supabase.auth.admin.getUserById(id)

    if (error || !targetUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        id: targetUser.id,
        email: targetUser.email,
        user_metadata: {
          brand_ids: targetUser.user_metadata?.brand_ids,
          role: targetUser.user_metadata?.role
        },
        created_at: targetUser.created_at,
        last_sign_in_at: targetUser.last_sign_in_at
      }
    })
  } catch (error) {
    console.error('[API admin/users/[id]] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH /api/admin/users/[id] - Update a user (admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    // Check if user is admin
    const user = await getAuthenticatedUser()
    if (!user || !isAdmin(user)) {
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

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    // Get current user data
    const { data: { user: targetUser }, error: fetchError } = await supabase.auth.admin.getUserById(id)

    if (fetchError || !targetUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Build update object
    const updates: { user_metadata?: Record<string, unknown> } = {}

    if (body.role !== undefined || body.brand_ids !== undefined) {
      updates.user_metadata = {
        ...targetUser.user_metadata,
      }
      if (body.role !== undefined) {
        updates.user_metadata.role = body.role
      }
      if (body.brand_ids !== undefined) {
        updates.user_metadata.brand_ids = body.brand_ids
      }
    }

    const { data: { user: updatedUser }, error } = await supabase.auth.admin.updateUserById(
      id,
      updates
    )

    if (error) {
      console.error('[API admin/users/[id]] Error updating user:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('[API admin/users/[id]] Updated user:', id)
    return NextResponse.json({
      success: true,
      data: {
        id: updatedUser?.id,
        email: updatedUser?.email,
        user_metadata: {
          brand_ids: updatedUser?.user_metadata?.brand_ids,
          role: updatedUser?.user_metadata?.role
        }
      }
    })
  } catch (error) {
    console.error('[API admin/users/[id]] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/users/[id] - Delete a user (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Check if user is admin
    const user = await getAuthenticatedUser()
    if (!user || !isAdmin(user)) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    // Prevent admin from deleting themselves
    if (user.id === id) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
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

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    const { error } = await supabase.auth.admin.deleteUser(id)

    if (error) {
      console.error('[API admin/users/[id]] Error deleting user:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('[API admin/users/[id]] Deleted user:', id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[API admin/users/[id]] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
