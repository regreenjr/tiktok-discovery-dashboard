import { format, subDays, parseISO } from 'date-fns';
import { Video, TrendData } from './types';

/**
 * Generate time-series data for trend charts
 * Groups videos by date and calculates metrics
 */
export function generateTimeSeriesData(
  videos: Video[],
  days: number = 30,
  groupBy?: keyof Video
): TrendData[] {
  // Note: Videos currently don't have a date field
  // This is a placeholder that will need actual date data
  // For now, we'll distribute videos evenly across the time range

  const dataPoints: TrendData[] = [];
  const today = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = subDays(today, i);
    const dateStr = format(date, 'yyyy-MM-dd');

    // Calculate videos for this day (placeholder logic)
    const dayVideos = videos.filter((_, index) => {
      // Distribute videos evenly for demo purposes
      const dayIndex = Math.floor((index / videos.length) * days);
      return dayIndex === (days - 1 - i);
    });

    if (dayVideos.length === 0) {
      dataPoints.push({
        date: dateStr,
        virality: 0,
        avgVirality: 0,
        engagement: 0,
        views: 0,
        breakdown: {},
      });
      continue;
    }

    const avgVirality =
      dayVideos.reduce((sum, v) => sum + (v.virality_score || 0), 0) / dayVideos.length;

    const breakdown: Record<string, number> = {};

    if (groupBy) {
      const groups: Record<string, Video[]> = {};
      dayVideos.forEach((video) => {
        const value = video[groupBy];
        if (value && typeof value === 'string') {
          if (!groups[value]) groups[value] = [];
          groups[value].push(video);
        }
      });

      Object.entries(groups).forEach(([key, groupVideos]) => {
        breakdown[key] =
          groupVideos.reduce((sum, v) => sum + (v.virality_score || 0), 0) / groupVideos.length;
      });
    }

    dataPoints.push({
      date: dateStr,
      virality: avgVirality,
      avgVirality,
      engagement: 0, // TODO: Calculate from data
      views: dayVideos.reduce((sum, v) => sum + v.views, 0) / dayVideos.length,
      breakdown,
    });
  }

  return dataPoints;
}

/**
 * Calculate moving average for smoothing trends
 */
export function calculateMovingAverage(
  data: TrendData[],
  window: number = 7
): TrendData[] {
  return data.map((point, index) => {
    const start = Math.max(0, index - Math.floor(window / 2));
    const end = Math.min(data.length, index + Math.ceil(window / 2));
    const windowData = data.slice(start, end);

    const avgVirality =
      windowData.reduce((sum, d) => sum + (d.avgVirality || 0), 0) / windowData.length;

    return {
      ...point,
      avgVirality,
    };
  });
}

/**
 * Detect trend direction from time series data
 */
export function detectTrendDirection(
  data: TrendData[]
): 'up' | 'down' | 'stable' {
  if (data.length < 2) return 'stable';

  const recent = data.slice(-7); // Last week
  const older = data.slice(0, 7); // First week

  const recentAvg = recent.reduce((sum, d) => sum + (d.avgVirality || 0), 0) / recent.length;
  const olderAvg = older.reduce((sum, d) => sum + (d.avgVirality || 0), 0) / older.length;

  const change = ((recentAvg - olderAvg) / olderAvg) * 100;

  if (Math.abs(change) < 5) return 'stable';
  return change > 0 ? 'up' : 'down';
}

/**
 * Get trend emoji based on direction
 */
export function getTrendEmoji(direction: 'up' | 'down' | 'stable'): string {
  const emojis = {
    up: '↗',
    down: '↘',
    stable: '→',
  };
  return emojis[direction];
}
