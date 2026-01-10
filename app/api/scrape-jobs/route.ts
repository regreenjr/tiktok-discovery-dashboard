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

// GET /api/scrape-jobs - Get scrape job history for a brand
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const brandId = searchParams.get('brand_id')
    const limit = parseInt(searchParams.get('limit') || '5')

    if (!brandId) {
      return NextResponse.json(
        { error: 'Brand ID is required' },
        { status: 400 }
      )
    }

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
      console.log('[API scrape-jobs] Access denied to brand:', brandId)
      return NextResponse.json(
        { error: 'Access denied to this brand' },
        { status: 403 }
      )
    }

    const supabase = getSupabase()

    // Get scrape jobs for this brand
    const { data, error } = await supabase
      .from('scrape_jobs')
      .select('*')
      .eq('brand_id', brandId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('[API scrape-jobs] Error fetching jobs:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: data || [],
    })
  } catch (error) {
    console.error('[API scrape-jobs] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
