import {
  Video,
  TopInsight,
  PerformanceMetrics,
  WorkingNowInsights,
  GroupedMetric,
} from './types'

// Virality threshold for considering a video "viral"
const VIRALITY_THRESHOLD = 2.0

/**
 * Calculate the top performing insight (hook_type, format, or emotion)
 * Returns the pattern that has the highest average virality score
 */
export function calculateTopInsight(videos: Video[]): TopInsight | null {
  if (videos.length === 0) return null

  const insights: TopInsight[] = []

  // Calculate for each type
  const types: ('hook_type' | 'format' | 'emotion')[] = ['hook_type', 'format', 'emotion']

  for (const type of types) {
    const grouped = groupByMetric(videos, type)
    if (grouped.length > 0) {
      // Find the group with highest average virality
      const best = grouped.reduce((prev, current) =>
        current.avgVirality > prev.avgVirality ? current : prev
      )

      if (best.name) {
        insights.push({
          type,
          value: best.name,
          avgVirality: best.avgVirality,
          count: best.count,
        })
      }
    }
  }

  if (insights.length === 0) return null

  // Return the overall best insight
  return insights.reduce((prev, current) =>
    current.avgVirality > prev.avgVirality ? current : prev
  )
}

/**
 * Group videos by a specific metric (hook_type, format, emotion)
 */
export function groupByMetric(
  videos: Video[],
  key: 'hook_type' | 'format' | 'emotion'
): GroupedMetric[] {
  const groups: Record<string, { count: number; totalVirality: number; totalViews: number }> = {}

  for (const video of videos) {
    const value = video[key]
    if (value) {
      if (!groups[value]) {
        groups[value] = { count: 0, totalVirality: 0, totalViews: 0 }
      }
      groups[value].count++
      groups[value].totalVirality += video.virality_score
      groups[value].totalViews += video.views
    }
  }

  return Object.entries(groups)
    .map(([name, data]) => ({
      name,
      count: data.count,
      avgVirality: data.totalVirality / data.count,
      totalViews: data.totalViews,
    }))
    .sort((a, b) => b.avgVirality - a.avgVirality)
}

/**
 * Group videos by hashtags extracted from descriptions
 * Returns hashtags with their count and average virality
 */
export function groupByHashtag(videos: Video[]): GroupedMetric[] {
  const hashtagCounts: Record<string, { count: number; totalVirality: number; totalViews: number }> = {}

  for (const video of videos) {
    const hashtags = video.description.match(/#\w+/g) || []
    for (const tag of hashtags) {
      const normalizedTag = tag.toLowerCase()
      if (!hashtagCounts[normalizedTag]) {
        hashtagCounts[normalizedTag] = { count: 0, totalVirality: 0, totalViews: 0 }
      }
      hashtagCounts[normalizedTag].count++
      hashtagCounts[normalizedTag].totalVirality += video.virality_score
      hashtagCounts[normalizedTag].totalViews += video.views
    }
  }

  return Object.entries(hashtagCounts)
    .map(([name, data]) => ({
      name,
      count: data.count,
      avgVirality: data.totalVirality / data.count,
      totalViews: data.totalViews,
    }))
    .sort((a, b) => b.avgVirality - a.avgVirality)
}

/**
 * Calculate the percentage of videos that are considered "viral"
 * (virality_score >= 2.0)
 */
export function calculateViralPercentage(videos: Video[]): number {
  if (videos.length === 0) return 0

  const viralCount = videos.filter(v => v.virality_score >= VIRALITY_THRESHOLD).length
  return (viralCount / videos.length) * 100
}

/**
 * Calculate the average virality score across all videos
 */
export function calculateAvgVirality(videos: Video[]): number {
  if (videos.length === 0) return 0

  const total = videos.reduce((sum, v) => sum + v.virality_score, 0)
  return total / videos.length
}

/**
 * Get complete performance metrics
 */
export function getPerformanceMetrics(videos: Video[]): PerformanceMetrics {
  const viralVideos = videos.filter(v => v.virality_score >= VIRALITY_THRESHOLD).length

  return {
    viralPercentage: calculateViralPercentage(videos),
    avgVirality: calculateAvgVirality(videos),
    totalVideos: videos.length,
    viralVideos,
  }
}

/**
 * Get "Working Now" insights - top format, hashtag, and posting time
 */
export function getWorkingNowInsights(videos: Video[]): WorkingNowInsights {
  if (videos.length === 0) {
    return {
      topFormat: null,
      topHashtag: null,
      bestPostingTime: null,
    }
  }

  // Get top format
  const formatGroups = groupByMetric(videos, 'format')
  const topFormat = formatGroups.length > 0 ? formatGroups[0].name : null

  // Get top hashtag from video descriptions
  const hashtagCounts: Record<string, { count: number; totalVirality: number }> = {}
  for (const video of videos) {
    const hashtags = video.description.match(/#\w+/g) || []
    for (const tag of hashtags) {
      const normalizedTag = tag.toLowerCase()
      if (!hashtagCounts[normalizedTag]) {
        hashtagCounts[normalizedTag] = { count: 0, totalVirality: 0 }
      }
      hashtagCounts[normalizedTag].count++
      hashtagCounts[normalizedTag].totalVirality += video.virality_score
    }
  }

  const sortedHashtags = Object.entries(hashtagCounts)
    .map(([tag, data]) => ({
      tag,
      avgVirality: data.totalVirality / data.count,
    }))
    .sort((a, b) => b.avgVirality - a.avgVirality)

  const topHashtag = sortedHashtags.length > 0 ? sortedHashtags[0].tag : null

  // Get best posting time (hour of day)
  const hourCounts: Record<number, { count: number; totalVirality: number }> = {}
  for (const video of videos) {
    const hour = new Date(video.posted_at).getHours()
    if (!hourCounts[hour]) {
      hourCounts[hour] = { count: 0, totalVirality: 0 }
    }
    hourCounts[hour].count++
    hourCounts[hour].totalVirality += video.virality_score
  }

  const sortedHours = Object.entries(hourCounts)
    .map(([hour, data]) => ({
      hour: parseInt(hour),
      avgVirality: data.totalVirality / data.count,
    }))
    .sort((a, b) => b.avgVirality - a.avgVirality)

  let bestPostingTime: string | null = null
  if (sortedHours.length > 0) {
    const hour = sortedHours[0].hour
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const hour12 = hour % 12 || 12
    bestPostingTime = `${hour12}:00 ${ampm}`
  }

  return {
    topFormat,
    topHashtag,
    bestPostingTime,
  }
}

/**
 * Calculate virality score from video metrics
 * Formula: (comments + shares*2 + saves*1.5) / (views / 10000)
 * Normalized to account for video reach
 */
export function calculateViralityScore(
  views: number,
  comments: number,
  shares: number,
  saves: number
): number {
  if (views === 0) return 0

  const engagementScore = comments + shares * 2 + saves * 1.5
  const normalizedViews = views / 10000

  if (normalizedViews === 0) return 0

  return engagementScore / normalizedViews
}

/**
 * Format a number for display (e.g., 1500 -> "1.5K")
 */
export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}

/**
 * Get time ago string from a date
 */
export function getTimeAgo(date: Date | string | null): string | null {
  if (!date) return null

  const now = new Date()
  const past = new Date(date)
  const diffMs = now.getTime() - past.getTime()
  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMinutes < 1) return 'Just now'
  if (diffMinutes < 60) return `${diffMinutes}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`
  return `${Math.floor(diffDays / 365)}y ago`
}
