import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'

// Apify webhook payload structure
interface ApifyWebhookPayload {
  resource?: {
    id?: string
    status?: string
    defaultDatasetId?: string
  }
  eventData?: {
    actorRunId?: string
    status?: string
  }
  // Custom fields we may add when triggering
  brandId?: string
  jobId?: string
}

// Video data from Apify scraper
interface ApifyVideoData {
  id?: string
  videoId?: string
  caption?: string
  desc?: string
  description?: string
  plays?: number
  views?: number
  diggCount?: number
  likes?: number
  commentCount?: number
  comments?: number
  shareCount?: number
  shares?: number
  collectCount?: number
  saves?: number
  createTime?: number
  createTimeISO?: string
  author?: {
    uniqueId?: string
    nickname?: string
  }
  authorMeta?: {
    name?: string
    nickName?: string
  }
}

// Helper function to detect hook type from caption
function detectHookType(caption: string): string {
  const lowerCaption = caption.toLowerCase()

  if (lowerCaption.includes('?') || lowerCaption.match(/^(what|why|how|did|have|can|would)/)) {
    return 'Question'
  }
  if (lowerCaption.includes('unpopular opinion') || lowerCaption.includes('hot take')) {
    return 'Controversial'
  }
  if (lowerCaption.includes('story') || lowerCaption.includes('happened') || lowerCaption.includes('psst')) {
    return 'Story'
  }
  if (lowerCaption.includes('how to') || lowerCaption.includes('tutorial') || lowerCaption.includes('tip')) {
    return 'Tutorial'
  }
  if (lowerCaption.includes('wait') || lowerCaption.includes('discover') || lowerCaption.includes('secret')) {
    return 'Curiosity'
  }
  if (lowerCaption.includes('omg') || lowerCaption.includes('shocking') || lowerCaption.includes('crazy')) {
    return 'Shock'
  }
  return 'Curiosity'
}

// Helper function to detect format from caption
function detectFormat(caption: string): string {
  const lowerCaption = caption.toLowerCase()

  if (lowerCaption.includes('tutorial') || lowerCaption.includes('how to') || lowerCaption.includes('step')) {
    return 'Tutorial'
  }
  if (lowerCaption.includes('duet')) {
    return 'Duet'
  }
  if (lowerCaption.includes('stitch')) {
    return 'Stitch'
  }
  if (lowerCaption.includes('save') || lowerCaption.includes('bookmark') || lowerCaption.includes('quotes')) {
    return 'Slideshow'
  }
  if (lowerCaption.includes('story') || lowerCaption.includes('happened')) {
    return 'Storytime'
  }
  return 'Talking Head'
}

// Helper function to detect emotion from caption
function detectEmotion(caption: string): string {
  const lowerCaption = caption.toLowerCase()

  if (lowerCaption.includes('discover') || lowerCaption.includes('learn') || lowerCaption.includes('secret')) {
    return 'Curiosity'
  }
  if (lowerCaption.includes('amazing') || lowerCaption.includes('love') || lowerCaption.includes('best')) {
    return 'Excitement'
  }
  if (lowerCaption.includes('inspire') || lowerCaption.includes('dream') || lowerCaption.includes('achieve')) {
    return 'Inspiration'
  }
  if (lowerCaption.includes('miss') || lowerCaption.includes('limited') || lowerCaption.includes('space')) {
    return 'FOMO'
  }
  if (lowerCaption.includes('funny') || lowerCaption.includes('lol') || lowerCaption.includes('joke')) {
    return 'Humor'
  }
  return 'Curiosity'
}

// Calculate virality score
function calculateViralityScore(views: number, comments: number, shares: number, saves: number): number {
  if (views === 0) return 0
  const engagement = comments + shares * 2 + saves * 1.5
  const engagementRate = engagement / views
  return Math.round(engagementRate * 1000 * 100) / 100
}

// Simple HMAC validation using Web Crypto API
async function validateSignature(payload: string, signature: string, secret: string): Promise<boolean> {
  try {
    const encoder = new TextEncoder()
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )
    const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(payload))
    const computedSignature = Array.from(new Uint8Array(signatureBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')

    // Constant-time comparison
    if (signature.length !== computedSignature.length) return false
    let result = 0
    for (let i = 0; i < signature.length; i++) {
      result |= signature.charCodeAt(i) ^ computedSignature.charCodeAt(i)
    }
    return result === 0
  } catch {
    return false
  }
}

// POST /api/webhooks/apify - Handle Apify webhook callback
export async function POST(request: NextRequest) {
  try {
    // Get webhook signature for validation (if configured)
    const signature = request.headers.get('x-apify-webhook-signature')
    const webhookSecret = process.env.APIFY_WEBHOOK_SECRET

    // Get raw body for signature validation
    const rawBody = await request.text()

    // Validate signature if secret is configured
    if (webhookSecret) {
      if (!signature) {
        console.log('[Webhook Apify] Missing signature header')
        return NextResponse.json(
          { error: 'Missing webhook signature' },
          { status: 401 }
        )
      }

      const isValid = await validateSignature(rawBody, signature, webhookSecret)
      if (!isValid) {
        console.log('[Webhook Apify] Invalid signature')
        return NextResponse.json(
          { error: 'Invalid webhook signature' },
          { status: 401 }
        )
      }
      console.log('[Webhook Apify] Signature validated successfully')
    }

    // Parse the payload (we already read it as text)
    const payload: ApifyWebhookPayload = JSON.parse(rawBody)
    console.log('[Webhook Apify] Received webhook:', JSON.stringify(payload).substring(0, 200))

    const supabase = getSupabase()

    // Extract job info from payload
    const actorRunId = payload.resource?.id || payload.eventData?.actorRunId
    const status = payload.resource?.status || payload.eventData?.status
    const datasetId = payload.resource?.defaultDatasetId

    // Custom fields for direct job linking
    const brandId = payload.brandId
    const jobId = payload.jobId

    // If we have a job ID, update it directly
    if (jobId) {
      console.log('[Webhook Apify] Updating job:', jobId, 'status:', status)

      let scrapeStatus = 'running'
      if (status === 'SUCCEEDED') scrapeStatus = 'completed'
      else if (status === 'FAILED' || status === 'ABORTED' || status === 'TIMED-OUT') scrapeStatus = 'failed'

      const updateData: Record<string, unknown> = {
        status: scrapeStatus,
      }

      if (scrapeStatus === 'completed' || scrapeStatus === 'failed') {
        updateData.completed_at = new Date().toISOString()
      }

      if (scrapeStatus === 'failed') {
        updateData.error_message = `Apify run ${status}`
      }

      // Update job status
      await supabase
        .from('scrape_jobs')
        .update(updateData)
        .eq('id', jobId)

      // If completed, update brand and fetch data
      if (scrapeStatus === 'completed' && brandId && datasetId) {
        // Update brand last_scraped_at
        await supabase
          .from('brands')
          .update({ last_scraped_at: new Date().toISOString() })
          .eq('id', brandId)

        // Fetch and import data from Apify dataset
        await importApifyData(datasetId, brandId, jobId, supabase)
      } else if (scrapeStatus === 'completed' && brandId) {
        // Just update brand timestamp
        await supabase
          .from('brands')
          .update({ last_scraped_at: new Date().toISOString() })
          .eq('id', brandId)
      }

      return NextResponse.json({ success: true, message: 'Job updated' })
    }

    // If no job ID, try to find job by actorRunId or update all pending jobs
    console.log('[Webhook Apify] No job ID provided, webhook received with status:', status)

    return NextResponse.json({
      success: true,
      message: 'Webhook received',
      received: { actorRunId, status, datasetId }
    })
  } catch (error) {
    console.error('[Webhook Apify] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Import data from Apify dataset
async function importApifyData(
  datasetId: string,
  brandId: string,
  jobId: string,
  supabase: ReturnType<typeof getSupabase>
) {
  try {
    const apifyToken = process.env.APIFY_TOKEN
    if (!apifyToken) {
      console.error('[Webhook Apify] No APIFY_TOKEN configured')
      return
    }

    // Fetch data from Apify dataset
    const datasetUrl = `https://api.apify.com/v2/datasets/${datasetId}/items?token=${apifyToken}`
    const response = await fetch(datasetUrl)

    if (!response.ok) {
      console.error('[Webhook Apify] Failed to fetch dataset:', response.statusText)
      return
    }

    const videos: ApifyVideoData[] = await response.json()
    console.log('[Webhook Apify] Fetched videos from dataset:', videos.length)

    // Get accounts for this brand
    const { data: accounts } = await supabase
      .from('competitor_accounts')
      .select('id, handle')
      .eq('brand_id', brandId)

    if (!accounts || accounts.length === 0) {
      console.log('[Webhook Apify] No accounts found for brand')
      return
    }

    const accountMap = new Map(accounts.map(a => [a.handle.toLowerCase(), a.id]))

    let videosImported = 0

    for (const video of videos) {
      // Get video data with fallbacks for different Apify scraper formats
      const videoId = video.id || video.videoId || ''
      const caption = video.caption || video.desc || video.description || ''
      const views = video.plays || video.views || 0
      const likes = video.diggCount || video.likes || 0
      const comments = video.commentCount || video.comments || 0
      const shares = video.shareCount || video.shares || 0
      const saves = video.collectCount || video.saves || 0
      const authorHandle = video.author?.uniqueId || video.authorMeta?.name || ''

      // Find account
      const accountId = accountMap.get(authorHandle.toLowerCase())
      if (!accountId) {
        console.log('[Webhook Apify] Account not found for:', authorHandle)
        continue
      }

      // Calculate virality score
      const viralityScore = calculateViralityScore(views, comments, shares, saves)

      // Detect content attributes
      const hookType = detectHookType(caption)
      const format = detectFormat(caption)
      const emotion = detectEmotion(caption)

      // Parse creation time
      let discoveredAt = new Date().toISOString()
      if (video.createTimeISO) {
        discoveredAt = video.createTimeISO
      } else if (video.createTime) {
        discoveredAt = new Date(video.createTime * 1000).toISOString()
      }

      // Upsert video
      const { error } = await supabase
        .from('competitor_videos')
        .upsert({
          video_id: videoId,
          account_id: accountId,
          caption,
          views,
          likes,
          comments,
          shares,
          virality_score: viralityScore,
          hook_type: hookType,
          content_format: format,
          emotional_trigger: emotion,
          discovered_at: discoveredAt,
          metrics_updated_at: new Date().toISOString()
        }, {
          onConflict: 'video_id'
        })

      if (error) {
        console.error('[Webhook Apify] Error upserting video:', error)
      } else {
        videosImported++
      }
    }

    // Update job with video count
    await supabase
      .from('scrape_jobs')
      .update({
        videos_found: videosImported,
        accounts_processed: accounts.length
      })
      .eq('id', jobId)

    console.log('[Webhook Apify] Imported videos:', videosImported)
  } catch (error) {
    console.error('[Webhook Apify] Error importing data:', error)
  }
}

// GET /api/webhooks/apify - Health check / documentation
export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Apify webhook endpoint',
    documentation: {
      method: 'POST',
      contentType: 'application/json',
      expectedPayload: {
        resource: {
          id: 'Apify run ID',
          status: 'SUCCEEDED | FAILED | ABORTED | TIMED-OUT',
          defaultDatasetId: 'Dataset ID for results'
        },
        brandId: 'Optional: Brand ID for direct linking',
        jobId: 'Optional: Scrape job ID for direct linking'
      }
    }
  })
}
