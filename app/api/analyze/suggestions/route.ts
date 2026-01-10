import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'

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

// Content suggestion structure
interface ContentSuggestion {
  id: string
  type: 'content_idea' | 'hook_template' | 'format_recommendation' | 'hashtag_strategy' | 'posting_time'
  title: string
  description: string
  actionItems: string[]
  basedOn: {
    competitorVideos: number
    topPerformers: string[]
  }
  expectedImpact: 'high' | 'medium' | 'low'
  difficulty: 'easy' | 'medium' | 'hard'
  tags: string[]
}

// Suggestions response structure
interface SuggestionsResponse {
  brandId: string
  generatedAt: string
  totalSuggestions: number
  suggestions: ContentSuggestion[]
  summary: {
    topOpportunity: string
    quickWins: string[]
    focusAreas: string[]
  }
}

// Helper function to extract hashtags from caption
function extractHashtags(caption: string): string[] {
  const hashtagRegex = /#\w+/g
  const matches = caption.match(hashtagRegex)
  return matches ? matches.map(h => h.toLowerCase()) : []
}

// Generate content idea suggestions based on top performers
function generateContentIdeas(videos: Video[]): ContentSuggestion[] {
  const suggestions: ContentSuggestion[] = []

  // Sort by virality
  const topVideos = [...videos].sort((a, b) => b.virality_score - a.virality_score)

  // Group by hook type to find patterns
  const hookGroups = new Map<string, Video[]>()
  for (const video of videos) {
    if (video.hook_type) {
      const existing = hookGroups.get(video.hook_type) || []
      existing.push(video)
      hookGroups.set(video.hook_type, existing)
    }
  }

  // Find the best performing hook type
  let bestHookType = ''
  let bestHookAvgVirality = 0
  for (const [hookType, hookVideos] of Array.from(hookGroups.entries())) {
    const avgVirality = hookVideos.reduce((sum, v) => sum + v.virality_score, 0) / hookVideos.length
    if (avgVirality > bestHookAvgVirality) {
      bestHookAvgVirality = avgVirality
      bestHookType = hookType
    }
  }

  // Generate content idea based on top performer
  if (topVideos.length > 0) {
    const topVideo = topVideos[0]
    const hookDescription = getHookDescription(topVideo.hook_type || 'curiosity')

    suggestions.push({
      id: `idea-${Date.now()}-1`,
      type: 'content_idea',
      title: `Create a "${topVideo.hook_type || 'Curiosity'}" Style Video`,
      description: `Your competitors' top-performing content uses ${topVideo.hook_type || 'curiosity'} hooks. Create similar content focusing on ${hookDescription}. The top performer achieved ${topVideo.virality_score.toFixed(1)}x virality.`,
      actionItems: [
        `Start with a ${topVideo.hook_type || 'curiosity'}-based opening line`,
        `Use ${topVideo.content_format || 'the same format'} as the top performer`,
        `Target the ${topVideo.emotional_trigger || 'same emotion'} emotional trigger`,
        'Post during peak hours (see posting time suggestions)'
      ],
      basedOn: {
        competitorVideos: videos.length,
        topPerformers: topVideos.slice(0, 3).map(v => v.caption?.substring(0, 50) || 'No caption')
      },
      expectedImpact: 'high',
      difficulty: 'medium',
      tags: [topVideo.hook_type || 'hook', topVideo.content_format || 'format', topVideo.emotional_trigger || 'emotion']
    })
  }

  // Generate idea based on trending format
  const formatGroups = new Map<string, Video[]>()
  for (const video of videos) {
    if (video.content_format) {
      const existing = formatGroups.get(video.content_format) || []
      existing.push(video)
      formatGroups.set(video.content_format, existing)
    }
  }

  let bestFormat = ''
  let bestFormatAvgVirality = 0
  for (const [format, formatVideos] of Array.from(formatGroups.entries())) {
    const avgVirality = formatVideos.reduce((sum, v) => sum + v.virality_score, 0) / formatVideos.length
    if (avgVirality > bestFormatAvgVirality && formatVideos.length >= 2) {
      bestFormatAvgVirality = avgVirality
      bestFormat = format
    }
  }

  if (bestFormat) {
    suggestions.push({
      id: `idea-${Date.now()}-2`,
      type: 'content_idea',
      title: `Double Down on ${bestFormat} Content`,
      description: `${bestFormat} videos are performing ${bestFormatAvgVirality.toFixed(1)}x on average. This format resonates well with your target audience.`,
      actionItems: [
        `Create 2-3 ${bestFormat} videos this week`,
        'Test different hooks within this format',
        'Experiment with different emotional triggers',
        'Track performance to identify winning combinations'
      ],
      basedOn: {
        competitorVideos: formatGroups.get(bestFormat)?.length || 0,
        topPerformers: (formatGroups.get(bestFormat) || []).slice(0, 3).map(v => v.caption?.substring(0, 50) || 'No caption')
      },
      expectedImpact: 'high',
      difficulty: 'easy',
      tags: [bestFormat, 'format', 'proven']
    })
  }

  return suggestions
}

// Generate hook template suggestions
function generateHookTemplates(videos: Video[]): ContentSuggestion[] {
  const suggestions: ContentSuggestion[] = []

  // Group by hook type
  const hookGroups = new Map<string, Video[]>()
  for (const video of videos) {
    if (video.hook_type) {
      const existing = hookGroups.get(video.hook_type) || []
      existing.push(video)
      hookGroups.set(video.hook_type, existing)
    }
  }

  // Generate templates for top 3 hook types
  const sortedHooks = Array.from(hookGroups.entries())
    .map(([hookType, hookVideos]) => ({
      hookType,
      avgVirality: hookVideos.reduce((sum, v) => sum + v.virality_score, 0) / hookVideos.length,
      count: hookVideos.length,
      examples: hookVideos.slice(0, 3)
    }))
    .sort((a, b) => b.avgVirality - a.avgVirality)

  for (const hook of sortedHooks.slice(0, 2)) {
    const templates = getHookTemplates(hook.hookType)

    suggestions.push({
      id: `hook-${Date.now()}-${hook.hookType}`,
      type: 'hook_template',
      title: `${hook.hookType} Hook Templates`,
      description: `${hook.hookType} hooks achieve ${hook.avgVirality.toFixed(1)}x average virality. Use these proven templates:`,
      actionItems: templates,
      basedOn: {
        competitorVideos: hook.count,
        topPerformers: hook.examples.map(v => v.caption?.substring(0, 50) || 'No caption')
      },
      expectedImpact: hook.avgVirality > 2 ? 'high' : 'medium',
      difficulty: 'easy',
      tags: [hook.hookType, 'hook', 'template']
    })
  }

  return suggestions
}

// Generate hashtag strategy suggestions
function generateHashtagStrategies(videos: Video[]): ContentSuggestion[] {
  const suggestions: ContentSuggestion[] = []

  // Analyze hashtag performance
  const hashtagMap = new Map<string, { count: number; totalVirality: number }>()
  for (const video of videos) {
    const hashtags = extractHashtags(video.caption || '')
    for (const hashtag of hashtags) {
      const existing = hashtagMap.get(hashtag) || { count: 0, totalVirality: 0 }
      existing.count++
      existing.totalVirality += video.virality_score
      hashtagMap.set(hashtag, existing)
    }
  }

  // Sort by average virality
  const topHashtags = Array.from(hashtagMap.entries())
    .filter(([, data]) => data.count >= 2)
    .map(([hashtag, data]) => ({
      hashtag,
      avgVirality: data.totalVirality / data.count,
      count: data.count
    }))
    .sort((a, b) => b.avgVirality - a.avgVirality)
    .slice(0, 10)

  if (topHashtags.length > 0) {
    suggestions.push({
      id: `hashtag-${Date.now()}`,
      type: 'hashtag_strategy',
      title: 'Optimized Hashtag Strategy',
      description: `Based on competitor analysis, these hashtags drive the highest virality. Mix high-performing niche tags with broader reach tags.`,
      actionItems: [
        `Always include: ${topHashtags.slice(0, 3).map(h => h.hashtag).join(', ')}`,
        `Rotate between: ${topHashtags.slice(3, 6).map(h => h.hashtag).join(', ')}`,
        'Use 3-5 hashtags per post for optimal reach',
        'Track which combinations work best for your content'
      ],
      basedOn: {
        competitorVideos: videos.length,
        topPerformers: topHashtags.map(h => `${h.hashtag} (${h.avgVirality.toFixed(1)}x)`)
      },
      expectedImpact: 'medium',
      difficulty: 'easy',
      tags: ['hashtags', 'reach', 'discovery']
    })
  }

  return suggestions
}

// Generate posting time suggestions
function generatePostingTimeSuggestions(videos: Video[]): ContentSuggestion[] {
  const suggestions: ContentSuggestion[] = []

  // Analyze by day and hour
  const hourMap = new Map<number, { totalVirality: number; count: number }>()
  const dayMap = new Map<string, { totalVirality: number; count: number }>()
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

  for (const video of videos) {
    const date = new Date(video.discovered_at)
    const hour = date.getUTCHours()
    const day = days[date.getUTCDay()]

    const hourData = hourMap.get(hour) || { totalVirality: 0, count: 0 }
    hourData.totalVirality += video.virality_score
    hourData.count++
    hourMap.set(hour, hourData)

    const dayData = dayMap.get(day) || { totalVirality: 0, count: 0 }
    dayData.totalVirality += video.virality_score
    dayData.count++
    dayMap.set(day, dayData)
  }

  // Find best hours
  const bestHours = Array.from(hourMap.entries())
    .map(([hour, data]) => ({ hour, avgVirality: data.totalVirality / data.count }))
    .sort((a, b) => b.avgVirality - a.avgVirality)
    .slice(0, 3)

  // Find best days
  const bestDays = Array.from(dayMap.entries())
    .map(([day, data]) => ({ day, avgVirality: data.totalVirality / data.count }))
    .sort((a, b) => b.avgVirality - a.avgVirality)
    .slice(0, 3)

  if (bestHours.length > 0) {
    suggestions.push({
      id: `posting-${Date.now()}`,
      type: 'posting_time',
      title: 'Optimal Posting Schedule',
      description: `Post during peak engagement times to maximize virality. These times are based on when competitor content performs best.`,
      actionItems: [
        `Best hours: ${bestHours.map(h => `${h.hour}:00 UTC (${h.avgVirality.toFixed(1)}x)`).join(', ')}`,
        `Best days: ${bestDays.map(d => `${d.day} (${d.avgVirality.toFixed(1)}x)`).join(', ')}`,
        'Schedule content for these time slots',
        'Test posting 30 minutes before peak for algorithm pickup'
      ],
      basedOn: {
        competitorVideos: videos.length,
        topPerformers: []
      },
      expectedImpact: 'medium',
      difficulty: 'easy',
      tags: ['timing', 'schedule', 'optimization']
    })
  }

  return suggestions
}

// Generate format recommendations
function generateFormatRecommendations(videos: Video[]): ContentSuggestion[] {
  const suggestions: ContentSuggestion[] = []

  // Group by format
  const formatGroups = new Map<string, Video[]>()
  for (const video of videos) {
    if (video.content_format) {
      const existing = formatGroups.get(video.content_format) || []
      existing.push(video)
      formatGroups.set(video.content_format, existing)
    }
  }

  // Find underutilized high-performing formats
  const formatAnalysis = Array.from(formatGroups.entries())
    .map(([format, formatVideos]) => ({
      format,
      avgVirality: formatVideos.reduce((sum, v) => sum + v.virality_score, 0) / formatVideos.length,
      count: formatVideos.length,
      examples: formatVideos
    }))
    .sort((a, b) => b.avgVirality - a.avgVirality)

  // Suggest trying formats that competitors use successfully but sparingly
  const highPerformingRare = formatAnalysis.filter(f => f.avgVirality > 2 && f.count <= 3)

  for (const format of highPerformingRare.slice(0, 1)) {
    suggestions.push({
      id: `format-${Date.now()}-${format.format}`,
      type: 'format_recommendation',
      title: `Try More ${format.format} Content`,
      description: `${format.format} content shows strong performance (${format.avgVirality.toFixed(1)}x) but is underutilized. This is an opportunity to stand out.`,
      actionItems: [
        `Create 1-2 ${format.format} videos this week`,
        'Study the high-performing examples below',
        'Adapt the format to your unique style',
        'Track performance to validate the approach'
      ],
      basedOn: {
        competitorVideos: format.count,
        topPerformers: format.examples.slice(0, 3).map(v => v.caption?.substring(0, 50) || 'No caption')
      },
      expectedImpact: 'high',
      difficulty: 'medium',
      tags: [format.format, 'opportunity', 'format']
    })
  }

  return suggestions
}

// Helper function to get hook description
function getHookDescription(hookType: string): string {
  const descriptions: Record<string, string> = {
    'Question': 'posing intriguing questions that viewers want answered',
    'Controversial': 'presenting bold opinions or unexpected takes',
    'Story': 'sharing personal experiences and narratives',
    'Tutorial': 'teaching something valuable step-by-step',
    'Curiosity': 'teasing something that makes viewers want to know more',
    'Shock': 'surprising revelations or unexpected moments'
  }
  return descriptions[hookType] || 'engaging content that captures attention'
}

// Helper function to get hook templates
function getHookTemplates(hookType: string): string[] {
  const templates: Record<string, string[]> = {
    'Question': [
      '"What if I told you... [surprising fact]?"',
      '"Did you know that [unexpected truth]?"',
      '"Why does no one talk about [hidden truth]?"',
      '"Can you guess what happens next?"'
    ],
    'Controversial': [
      '"Unpopular opinion: [bold statement]"',
      '"Everyone is wrong about [topic]"',
      '"This is going to upset some people, but..."',
      '"[Industry] doesn\'t want you to know this"'
    ],
    'Story': [
      '"So this happened to me today..."',
      '"You won\'t believe what I just discovered"',
      '"Let me tell you about the time..."',
      '"I made a huge mistake and here\'s what I learned"'
    ],
    'Tutorial': [
      '"Here\'s how to [achieve result] in [time]"',
      '"The secret to [desired outcome]..."',
      '"Stop doing [common mistake]. Do this instead."',
      '"3 steps to [achievement]"'
    ],
    'Curiosity': [
      '"Wait until the end..."',
      '"This changed everything for me"',
      '"I\'ve been doing this wrong my whole life"',
      '"The thing about [topic] that nobody tells you"'
    ],
    'Shock': [
      '"I can\'t believe this actually works"',
      '"This blew my mind"',
      '"Wait for it..."',
      '"[Number] out of [number] people don\'t know this"'
    ]
  }
  return templates[hookType] || [
    'Open with a strong statement',
    'Ask an engaging question',
    'Promise valuable information',
    'Create a curiosity gap'
  ]
}

// GET /api/analyze/suggestions - Get AI content suggestions
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

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(brandId)) {
      return NextResponse.json(
        { error: 'Invalid brand ID format' },
        { status: 400 }
      )
    }

    console.log('[API suggestions] Generating suggestions for brand:', brandId)

    const supabase = getSupabase()

    // First, get account IDs for this brand
    const { data: accounts, error: accountsError } = await supabase
      .from('competitor_accounts')
      .select('id')
      .eq('brand_id', brandId)

    if (accountsError) {
      console.error('[API suggestions] Error fetching accounts:', accountsError)
      return NextResponse.json({ error: accountsError.message }, { status: 500 })
    }

    if (!accounts || accounts.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          brandId,
          generatedAt: new Date().toISOString(),
          totalSuggestions: 0,
          suggestions: [],
          summary: {
            topOpportunity: 'Add competitor accounts and run the scraper to get personalized suggestions',
            quickWins: [],
            focusAreas: []
          }
        }
      })
    }

    const accountIds = accounts.map(a => a.id)

    // Get all videos for analysis
    const { data: videos, error: videosError } = await supabase
      .from('competitor_videos')
      .select('*')
      .in('account_id', accountIds)
      .order('virality_score', { ascending: false })

    if (videosError) {
      console.error('[API suggestions] Error fetching videos:', videosError)
      return NextResponse.json({ error: videosError.message }, { status: 500 })
    }

    if (!videos || videos.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          brandId,
          generatedAt: new Date().toISOString(),
          totalSuggestions: 0,
          suggestions: [],
          summary: {
            topOpportunity: 'Run the scraper to collect competitor videos and get personalized suggestions',
            quickWins: [],
            focusAreas: []
          }
        }
      })
    }

    // Generate all suggestions
    const contentIdeas = generateContentIdeas(videos as Video[])
    const hookTemplates = generateHookTemplates(videos as Video[])
    const hashtagStrategies = generateHashtagStrategies(videos as Video[])
    const postingTimeSuggestions = generatePostingTimeSuggestions(videos as Video[])
    const formatRecommendations = generateFormatRecommendations(videos as Video[])

    const allSuggestions = [
      ...contentIdeas,
      ...hookTemplates,
      ...hashtagStrategies,
      ...postingTimeSuggestions,
      ...formatRecommendations
    ]

    // Generate summary
    const topVideo = videos[0] as Video
    const topOpportunity = contentIdeas.length > 0
      ? contentIdeas[0].title
      : `Create content similar to top performers`

    const quickWins = allSuggestions
      .filter(s => s.difficulty === 'easy' && s.expectedImpact !== 'low')
      .slice(0, 3)
      .map(s => s.title)

    const focusAreas = [
      topVideo.hook_type ? `${topVideo.hook_type} hooks` : 'Hook optimization',
      topVideo.content_format ? `${topVideo.content_format} format` : 'Format testing',
      'Hashtag strategy'
    ]

    const response: SuggestionsResponse = {
      brandId,
      generatedAt: new Date().toISOString(),
      totalSuggestions: allSuggestions.length,
      suggestions: allSuggestions,
      summary: {
        topOpportunity,
        quickWins,
        focusAreas
      }
    }

    console.log('[API suggestions] Generated suggestions:', allSuggestions.length)

    return NextResponse.json({
      success: true,
      data: response
    })
  } catch (error) {
    console.error('[API suggestions] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
