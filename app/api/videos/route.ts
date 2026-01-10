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

// Video type that maps competitor_videos table to expected format
interface Video {
  id: string
  account_id: string
  tiktok_id: string
  description: string
  views: number
  comments: number
  shares: number
  saves: number
  virality_score: number
  hook_type: string | null
  format: string | null
  emotion: string | null
  posted_at: string
  created_at: string
  updated_at: string
}

// GET /api/videos - List videos (filtered by brand)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const brandId = searchParams.get('brand_id')
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')

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
      console.log('[API videos] Access denied to brand:', brandId)
      return NextResponse.json(
        { error: 'Access denied to this brand' },
        { status: 403 }
      )
    }

    const supabase = getSupabase()

    // First, get account IDs for this brand
    const { data: accounts, error: accountsError } = await supabase
      .from('competitor_accounts')
      .select('id')
      .eq('brand_id', brandId)

    if (accountsError) {
      console.error('[API videos] Error fetching accounts:', accountsError)
      return NextResponse.json({ error: accountsError.message }, { status: 500 })
    }

    if (!accounts || accounts.length === 0) {
      return NextResponse.json({ success: true, data: [], total: 0 })
    }

    const accountIds = accounts.map(a => a.id)

    // Get videos from competitor_videos table
    // Map columns: video_id -> tiktok_id, content_format -> format, emotional_trigger -> emotion
    const { data, error, count } = await supabase
      .from('competitor_videos')
      .select('id, account_id, video_id, caption, views, comments, shares, likes, virality_score, hook_type, content_format, emotional_trigger, discovered_at, metrics_updated_at', { count: 'exact' })
      .in('account_id', accountIds)
      .order('virality_score', { ascending: false, nullsFirst: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('[API videos] Error fetching videos:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Map to expected Video format
    const mappedVideos: Video[] = (data || []).map(v => ({
      id: v.id,
      account_id: v.account_id,
      tiktok_id: v.video_id,
      description: v.caption || '',
      views: v.views || 0,
      comments: v.comments || 0,
      shares: v.shares || 0,
      saves: v.likes || 0, // Using likes as proxy for saves
      virality_score: v.virality_score || 0,
      hook_type: v.hook_type || null,
      format: v.content_format || null,
      emotion: v.emotional_trigger || null,
      posted_at: v.discovered_at || new Date().toISOString(),
      created_at: v.discovered_at || new Date().toISOString(),
      updated_at: v.metrics_updated_at || new Date().toISOString(),
    }))

    console.log('[API videos] Fetched videos:', mappedVideos.length)
    return NextResponse.json({
      success: true,
      data: mappedVideos,
      total: count || 0,
      offset,
      limit,
    })
  } catch (error) {
    console.error('[API videos] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
