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

// Pattern synthesis response structure
interface PatternSynthesis {
  brandId: string
  totalVideosAnalyzed: number
  generatedAt: string
  crossVideoPatterns: {
    hookPatterns: PatternInsight[]
    formatPatterns: PatternInsight[]
    emotionPatterns: PatternInsight[]
    hashtagPatterns: HashtagPattern[]
  }
  emergingTrends: {
    rising: TrendItem[]
    declining: TrendItem[]
    stable: TrendItem[]
  }
  whatsWorkingNow: {
    summary: string
    topPerformingCombinations: Combination[]
    recommendations: string[]
  }
  postingInsights: {
    bestDays: DayInsight[]
    bestHours: HourInsight[]
    optimalFrequency: string
  }
}

interface PatternInsight {
  name: string
  count: number
  avgVirality: number
  avgViews: number
  avgEngagement: number
  trend: 'rising' | 'stable' | 'declining'
  bestExample: {
    videoId: string
    caption: string
    viralityScore: number
  } | null
}

interface HashtagPattern {
  hashtag: string
  count: number
  avgVirality: number
  videos: number
}

interface TrendItem {
  type: 'hook' | 'format' | 'emotion' | 'hashtag'
  name: string
  changePercent: number
  currentAvgVirality: number
}

interface Combination {
  hook: string
  format: string
  emotion: string
  avgVirality: number
  videoCount: number
}

interface DayInsight {
  day: string
  avgVirality: number
  videoCount: number
}

interface HourInsight {
  hour: number
  avgVirality: number
  videoCount: number
}

// Helper function to extract hashtags from caption
function extractHashtags(caption: string): string[] {
  const hashtagRegex = /#\w+/g
  const matches = caption.match(hashtagRegex)
  return matches ? matches.map(h => h.toLowerCase()) : []
}

// Helper function to calculate engagement rate
function calculateEngagement(video: Video): number {
  if (video.views === 0) return 0
  return ((video.comments + video.shares + video.likes) / video.views) * 100
}

// Helper function to group videos by attribute
function groupByAttribute(videos: Video[], attribute: keyof Video): Map<string, Video[]> {
  const groups = new Map<string, Video[]>()
  for (const video of videos) {
    const value = video[attribute] as string | null
    if (value) {
      const existing = groups.get(value) || []
      existing.push(video)
      groups.set(value, existing)
    }
  }
  return groups
}

// Calculate pattern insights for a given attribute
function calculatePatternInsights(
  videos: Video[],
  attribute: 'hook_type' | 'content_format' | 'emotional_trigger'
): PatternInsight[] {
  const groups = groupByAttribute(videos, attribute)
  const insights: PatternInsight[] = []

  for (const [name, groupVideos] of Array.from(groups.entries())) {
    const avgVirality = groupVideos.reduce((sum, v) => sum + v.virality_score, 0) / groupVideos.length
    const avgViews = groupVideos.reduce((sum, v) => sum + v.views, 0) / groupVideos.length
    const avgEngagement = groupVideos.reduce((sum, v) => sum + calculateEngagement(v), 0) / groupVideos.length

    // Sort videos by virality to get best example
    const sortedVideos = [...groupVideos].sort((a, b) => b.virality_score - a.virality_score)
    const bestVideo = sortedVideos[0]

    // Determine trend based on recent vs older performance
    const midpoint = Math.floor(groupVideos.length / 2)
    const sortedByDate = [...groupVideos].sort((a, b) =>
      new Date(b.discovered_at).getTime() - new Date(a.discovered_at).getTime()
    )
    const recentVideos = sortedByDate.slice(0, midpoint || 1)
    const olderVideos = sortedByDate.slice(midpoint || 1)

    const recentAvg = recentVideos.length > 0
      ? recentVideos.reduce((sum, v) => sum + v.virality_score, 0) / recentVideos.length
      : 0
    const olderAvg = olderVideos.length > 0
      ? olderVideos.reduce((sum, v) => sum + v.virality_score, 0) / olderVideos.length
      : recentAvg

    let trend: 'rising' | 'stable' | 'declining' = 'stable'
    if (recentAvg > olderAvg * 1.2) trend = 'rising'
    else if (recentAvg < olderAvg * 0.8) trend = 'declining'

    insights.push({
      name,
      count: groupVideos.length,
      avgVirality: Math.round(avgVirality * 100) / 100,
      avgViews: Math.round(avgViews),
      avgEngagement: Math.round(avgEngagement * 100) / 100,
      trend,
      bestExample: bestVideo ? {
        videoId: bestVideo.id,
        caption: bestVideo.caption?.substring(0, 100) || 'No caption',
        viralityScore: bestVideo.virality_score
      } : null
    })
  }

  // Sort by average virality descending
  return insights.sort((a, b) => b.avgVirality - a.avgVirality)
}

// Calculate hashtag patterns
function calculateHashtagPatterns(videos: Video[]): HashtagPattern[] {
  const hashtagMap = new Map<string, { count: number; totalVirality: number; videos: Set<string> }>()

  for (const video of videos) {
    const hashtags = extractHashtags(video.caption || '')
    for (const hashtag of hashtags) {
      const existing = hashtagMap.get(hashtag) || { count: 0, totalVirality: 0, videos: new Set() }
      existing.count++
      existing.totalVirality += video.virality_score
      existing.videos.add(video.id)
      hashtagMap.set(hashtag, existing)
    }
  }

  const patterns: HashtagPattern[] = []
  for (const [hashtag, data] of Array.from(hashtagMap.entries())) {
    if (data.count >= 2) { // Only include hashtags used at least twice
      patterns.push({
        hashtag,
        count: data.count,
        avgVirality: Math.round((data.totalVirality / data.count) * 100) / 100,
        videos: data.videos.size
      })
    }
  }

  return patterns.sort((a, b) => b.avgVirality - a.avgVirality).slice(0, 20)
}

// Calculate emerging trends
function calculateEmergingTrends(
  hookPatterns: PatternInsight[],
  formatPatterns: PatternInsight[],
  emotionPatterns: PatternInsight[]
): { rising: TrendItem[]; declining: TrendItem[]; stable: TrendItem[] } {
  const rising: TrendItem[] = []
  const declining: TrendItem[] = []
  const stable: TrendItem[] = []

  const processTrends = (patterns: PatternInsight[], type: TrendItem['type']) => {
    for (const pattern of patterns) {
      const item: TrendItem = {
        type,
        name: pattern.name,
        changePercent: pattern.trend === 'rising' ? 20 : pattern.trend === 'declining' ? -20 : 0,
        currentAvgVirality: pattern.avgVirality
      }

      if (pattern.trend === 'rising') rising.push(item)
      else if (pattern.trend === 'declining') declining.push(item)
      else stable.push(item)
    }
  }

  processTrends(hookPatterns, 'hook')
  processTrends(formatPatterns, 'format')
  processTrends(emotionPatterns, 'emotion')

  return {
    rising: rising.sort((a, b) => b.currentAvgVirality - a.currentAvgVirality).slice(0, 5),
    declining: declining.sort((a, b) => a.currentAvgVirality - b.currentAvgVirality).slice(0, 5),
    stable: stable.sort((a, b) => b.currentAvgVirality - a.currentAvgVirality).slice(0, 5)
  }
}

// Calculate top performing combinations
function calculateTopCombinations(videos: Video[]): Combination[] {
  const combinationMap = new Map<string, { videos: Video[] }>()

  for (const video of videos) {
    if (video.hook_type && video.content_format && video.emotional_trigger) {
      const key = `${video.hook_type}|${video.content_format}|${video.emotional_trigger}`
      const existing = combinationMap.get(key) || { videos: [] }
      existing.videos.push(video)
      combinationMap.set(key, existing)
    }
  }

  const combinations: Combination[] = []
  for (const [key, data] of Array.from(combinationMap.entries())) {
    if (data.videos.length >= 2) {
      const [hook, format, emotion] = key.split('|')
      const avgVirality = data.videos.reduce((sum, v) => sum + v.virality_score, 0) / data.videos.length
      combinations.push({
        hook,
        format,
        emotion,
        avgVirality: Math.round(avgVirality * 100) / 100,
        videoCount: data.videos.length
      })
    }
  }

  return combinations.sort((a, b) => b.avgVirality - a.avgVirality).slice(0, 5)
}

// Calculate posting insights
function calculatePostingInsights(videos: Video[]): { bestDays: DayInsight[]; bestHours: HourInsight[]; optimalFrequency: string } {
  const dayMap = new Map<string, { totalVirality: number; count: number }>()
  const hourMap = new Map<number, { totalVirality: number; count: number }>()

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

  for (const video of videos) {
    const date = new Date(video.discovered_at)
    const day = days[date.getUTCDay()]
    const hour = date.getUTCHours()

    // Day stats
    const dayData = dayMap.get(day) || { totalVirality: 0, count: 0 }
    dayData.totalVirality += video.virality_score
    dayData.count++
    dayMap.set(day, dayData)

    // Hour stats
    const hourData = hourMap.get(hour) || { totalVirality: 0, count: 0 }
    hourData.totalVirality += video.virality_score
    hourData.count++
    hourMap.set(hour, hourData)
  }

  const bestDays: DayInsight[] = []
  for (const [day, data] of Array.from(dayMap.entries())) {
    bestDays.push({
      day,
      avgVirality: Math.round((data.totalVirality / data.count) * 100) / 100,
      videoCount: data.count
    })
  }

  const bestHours: HourInsight[] = []
  for (const [hour, data] of Array.from(hourMap.entries())) {
    bestHours.push({
      hour,
      avgVirality: Math.round((data.totalVirality / data.count) * 100) / 100,
      videoCount: data.count
    })
  }

  // Determine optimal frequency based on video count and time span
  const sortedByDate = [...videos].sort((a, b) =>
    new Date(a.discovered_at).getTime() - new Date(b.discovered_at).getTime()
  )
  const firstDate = sortedByDate.length > 0 ? new Date(sortedByDate[0].discovered_at) : new Date()
  const lastDate = sortedByDate.length > 0 ? new Date(sortedByDate[sortedByDate.length - 1].discovered_at) : new Date()
  const daysDiff = Math.max(1, Math.ceil((lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24)))
  const videosPerDay = videos.length / daysDiff

  let optimalFrequency = '1-2 videos per day'
  if (videosPerDay < 0.5) optimalFrequency = '3-4 videos per week'
  else if (videosPerDay < 1) optimalFrequency = '1 video per day'
  else if (videosPerDay < 2) optimalFrequency = '1-2 videos per day'
  else optimalFrequency = '2-3 videos per day'

  return {
    bestDays: bestDays.sort((a, b) => b.avgVirality - a.avgVirality),
    bestHours: bestHours.sort((a, b) => b.avgVirality - a.avgVirality).slice(0, 5),
    optimalFrequency
  }
}

// Generate recommendations based on analysis
function generateRecommendations(
  hookPatterns: PatternInsight[],
  formatPatterns: PatternInsight[],
  emotionPatterns: PatternInsight[],
  trends: { rising: TrendItem[]; declining: TrendItem[]; stable: TrendItem[] }
): string[] {
  const recommendations: string[] = []

  // Top hook recommendation
  if (hookPatterns.length > 0) {
    const topHook = hookPatterns[0]
    recommendations.push(`Focus on "${topHook.name}" hooks - they achieve ${topHook.avgVirality.toFixed(1)}x average virality`)
  }

  // Top format recommendation
  if (formatPatterns.length > 0) {
    const topFormat = formatPatterns[0]
    recommendations.push(`Use "${topFormat.name}" format more - it generates ${topFormat.avgViews.toLocaleString()} average views`)
  }

  // Rising trend recommendation
  if (trends.rising.length > 0) {
    const risingTrend = trends.rising[0]
    recommendations.push(`Capitalize on rising trend: "${risingTrend.name}" (${risingTrend.type}) is gaining momentum`)
  }

  // Emotion recommendation
  if (emotionPatterns.length > 0) {
    const topEmotion = emotionPatterns[0]
    recommendations.push(`Evoke "${topEmotion.name}" in your content - it drives ${topEmotion.avgEngagement.toFixed(1)}% engagement`)
  }

  // Declining trend warning
  if (trends.declining.length > 0) {
    const decliningTrend = trends.declining[0]
    recommendations.push(`Consider pivoting from "${decliningTrend.name}" - performance is declining`)
  }

  return recommendations.slice(0, 5)
}

// GET /api/analyze/patterns - Get pattern synthesis for brand
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

    console.log('[API patterns] Analyzing patterns for brand:', brandId)

    const supabase = getSupabase()

    // First, get account IDs for this brand
    const { data: accounts, error: accountsError } = await supabase
      .from('competitor_accounts')
      .select('id')
      .eq('brand_id', brandId)

    if (accountsError) {
      console.error('[API patterns] Error fetching accounts:', accountsError)
      return NextResponse.json({ error: accountsError.message }, { status: 500 })
    }

    if (!accounts || accounts.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          brandId,
          totalVideosAnalyzed: 0,
          generatedAt: new Date().toISOString(),
          crossVideoPatterns: { hookPatterns: [], formatPatterns: [], emotionPatterns: [], hashtagPatterns: [] },
          emergingTrends: { rising: [], declining: [], stable: [] },
          whatsWorkingNow: { summary: 'No videos to analyze yet', topPerformingCombinations: [], recommendations: [] },
          postingInsights: { bestDays: [], bestHours: [], optimalFrequency: 'N/A' }
        }
      })
    }

    const accountIds = accounts.map(a => a.id)

    // Get all videos for analysis
    const { data: videos, error: videosError } = await supabase
      .from('competitor_videos')
      .select('*')
      .in('account_id', accountIds)
      .order('discovered_at', { ascending: false })

    if (videosError) {
      console.error('[API patterns] Error fetching videos:', videosError)
      return NextResponse.json({ error: videosError.message }, { status: 500 })
    }

    if (!videos || videos.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          brandId,
          totalVideosAnalyzed: 0,
          generatedAt: new Date().toISOString(),
          crossVideoPatterns: { hookPatterns: [], formatPatterns: [], emotionPatterns: [], hashtagPatterns: [] },
          emergingTrends: { rising: [], declining: [], stable: [] },
          whatsWorkingNow: { summary: 'No videos to analyze yet', topPerformingCombinations: [], recommendations: [] },
          postingInsights: { bestDays: [], bestHours: [], optimalFrequency: 'N/A' }
        }
      })
    }

    // Calculate all patterns
    const hookPatterns = calculatePatternInsights(videos as Video[], 'hook_type')
    const formatPatterns = calculatePatternInsights(videos as Video[], 'content_format')
    const emotionPatterns = calculatePatternInsights(videos as Video[], 'emotional_trigger')
    const hashtagPatterns = calculateHashtagPatterns(videos as Video[])
    const emergingTrends = calculateEmergingTrends(hookPatterns, formatPatterns, emotionPatterns)
    const topCombinations = calculateTopCombinations(videos as Video[])
    const postingInsights = calculatePostingInsights(videos as Video[])
    const recommendations = generateRecommendations(hookPatterns, formatPatterns, emotionPatterns, emergingTrends)

    // Generate summary
    const topHook = hookPatterns[0]?.name || 'varied'
    const topFormat = formatPatterns[0]?.name || 'mixed'
    const avgVirality = videos.reduce((sum, v) => sum + (v.virality_score || 0), 0) / videos.length

    const summary = `Analyzed ${videos.length} videos. Top performing pattern: ${topHook} hooks with ${topFormat} format. Average virality: ${avgVirality.toFixed(1)}x. ${emergingTrends.rising.length > 0 ? `Rising trend: ${emergingTrends.rising[0].name}.` : ''}`

    const synthesis: PatternSynthesis = {
      brandId,
      totalVideosAnalyzed: videos.length,
      generatedAt: new Date().toISOString(),
      crossVideoPatterns: {
        hookPatterns,
        formatPatterns,
        emotionPatterns,
        hashtagPatterns
      },
      emergingTrends,
      whatsWorkingNow: {
        summary,
        topPerformingCombinations: topCombinations,
        recommendations
      },
      postingInsights
    }

    console.log('[API patterns] Analysis complete. Videos analyzed:', videos.length)

    return NextResponse.json({
      success: true,
      data: synthesis
    })
  } catch (error) {
    console.error('[API patterns] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
