import { Video, MetricGroup } from './types';

/**
 * Prepare data for comparison charts
 * Normalizes metrics so they can be displayed on the same scale
 */
export function prepareComparisonData(
  videos: Video[],
  groupBy: keyof Video,
  metrics: ('virality' | 'engagement' | 'views')[]
): any[] {
  const groups: Record<string, Video[]> = {};

  // Group videos
  videos.forEach((video) => {
    const value = video[groupBy];
    if (value && typeof value === 'string') {
      if (!groups[value]) {
        groups[value] = [];
      }
      groups[value].push(video);
    }
  });

  // Calculate metrics for each group
  return Object.entries(groups).map(([name, groupVideos]) => {
    const data: any = { name };

    if (metrics.includes('virality')) {
      data.virality =
        groupVideos.reduce((sum, v) => sum + (v.virality_score || 0), 0) / groupVideos.length;
    }

    if (metrics.includes('engagement')) {
      data.engagement =
        groupVideos.reduce((sum, v) => sum + (v.engagement_rate || 0), 0) / groupVideos.length;
    }

    if (metrics.includes('views')) {
      data.views = groupVideos.reduce((sum, v) => sum + v.views, 0) / groupVideos.length;
    }

    data.count = groupVideos.length;

    return data;
  }).sort((a, b) => (b.virality || 0) - (a.virality || 0));
}

/**
 * Find videos with similar patterns
 */
export function findSimilarVideos(
  targetVideo: Video,
  allVideos: Video[],
  limit: number = 3
): Video[] {
  return allVideos
    .filter((v) => v.video_id !== targetVideo.video_id)
    .map((v) => {
      let similarity = 0;

      // Same hook type
      if (v.hook_type === targetVideo.hook_type) similarity += 3;

      // Same content format
      if (v.content_format === targetVideo.content_format) similarity += 3;

      // Same emotional trigger
      if (v.emotional_trigger === targetVideo.emotional_trigger) similarity += 2;

      // Similar virality (within 20%)
      const targetVirality = targetVideo.virality_score || 0;
      const videoVirality = v.virality_score || 0;
      if (Math.abs(targetVirality - videoVirality) / targetVirality < 0.2) {
        similarity += 2;
      }

      return { video: v, similarity };
    })
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit)
    .map((item) => item.video);
}

/**
 * Calculate performance percentile
 */
export function calculatePercentile(video: Video, allVideos: Video[]): number {
  const virality = video.virality_score || 0;
  const lowerCount = allVideos.filter((v) => (v.virality_score || 0) < virality).length;
  return (lowerCount / allVideos.length) * 100;
}
