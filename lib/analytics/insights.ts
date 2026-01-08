import { Video, InsightData, MetricGroup, TrendData, TrendIndicator } from './types';

/**
 * Calculate the top-performing insight from videos
 * Analyzes hook types, formats, and emotional triggers to find what's working best
 */
export function calculateTopInsight(videos: Video[]): InsightData | null {
  if (!videos || videos.length === 0) {
    return null;
  }

  // Group by hook_type
  const hookGroups = groupByMetric(videos, 'hook_type');
  const formatGroups = groupByMetric(videos, 'content_format');
  const emotionGroups = groupByMetric(videos, 'emotional_trigger');

  // Find the best performing group
  const allGroups = [
    ...hookGroups.map(g => ({ ...g, category: 'hook_type' })),
    ...formatGroups.map(g => ({ ...g, category: 'content_format' })),
    ...emotionGroups.map(g => ({ ...g, category: 'emotional_trigger' })),
  ];

  const topGroup = allGroups.reduce((best, current) => {
    return current.avgVirality > best.avgVirality ? current : best;
  });

  const avgVirality = videos.reduce((sum, v) => sum + (v.virality_score || 0), 0) / videos.length;

  return {
    insight: `${topGroup.name} is crushing it`,
    category: topGroup.category,
    topValue: topGroup.name,
    metric: topGroup.avgVirality,
    context: `vs average of ${avgVirality.toFixed(1)}x`,
    count: topGroup.count,
    recommendation: generateRecommendation(topGroup.category, topGroup.name),
  };
}

/**
 * Group videos by a specific metric (hook_type, content_format, etc.)
 * Returns average performance for each group
 */
export function groupByMetric(videos: Video[], key: keyof Video): MetricGroup[] {
  const groups: Record<string, Video[]> = {};

  // Group videos
  videos.forEach((video) => {
    const value = video[key];
    if (value && typeof value === 'string') {
      if (!groups[value]) {
        groups[value] = [];
      }
      groups[value].push(video);
    }
  });

  // Calculate averages for each group
  return Object.entries(groups).map(([name, groupVideos]) => {
    const avgVirality =
      groupVideos.reduce((sum, v) => sum + (v.virality_score || 0), 0) / groupVideos.length;
    const avgEngagement =
      groupVideos.reduce((sum, v) => sum + v.engagement_rate, 0) / groupVideos.length;
    const avgViews = groupVideos.reduce((sum, v) => sum + v.views, 0) / groupVideos.length;

    return {
      name,
      avgVirality,
      avgEngagement,
      avgViews,
      count: groupVideos.length,
    };
  }).sort((a, b) => b.avgVirality - a.avgVirality);
}

/**
 * Calculate viral video percentage (videos with virality >= 2.0)
 */
export function calculateViralPercentage(videos: Video[]): number {
  if (!videos || videos.length === 0) return 0;
  const viralVideos = videos.filter((v) => (v.virality_score || 0) >= 2.0);
  return (viralVideos.length / videos.length) * 100;
}

/**
 * Calculate average virality score
 */
export function calculateAvgVirality(videos: Video[]): number {
  if (!videos || videos.length === 0) return 0;
  const sum = videos.reduce((acc, v) => acc + (v.virality_score || 0), 0);
  return sum / videos.length;
}

/**
 * Get top N performers by virality
 */
export function getTopPerformers(videos: Video[], limit: number = 5): Video[] {
  return [...videos]
    .sort((a, b) => (b.virality_score || 0) - (a.virality_score || 0))
    .slice(0, limit);
}

/**
 * Calculate trend direction based on recent vs older data
 */
export function calculateTrendIndicator(
  recent: number,
  older: number
): TrendIndicator {
  const change = ((recent - older) / older) * 100;

  let direction: 'up' | 'down' | 'stable';
  if (Math.abs(change) < 5) {
    direction = 'stable';
  } else if (change > 0) {
    direction = 'up';
  } else {
    direction = 'down';
  }

  return { direction, change };
}

/**
 * Generate personalized recommendation based on top performing category
 */
function generateRecommendation(category: string, value: string): string {
  const recommendations: Record<string, Record<string, string>> = {
    hook_type: {
      Question: 'Try asking questions in first 3 seconds',
      Tutorial: 'Show step-by-step process early',
      Shock: 'Lead with surprising statement',
      Story: 'Hook with relatable narrative',
    },
    content_format: {
      'Before/After': 'Show transformation clearly',
      'Tutorial': 'Break down steps simply',
      'Reaction': 'React to trending content',
      'Challenge': 'Make it easy to participate',
    },
    emotional_trigger: {
      Curiosity: 'Tease the outcome early',
      FOMO: 'Emphasize limited availability',
      Aspiration: 'Show the ideal end state',
      Relatability: 'Start with common problem',
    },
  };

  return recommendations[category]?.[value] || 'Keep using what works';
}

/**
 * Normalize metrics to 0-100 scale for comparison charts
 */
export function normalizeMetric(value: number, min: number, max: number): number {
  if (max === min) return 50;
  return ((value - min) / (max - min)) * 100;
}

/**
 * Compare video against category average
 */
export function compareToAverage(
  video: Video,
  videos: Video[],
  category: keyof Video
): number {
  const categoryValue = video[category];
  if (typeof categoryValue !== 'string') return 1;

  const categoryVideos = videos.filter((v) => v[category] === categoryValue);
  const avgVirality =
    categoryVideos.reduce((sum, v) => sum + (v.virality_score || 0), 0) / categoryVideos.length;

  return (video.virality_score || 0) / avgVirality;
}
