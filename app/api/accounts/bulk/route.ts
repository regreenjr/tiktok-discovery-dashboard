import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'
import { getAuthenticatedUser, getUserBrandIds } from '@/lib/auth'

// Helper to check if user has access to a brand
async function userHasAccessToBrand(brandId: string): Promise<boolean> {
  const user = await getAuthenticatedUser()
  if (!user) return false

  const userBrandIds = getUserBrandIds(user)

  // If user has brand_ids in metadata, check if the requested brand is in the list
  if (userBrandIds.length > 0) {
    return userBrandIds.includes(brandId)
  }

  // If no brand_ids set, allow access (legacy behavior for users without restrictions)
  return true
}

// POST /api/accounts/bulk - Bulk create accounts
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { handles, brand_id } = body

    // Validation
    if (!handles || !Array.isArray(handles)) {
      return NextResponse.json(
        { error: 'Handles array is required' },
        { status: 400 }
      )
    }

    if (!brand_id) {
      return NextResponse.json(
        { error: 'Brand ID is required' },
        { status: 400 }
      )
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(brand_id)) {
      return NextResponse.json(
        { error: 'Invalid brand ID format' },
        { status: 400 }
      )
    }

    // Check if user has access to this brand
    const hasAccess = await userHasAccessToBrand(brand_id)
    if (!hasAccess) {
      console.log('[API accounts/bulk] Access denied to brand:', brand_id)
      return NextResponse.json(
        { error: 'Access denied to this brand' },
        { status: 403 }
      )
    }

    // Clean and deduplicate handles
    const cleanHandles = handles
      .map((h: string) => h.trim().replace(/^@/, '').toLowerCase())
      .filter((h: string) => h.length > 0 && h.length <= 50)
      .filter((h: string, i: number, arr: string[]) => arr.indexOf(h) === i) // Remove duplicates

    if (cleanHandles.length === 0) {
      return NextResponse.json(
        { error: 'No valid handles provided' },
        { status: 400 }
      )
    }

    // Limit bulk operations
    if (cleanHandles.length > 100) {
      return NextResponse.json(
        { error: 'Maximum 100 handles per bulk operation' },
        { status: 400 }
      )
    }

    const supabase = getSupabase()

    // Check if brand exists
    const { data: brand } = await supabase
      .from('brands')
      .select('id')
      .eq('id', brand_id)
      .maybeSingle()

    if (!brand) {
      return NextResponse.json(
        { error: 'Brand not found' },
        { status: 404 }
      )
    }

    // Check for existing handles
    const { data: existingAccounts } = await supabase
      .from('competitor_accounts')
      .select('handle')
      .in('handle', cleanHandles)

    const existingHandles = new Set(existingAccounts?.map(a => a.handle) || [])
    const newHandles = cleanHandles.filter((h: string) => !existingHandles.has(h))

    if (newHandles.length === 0) {
      return NextResponse.json(
        {
          error: 'All provided handles already exist',
          duplicates: Array.from(existingHandles),
        },
        { status: 409 }
      )
    }

    // Create accounts for new handles
    const accountsToCreate = newHandles.map((handle: string) => ({
      handle,
      brand_id,
      is_active: true,
    }))

    const { data, error } = await supabase
      .from('competitor_accounts')
      .insert(accountsToCreate)
      .select()

    if (error) {
      console.error('[API accounts/bulk] Error creating accounts:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('[API accounts/bulk] Created accounts:', data?.length)
    return NextResponse.json({
      success: true,
      count: data?.length || 0,
      data,
      skipped: Array.from(existingHandles),
    }, { status: 201 })
  } catch (error) {
    console.error('[API accounts/bulk] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
