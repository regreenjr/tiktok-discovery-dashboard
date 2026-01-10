import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'
import OpenAI from 'openai'

// Video type from competitor_videos table
interface Video {
  id: string
  account_id: string
  video_id: string
  caption: string
  views: number
  comments: number
  shares: number
  likes: number
  virality_score: number
  hook_type: string | null
  content_format: string | null
  emotional_trigger: string | null
  discovered_at: string
}

// AI Analysis response structure
interface VideoAnalysis {
  videoId: string
  hookBreakdown: {
    type: string
    effectiveness: string
    openingLine: string
    timestamp: string
    analysis: string
  }
  formatAnalysis: {
    type: string
    pacing: string
    structure: string
    visualElements: string[]
    analysis: string
  }
  emotionMapping: {
    primaryEmotion: string
    secondaryEmotions: string[]
    emotionalArc: string
    analysis: string
  }
  whyItWorks: {
    summary: string
    keyFactors: string[]
    engagementDrivers: string[]
    replicationTips: string[]
  }
  metrics: {
    views: number
    comments: number
    shares: number
    likes: number
    viralityScore: number
  }
}

// Initialize OpenAI client
function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return null
  }
  return new OpenAI({ apiKey })
}

// Generate analysis using OpenAI
async function generateAnalysis(video: Video): Promise<VideoAnalysis> {
  const openai = getOpenAIClient()

  // Calculate engagement metrics
  const engagementRate = video.views > 0
    ? ((video.comments + video.shares + video.likes) / video.views * 100).toFixed(2)
    : '0'

  // If no OpenAI key, provide rule-based analysis
  if (!openai) {
    return generateRuleBasedAnalysis(video, engagementRate)
  }

  try {
    const prompt = `Analyze this TikTok video for viral potential:

Caption: "${video.caption}"
Views: ${video.views.toLocaleString()}
Comments: ${video.comments.toLocaleString()}
Shares: ${video.shares.toLocaleString()}
Likes: ${video.likes.toLocaleString()}
Virality Score: ${video.virality_score}
Engagement Rate: ${engagementRate}%

Provide a detailed analysis in the following JSON format:
{
  "hookBreakdown": {
    "type": "curiosity|shock|question|story|controversial|relatable",
    "effectiveness": "high|medium|low",
    "openingLine": "first few words that grab attention",
    "timestamp": "0:00-0:03",
    "analysis": "why this hook works or doesn't"
  },
  "formatAnalysis": {
    "type": "talking_head|slideshow|duet|stitch|tutorial|storytime|trend",
    "pacing": "fast|medium|slow",
    "structure": "description of content structure",
    "visualElements": ["element1", "element2"],
    "analysis": "why this format works for the content"
  },
  "emotionMapping": {
    "primaryEmotion": "main emotion evoked",
    "secondaryEmotions": ["emotion1", "emotion2"],
    "emotionalArc": "how emotions progress through the video",
    "analysis": "why these emotions drive engagement"
  },
  "whyItWorks": {
    "summary": "1-2 sentence summary of why this content performs",
    "keyFactors": ["factor1", "factor2", "factor3"],
    "engagementDrivers": ["driver1", "driver2"],
    "replicationTips": ["tip1", "tip2", "tip3"]
  }
}

Only respond with valid JSON.`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert TikTok content analyst. Analyze videos and explain why they go viral. Always respond with valid JSON only.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1000
    })

    const responseText = completion.choices[0]?.message?.content || ''

    // Parse JSON response
    const parsed = JSON.parse(responseText)

    return {
      videoId: video.id,
      hookBreakdown: parsed.hookBreakdown,
      formatAnalysis: parsed.formatAnalysis,
      emotionMapping: parsed.emotionMapping,
      whyItWorks: parsed.whyItWorks,
      metrics: {
        views: video.views,
        comments: video.comments,
        shares: video.shares,
        likes: video.likes,
        viralityScore: video.virality_score
      }
    }
  } catch (error) {
    console.error('[API analyze] OpenAI error:', error)
    // Fall back to rule-based analysis
    return generateRuleBasedAnalysis(video, engagementRate)
  }
}

// Rule-based analysis when OpenAI is not available
function generateRuleBasedAnalysis(video: Video, engagementRate: string): VideoAnalysis {
  const caption = video.caption || ''
  const captionLower = caption.toLowerCase()

  // Detect hook type from caption
  let hookType = 'curiosity'
  let hookEffectiveness: 'high' | 'medium' | 'low' = 'medium'

  if (captionLower.includes('?') || captionLower.startsWith('what') || captionLower.startsWith('how') || captionLower.startsWith('why')) {
    hookType = 'question'
    hookEffectiveness = 'high'
  } else if (captionLower.includes('wait') || captionLower.includes('omg') || captionLower.includes('you wont believe')) {
    hookType = 'shock'
    hookEffectiveness = 'high'
  } else if (captionLower.includes('story') || captionLower.includes('happened')) {
    hookType = 'story'
    hookEffectiveness = 'medium'
  } else if (captionLower.includes('hot take') || captionLower.includes('unpopular opinion')) {
    hookType = 'controversial'
    hookEffectiveness = 'high'
  } else if (captionLower.includes('pov') || captionLower.includes('when you') || captionLower.includes('that feeling')) {
    hookType = 'relatable'
    hookEffectiveness = 'medium'
  }

  // Detect format from existing data or caption
  let formatType = video.content_format || 'talking_head'
  if (captionLower.includes('tutorial') || captionLower.includes('how to')) {
    formatType = 'tutorial'
  } else if (captionLower.includes('duet')) {
    formatType = 'duet'
  } else if (captionLower.includes('stitch')) {
    formatType = 'stitch'
  }

  // Detect emotion
  let primaryEmotion = video.emotional_trigger || 'curiosity'
  const secondaryEmotions: string[] = []

  if (captionLower.includes('funny') || captionLower.includes('lol') || captionLower.includes('joke')) {
    primaryEmotion = 'humor'
    secondaryEmotions.push('joy', 'surprise')
  } else if (captionLower.includes('inspiring') || captionLower.includes('motivation')) {
    primaryEmotion = 'inspiration'
    secondaryEmotions.push('hope', 'determination')
  } else if (captionLower.includes('shocking') || captionLower.includes('crazy')) {
    primaryEmotion = 'shock'
    secondaryEmotions.push('curiosity', 'disbelief')
  }

  // Generate why it works based on metrics
  const isViral = video.virality_score >= 2.0
  const hasHighEngagement = parseFloat(engagementRate) > 5

  const keyFactors: string[] = []
  const engagementDrivers: string[] = []
  const replicationTips: string[] = []

  if (isViral) {
    keyFactors.push('Strong virality score indicates broad appeal')
    engagementDrivers.push('Content resonates across demographics')
    replicationTips.push('Study the opening 3 seconds closely')
  }

  if (hasHighEngagement) {
    keyFactors.push('High engagement rate shows active audience')
    engagementDrivers.push('Comments indicate discussion-worthy content')
    replicationTips.push('Include elements that encourage comments')
  }

  if (video.shares > video.comments) {
    keyFactors.push('High share ratio indicates valuable/relatable content')
    engagementDrivers.push('People want to share this with friends')
    replicationTips.push('Create content worth sharing')
  }

  if (hookType === 'question') {
    keyFactors.push('Question hook creates curiosity gap')
    engagementDrivers.push('Viewers watch to get the answer')
    replicationTips.push('Use question hooks in first 2 seconds')
  }

  // Add default tips if list is short
  if (replicationTips.length < 3) {
    replicationTips.push('Hook viewers in first 3 seconds')
    replicationTips.push('Match trending sounds and formats')
    replicationTips.push('Post during peak hours (7-9 PM local time)')
  }

  if (keyFactors.length < 3) {
    keyFactors.push('Clear value proposition in caption')
    keyFactors.push('Optimized for TikTok algorithm')
    keyFactors.push('Consistent with current trends')
  }

  if (engagementDrivers.length < 2) {
    engagementDrivers.push('Emotional resonance with target audience')
    engagementDrivers.push('Clear call-to-action or discussion point')
  }

  return {
    videoId: video.id,
    hookBreakdown: {
      type: hookType,
      effectiveness: hookEffectiveness,
      openingLine: caption.substring(0, 50) + (caption.length > 50 ? '...' : ''),
      timestamp: '0:00-0:03',
      analysis: `This ${hookType} hook ${hookEffectiveness === 'high' ? 'effectively captures attention' : 'could be improved'} by ${hookType === 'question' ? 'creating a curiosity gap that compels viewers to watch' : hookType === 'shock' ? 'triggering an emotional response that stops the scroll' : 'establishing interest early in the video'}.`
    },
    formatAnalysis: {
      type: formatType,
      pacing: video.virality_score > 2 ? 'fast' : 'medium',
      structure: `${formatType.replace('_', ' ')} format with ${video.views > 10000 ? 'proven broad appeal' : 'niche targeting'}`,
      visualElements: ['text overlay', 'engaging thumbnail', 'branded elements'],
      analysis: `The ${formatType.replace('_', ' ')} format ${isViral ? 'performs well with this content type' : 'could benefit from format optimization'}, delivering ${hasHighEngagement ? 'strong' : 'moderate'} engagement.`
    },
    emotionMapping: {
      primaryEmotion: primaryEmotion,
      secondaryEmotions: secondaryEmotions.length > 0 ? secondaryEmotions : ['interest', 'engagement'],
      emotionalArc: `Opens with ${hookType} to create ${primaryEmotion}, maintains interest through the content, and closes with a memorable moment.`,
      analysis: `The ${primaryEmotion} emotion ${isViral ? 'strongly resonates' : 'connects'} with the target audience, driving ${hasHighEngagement ? 'high' : 'moderate'} engagement and ${video.shares > 100 ? 'significant shareability' : 'some sharing behavior'}.`
    },
    whyItWorks: {
      summary: isViral
        ? `This video succeeds by combining a ${hookType} hook with ${primaryEmotion}-driven content in a ${formatType.replace('_', ' ')} format, achieving a ${video.virality_score.toFixed(2)}x virality score.`
        : `This video shows potential with ${hookType} elements and ${primaryEmotion} appeal. Optimizing the hook and pacing could improve performance.`,
      keyFactors: keyFactors.slice(0, 3),
      engagementDrivers: engagementDrivers.slice(0, 2),
      replicationTips: replicationTips.slice(0, 3)
    },
    metrics: {
      views: video.views,
      comments: video.comments,
      shares: video.shares,
      likes: video.likes,
      viralityScore: video.virality_score
    }
  }
}

// POST /api/analyze/video/[id] - Get AI analysis for single video
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const videoId = params.id

    console.log('[API analyze] Analyzing video:', videoId)

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(videoId)) {
      return NextResponse.json(
        { error: 'Invalid video ID format' },
        { status: 400 }
      )
    }

    const supabase = getSupabase()

    // Fetch video from competitor_videos table
    const { data: video, error } = await supabase
      .from('competitor_videos')
      .select('*')
      .eq('id', videoId)
      .single()

    if (error) {
      console.error('[API analyze] Error fetching video:', error)
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Video not found' },
          { status: 404 }
        )
      }
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    if (!video) {
      return NextResponse.json(
        { error: 'Video not found' },
        { status: 404 }
      )
    }

    // Generate analysis
    const analysis = await generateAnalysis(video as Video)

    console.log('[API analyze] Analysis complete for video:', videoId)

    return NextResponse.json({
      success: true,
      data: analysis
    })
  } catch (error) {
    console.error('[API analyze] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET /api/analyze/video/[id] - Also support GET requests
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return POST(request, { params })
}
