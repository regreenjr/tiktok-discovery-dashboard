import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'

// Hook types
const HOOK_TYPES = ['Question', 'Controversial', 'Story', 'Tutorial', 'Curiosity', 'Shock'] as const
type HookType = typeof HOOK_TYPES[number]

// Formats
const FORMATS = ['Tutorial', 'Talking Head', 'Slideshow', 'Duet', 'Stitch', 'Trend', 'Storytime'] as const
type Format = typeof FORMATS[number]

// Emotions
const EMOTIONS = ['Curiosity', 'Excitement', 'Inspiration', 'FOMO', 'Humor', 'Shock', 'Nostalgia'] as const
type Emotion = typeof EMOTIONS[number]

// Keywords for hook type detection
const HOOK_KEYWORDS: Record<HookType, string[]> = {
  'Question': ['?', 'what', 'why', 'how', 'did you know', 'have you', 'can you', 'would you', 'ever wondered'],
  'Controversial': ['unpopular opinion', 'hot take', 'everyone is wrong', 'nobody talks', 'disagree', 'controversial'],
  'Story': ['story', 'happened', 'experience', 'told me', 'let me tell', 'one time', 'remember when', 'psst', 'so this'],
  'Tutorial': ['how to', 'tutorial', 'step', 'guide', 'learn', 'here\'s how', 'tip', 'trick', 'way to', 'secret'],
  'Curiosity': ['wait', 'until', 'this changed', 'blew my mind', 'discover', 'find out', 'reveal', 'secret'],
  'Shock': ['omg', 'can\'t believe', 'shocking', 'crazy', 'insane', 'unbelievable', 'mind-blowing', 'wow']
}

// Keywords for format detection
const FORMAT_KEYWORDS: Record<Format, string[]> = {
  'Tutorial': ['how to', 'tutorial', 'step', 'guide', 'learn', 'convert', 'check', 'do this', 'here\'s'],
  'Talking Head': ['let me', 'i think', 'my opinion', 'i believe', 'speaking', 'saying'],
  'Slideshow': ['save', 'bookmark', 'quotes', 'list', 'things', 'tips', 'ways'],
  'Duet': ['duet', 'react', 'reply'],
  'Stitch': ['stitch', 'responding'],
  'Trend': ['trend', 'viral', 'challenge', 'dance'],
  'Storytime': ['story', 'happened', 'experience', 'time when']
}

// Keywords for emotion detection
const EMOTION_KEYWORDS: Record<Emotion, string[]> = {
  'Curiosity': ['discover', 'find out', 'learn', 'secret', 'hidden', 'reveal', 'what if', 'wonder'],
  'Excitement': ['amazing', 'awesome', 'love', 'best', 'incredible', 'exciting', 'happy', 'elevate', 'transform'],
  'Inspiration': ['inspire', 'motivated', 'dream', 'believe', 'achieve', 'goals', 'success', 'powerful', 'embrace'],
  'FOMO': ['miss', 'limited', 'now', 'hurry', 'before', 'last chance', 'too many', 'space', 'got too'],
  'Humor': ['funny', 'lol', 'haha', 'joke', 'laugh', 'hilarious', 'comedy'],
  'Shock': ['shock', 'can\'t believe', 'omg', 'crazy', 'insane', 'what', 'wow'],
  'Nostalgia': ['remember', 'back when', 'used to', 'old', 'memories', 'childhood']
}

// Detect hook type from caption
function detectHookType(caption: string): HookType {
  const lowerCaption = caption.toLowerCase()

  // Score each hook type
  const scores: Record<HookType, number> = {
    'Question': 0,
    'Controversial': 0,
    'Story': 0,
    'Tutorial': 0,
    'Curiosity': 0,
    'Shock': 0
  }

  for (const [hookType, keywords] of Object.entries(HOOK_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lowerCaption.includes(keyword.toLowerCase())) {
        scores[hookType as HookType] += 1
      }
    }
  }

  // Special case: if caption starts with or contains a question mark
  if (caption.includes('?')) {
    scores['Question'] += 2
  }

  // Find highest scoring hook type
  let maxScore = 0
  let selectedHook: HookType = 'Curiosity' // Default

  for (const [hookType, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score
      selectedHook = hookType as HookType
    }
  }

  return selectedHook
}

// Detect format from caption
function detectFormat(caption: string): Format {
  const lowerCaption = caption.toLowerCase()

  // Score each format
  const scores: Record<Format, number> = {
    'Tutorial': 0,
    'Talking Head': 0,
    'Slideshow': 0,
    'Duet': 0,
    'Stitch': 0,
    'Trend': 0,
    'Storytime': 0
  }

  for (const [format, keywords] of Object.entries(FORMAT_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lowerCaption.includes(keyword.toLowerCase())) {
        scores[format as Format] += 1
      }
    }
  }

  // Find highest scoring format
  let maxScore = 0
  let selectedFormat: Format = 'Talking Head' // Default

  for (const [format, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score
      selectedFormat = format as Format
    }
  }

  return selectedFormat
}

// Detect emotion from caption
function detectEmotion(caption: string): Emotion {
  const lowerCaption = caption.toLowerCase()

  // Score each emotion
  const scores: Record<Emotion, number> = {
    'Curiosity': 0,
    'Excitement': 0,
    'Inspiration': 0,
    'FOMO': 0,
    'Humor': 0,
    'Shock': 0,
    'Nostalgia': 0
  }

  for (const [emotion, keywords] of Object.entries(EMOTION_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lowerCaption.includes(keyword.toLowerCase())) {
        scores[emotion as Emotion] += 1
      }
    }
  }

  // Find highest scoring emotion
  let maxScore = 0
  let selectedEmotion: Emotion = 'Curiosity' // Default

  for (const [emotion, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score
      selectedEmotion = emotion as Emotion
    }
  }

  return selectedEmotion
}

// POST /api/analyze/auto-tag - Auto-tag videos with hook type, format, emotion
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { brand_id, force = false } = body

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

    console.log('[API auto-tag] Starting auto-tagging for brand:', brand_id)

    const supabase = getSupabase()

    // Get account IDs for this brand
    const { data: accounts, error: accountsError } = await supabase
      .from('competitor_accounts')
      .select('id')
      .eq('brand_id', brand_id)

    if (accountsError) {
      console.error('[API auto-tag] Error fetching accounts:', accountsError)
      return NextResponse.json({ error: accountsError.message }, { status: 500 })
    }

    if (!accounts || accounts.length === 0) {
      return NextResponse.json({
        success: true,
        data: { videosTagged: 0, message: 'No accounts found for this brand' }
      })
    }

    const accountIds = accounts.map(a => a.id)

    // Get videos to tag
    let query = supabase
      .from('competitor_videos')
      .select('id, caption, hook_type, content_format, emotional_trigger')
      .in('account_id', accountIds)

    // Only get untagged videos unless force is true
    if (!force) {
      query = query.or('hook_type.is.null,content_format.is.null,emotional_trigger.is.null')
    }

    const { data: videos, error: videosError } = await query

    if (videosError) {
      console.error('[API auto-tag] Error fetching videos:', videosError)
      return NextResponse.json({ error: videosError.message }, { status: 500 })
    }

    if (!videos || videos.length === 0) {
      return NextResponse.json({
        success: true,
        data: { videosTagged: 0, message: 'All videos already tagged' }
      })
    }

    console.log('[API auto-tag] Videos to tag:', videos.length)

    // Tag each video
    let taggedCount = 0
    const tagResults: { id: string; hook_type: string; content_format: string; emotional_trigger: string }[] = []

    for (const video of videos) {
      const caption = video.caption || ''

      const hook_type = force || !video.hook_type ? detectHookType(caption) : video.hook_type
      const content_format = force || !video.content_format ? detectFormat(caption) : video.content_format
      const emotional_trigger = force || !video.emotional_trigger ? detectEmotion(caption) : video.emotional_trigger

      // Update video
      const { error: updateError } = await supabase
        .from('competitor_videos')
        .update({
          hook_type,
          content_format,
          emotional_trigger,
          metrics_updated_at: new Date().toISOString()
        })
        .eq('id', video.id)

      if (updateError) {
        console.error('[API auto-tag] Error updating video:', video.id, updateError)
      } else {
        taggedCount++
        tagResults.push({
          id: video.id,
          hook_type,
          content_format,
          emotional_trigger
        })
      }
    }

    console.log('[API auto-tag] Tagged videos:', taggedCount)

    // Get variety stats
    const hookTypes = new Set(tagResults.map(r => r.hook_type))
    const formats = new Set(tagResults.map(r => r.content_format))
    const emotions = new Set(tagResults.map(r => r.emotional_trigger))

    return NextResponse.json({
      success: true,
      data: {
        videosTagged: taggedCount,
        variety: {
          hookTypes: Array.from(hookTypes),
          formats: Array.from(formats),
          emotions: Array.from(emotions)
        },
        samples: tagResults.slice(0, 5)
      }
    })
  } catch (error) {
    console.error('[API auto-tag] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET /api/analyze/auto-tag - Check auto-tag status
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const brandId = searchParams.get('brand_id')

    if (!brandId) {
      return NextResponse.json(
        { error: 'Brand ID is required' },
        { status: 400 }
      )
    }

    const supabase = getSupabase()

    // Get account IDs for this brand
    const { data: accounts } = await supabase
      .from('competitor_accounts')
      .select('id')
      .eq('brand_id', brandId)

    if (!accounts || accounts.length === 0) {
      return NextResponse.json({
        success: true,
        data: { totalVideos: 0, taggedVideos: 0, untaggedVideos: 0 }
      })
    }

    const accountIds = accounts.map(a => a.id)

    // Get all videos count
    const { count: totalCount } = await supabase
      .from('competitor_videos')
      .select('*', { count: 'exact', head: true })
      .in('account_id', accountIds)

    // Get untagged videos count
    const { count: untaggedCount } = await supabase
      .from('competitor_videos')
      .select('*', { count: 'exact', head: true })
      .in('account_id', accountIds)
      .or('hook_type.is.null,content_format.is.null,emotional_trigger.is.null')

    return NextResponse.json({
      success: true,
      data: {
        totalVideos: totalCount || 0,
        taggedVideos: (totalCount || 0) - (untaggedCount || 0),
        untaggedVideos: untaggedCount || 0
      }
    })
  } catch (error) {
    console.error('[API auto-tag] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
