import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'

// GET /api/scrape-status - Get scrape status (by brandId or all)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const brandId = searchParams.get('brandId')

    const supabase = getSupabase()

    if (brandId) {
      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      if (!uuidRegex.test(brandId)) {
        return NextResponse.json(
          { error: 'Invalid brand ID format' },
          { status: 400 }
        )
      }

      // Get brand info
      const { data: brand } = await supabase
        .from('brands')
        .select('last_scraped_at')
        .eq('id', brandId)
        .maybeSingle()

      // Check for running jobs
      const { data: runningJob } = await supabase
        .from('scrape_jobs')
        .select('id, status')
        .eq('brand_id', brandId)
        .in('status', ['pending', 'running'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      return NextResponse.json({
        success: true,
        data: {
          brandId,
          lastScrapedAt: brand?.last_scraped_at || null,
          isRunning: !!runningJob,
          runningJobId: runningJob?.id || null,
        },
      })
    }

    // Get all running jobs if no brandId specified
    const { data: runningJobs, error } = await supabase
      .from('scrape_jobs')
      .select('id, brand_id, status, started_at')
      .in('status', ['pending', 'running'])
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[API scrape-status] Error fetching jobs:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: {
        runningJobs: runningJobs || [],
      },
    })
  } catch (error) {
    console.error('[API scrape-status] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
