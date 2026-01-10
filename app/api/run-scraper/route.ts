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

// POST /api/run-scraper - Trigger Apify scraper for brand
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { brand_id } = body

    // Validation
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
      console.log('[API run-scraper] Access denied to brand:', brand_id)
      return NextResponse.json(
        { error: 'Access denied to this brand' },
        { status: 403 }
      )
    }

    const supabase = getSupabase()

    // Check if brand exists
    const { data: brand } = await supabase
      .from('brands')
      .select('id, name')
      .eq('id', brand_id)
      .maybeSingle()

    if (!brand) {
      return NextResponse.json(
        { error: 'Brand not found' },
        { status: 404 }
      )
    }

    // Check for existing running job (prevent duplicates)
    const { data: existingJob } = await supabase
      .from('scrape_jobs')
      .select('id')
      .eq('brand_id', brand_id)
      .in('status', ['pending', 'running'])
      .maybeSingle()

    if (existingJob) {
      return NextResponse.json(
        { error: 'A scrape job is already running for this brand' },
        { status: 409 }
      )
    }

    // Get active accounts for this brand
    const { data: accounts } = await supabase
      .from('competitor_accounts')
      .select('handle')
      .eq('brand_id', brand_id)
      .eq('is_active', true)

    if (!accounts || accounts.length === 0) {
      return NextResponse.json(
        { error: 'No active accounts to scrape' },
        { status: 400 }
      )
    }

    // Create scrape job record
    const { data: job, error: jobError } = await supabase
      .from('scrape_jobs')
      .insert({
        brand_id,
        scraper_type: 'competitor',
        status: 'pending',
        started_at: new Date().toISOString(),
        accounts_processed: 0,
        videos_found: 0,
      })
      .select()
      .single()

    if (jobError) {
      console.error('[API run-scraper] Error creating job:', jobError)
      return NextResponse.json({ error: jobError.message }, { status: 500 })
    }

    // Fire-and-forget: Trigger Apify scraper
    // In production, this would call the Apify API
    const apifyToken = process.env.APIFY_TOKEN

    if (apifyToken) {
      // Update job to running status
      await supabase
        .from('scrape_jobs')
        .update({ status: 'running' })
        .eq('id', job.id)

      // Trigger Apify (fire and forget)
      triggerApifyScraper(accounts.map(a => a.handle), job.id, brand_id, supabase)
        .catch(error => {
          console.error('[API run-scraper] Apify error:', error)
          // Update job status to failed
          supabase
            .from('scrape_jobs')
            .update({
              status: 'failed',
              error_message: error.message,
              completed_at: new Date().toISOString(),
            })
            .eq('id', job.id)
        })
    } else {
      console.warn('[API run-scraper] No APIFY_TOKEN configured, simulating scrape')
      // Simulate a quick scrape for development
      setTimeout(async () => {
        await supabase
          .from('scrape_jobs')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            accounts_processed: accounts.length,
            videos_found: 0,
          })
          .eq('id', job.id)

        await supabase
          .from('brands')
          .update({ last_scraped_at: new Date().toISOString() })
          .eq('id', brand_id)
      }, 5000)
    }

    console.log('[API run-scraper] Started job:', job.id)
    return NextResponse.json({
      success: true,
      data: {
        jobId: job.id,
        accountsToScrape: accounts.length,
      },
    }, { status: 201 })
  } catch (error) {
    console.error('[API run-scraper] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to trigger Apify scraper
async function triggerApifyScraper(
  handles: string[],
  jobId: string,
  brandId: string,
  supabase: ReturnType<typeof getSupabase>
) {
  const apifyToken = process.env.APIFY_TOKEN

  if (!apifyToken) {
    throw new Error('APIFY_TOKEN not configured')
  }

  // Apify TikTok scraper endpoint
  const actorId = 'apidojo/tiktok-profile-scraper'
  const apiUrl = `https://api.apify.com/v2/acts/${actorId}/runs`

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apifyToken}`,
    },
    body: JSON.stringify({
      profiles: handles.map(h => `https://www.tiktok.com/@${h}`),
      resultsPerPage: 30,
      shouldDownloadVideos: false,
      shouldDownloadCovers: false,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Apify API error: ${error}`)
  }

  const result = await response.json()
  console.log('[API run-scraper] Apify run started:', result.data?.id)

  // The webhook would handle completion, but for now we'll poll
  // In production, set up a webhook endpoint
}
