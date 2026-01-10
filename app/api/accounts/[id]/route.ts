import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'
import { getAuthenticatedUser, getUserBrandIds } from '@/lib/auth'

// Helper to check if user has access to an account (via its brand)
async function userHasAccessToAccount(accountId: string): Promise<boolean> {
  const user = await getAuthenticatedUser()
  if (!user) return false

  const userBrandIds = getUserBrandIds(user)

  // If user has no brand_ids set, allow access (legacy behavior)
  if (userBrandIds.length === 0) {
    return true
  }

  // Get the account's brand_id
  const supabase = getSupabase()
  const { data: account } = await supabase
    .from('competitor_accounts')
    .select('brand_id')
    .eq('id', accountId)
    .maybeSingle()

  if (!account) return false

  // Check if the account's brand is in user's allowed brands
  return userBrandIds.includes(account.brand_id)
}

// DELETE /api/accounts/[id] - Delete an account
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { error: 'Invalid account ID format' },
        { status: 400 }
      )
    }

    // Check if user has access to this account
    const hasAccess = await userHasAccessToAccount(id)
    if (!hasAccess) {
      console.log('[API accounts/[id]] Access denied to account:', id)
      return NextResponse.json(
        { error: 'Access denied to this account' },
        { status: 403 }
      )
    }

    const supabase = getSupabase()

    // Check if account exists
    const { data: existing } = await supabase
      .from('competitor_accounts')
      .select('id')
      .eq('id', id)
      .maybeSingle()

    if (!existing) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      )
    }

    // Delete associated videos first
    await supabase.from('videos').delete().eq('account_id', id)

    // Delete the account
    const { error } = await supabase
      .from('competitor_accounts')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('[API accounts/[id]] Error deleting account:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('[API accounts/[id]] Deleted account:', id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[API accounts/[id]] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH /api/accounts/[id] - Update an account (toggle active, etc.)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { error: 'Invalid account ID format' },
        { status: 400 }
      )
    }

    // Check if user has access to this account
    const hasAccess = await userHasAccessToAccount(id)
    if (!hasAccess) {
      console.log('[API accounts/[id]] Access denied to update account:', id)
      return NextResponse.json(
        { error: 'Access denied to this account' },
        { status: 403 }
      )
    }

    const supabase = getSupabase()

    // Check if account exists
    const { data: existing } = await supabase
      .from('competitor_accounts')
      .select('id')
      .eq('id', id)
      .maybeSingle()

    if (!existing) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      )
    }

    // Build update object
    const updates: Record<string, unknown> = {}
    if (typeof body.is_active === 'boolean') {
      updates.is_active = body.is_active
    }
    if (typeof body.display_name === 'string') {
      updates.display_name = body.display_name
    }
    if (typeof body.category === 'string') {
      updates.category = body.category
    }
    if (typeof body.notes === 'string') {
      updates.notes = body.notes
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      )
    }

    updates.updated_at = new Date().toISOString()

    const { data, error } = await supabase
      .from('competitor_accounts')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('[API accounts/[id]] Error updating account:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('[API accounts/[id]] Updated account:', id)
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('[API accounts/[id]] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
