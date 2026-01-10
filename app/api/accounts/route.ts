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

// GET /api/accounts - List accounts (optionally filtered by brand_id)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const brandId = searchParams.get('brand_id')

    // If brand_id provided, check user access
    if (brandId) {
      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      if (!uuidRegex.test(brandId)) {
        return NextResponse.json(
          { error: 'Invalid brand ID format' },
          { status: 400 }
        )
      }

      // Check if user has access to this brand
      const hasAccess = await userHasAccessToBrand(brandId)
      if (!hasAccess) {
        console.log('[API accounts] Access denied to brand:', brandId)
        return NextResponse.json(
          { error: 'Access denied to this brand' },
          { status: 403 }
        )
      }
    }

    const supabase = getSupabase()

    let query = supabase
      .from('competitor_accounts')
      .select('*')
      .order('created_at', { ascending: false })

    if (brandId) {
      query = query.eq('brand_id', brandId)
    }

    const { data, error } = await query

    if (error) {
      console.error('[API accounts] Error fetching accounts:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('[API accounts] Fetched accounts:', data?.length)
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('[API accounts] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/accounts - Create a single account
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { handle, brand_id, display_name, category, notes } = body

    // Validation
    if (!handle || typeof handle !== 'string') {
      return NextResponse.json(
        { error: 'Account handle is required' },
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
      console.log('[API accounts] Access denied to brand:', brand_id)
      return NextResponse.json(
        { error: 'Access denied to this brand' },
        { status: 403 }
      )
    }

    // Clean handle (remove @ if present)
    const cleanHandle = handle.trim().replace(/^@/, '').toLowerCase()

    if (cleanHandle.length === 0) {
      return NextResponse.json(
        { error: 'Account handle cannot be empty' },
        { status: 400 }
      )
    }

    if (cleanHandle.length > 50) {
      return NextResponse.json(
        { error: 'Account handle must be less than 50 characters' },
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

    // Check for duplicate handle (global unique constraint)
    const { data: existing } = await supabase
      .from('competitor_accounts')
      .select('id')
      .eq('handle', cleanHandle)
      .maybeSingle()

    if (existing) {
      return NextResponse.json(
        { error: 'This account handle already exists' },
        { status: 409 }
      )
    }

    // Create the account
    const { data, error } = await supabase
      .from('competitor_accounts')
      .insert({
        handle: cleanHandle,
        brand_id,
        display_name: display_name || null,
        category: category || null,
        notes: notes || null,
        is_active: true,
      })
      .select()
      .single()

    if (error) {
      console.error('[API accounts] Error creating account:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('[API accounts] Created account:', data.id)
    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error) {
    console.error('[API accounts] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
