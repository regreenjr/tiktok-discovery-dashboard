import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

interface HashtagStats {
  hashtag: string;
  count: number;
  avgViews: number;
  avgEngagement: number;
  avgVirality: number;
  totalViews: number;
}

/**
 * GET /api/hashtag-insights
 * Analyzes hashtag performance from video captions
 */
export async function GET() {
  const supabase = getSupabase();
  try {
    // Get all videos with captions
    const { data: videos, error } = await supabase
      .from('competitor_videos')
      .select('caption, views, engagement_rate, virality_score')
      .order('views', { ascending: false });

    if (error) {
      console.error('Error fetching videos:', error);
      return NextResponse.json({ error: 'Failed to fetch videos' }, { status: 500 });
    }

    if (!videos || videos.length === 0) {
      return NextResponse.json([]);
    }

    // Extract hashtags from all captions and aggregate stats
    const hashtagMap = new Map<string, {
      videos: number;
      totalViews: number;
      totalEngagement: number;
      totalVirality: number;
    }>();

    videos.forEach(video => {
      if (!video.caption) return;

      // Extract hashtags (including # symbol)
      const hashtags = video.caption.match(/#\w+/gi) || [];

      hashtags.forEach((tag: string) => {
        const normalizedTag = tag.toLowerCase();
        const current = hashtagMap.get(normalizedTag) || {
          videos: 0,
          totalViews: 0,
          totalEngagement: 0,
          totalVirality: 0
        };

        hashtagMap.set(normalizedTag, {
          videos: current.videos + 1,
          totalViews: current.totalViews + (video.views || 0),
          totalEngagement: current.totalEngagement + (video.engagement_rate || 0),
          totalVirality: current.totalVirality + (video.virality_score || 0)
        });
      });
    });

    // Convert to array and calculate averages
    const hashtagStats: HashtagStats[] = Array.from(hashtagMap.entries())
      .map(([hashtag, stats]) => ({
        hashtag,
        count: stats.videos,
        totalViews: stats.totalViews,
        avgViews: stats.videos > 0 ? stats.totalViews / stats.videos : 0,
        avgEngagement: stats.videos > 0 ? stats.totalEngagement / stats.videos : 0,
        avgVirality: stats.videos > 0 ? stats.totalVirality / stats.videos : 0
      }))
      // Filter out hashtags with less than 2 uses (not statistically significant)
      .filter(stat => stat.count >= 2)
      // Sort by average virality by default
      .sort((a, b) => b.avgVirality - a.avgVirality);

    return NextResponse.json(hashtagStats);

  } catch (error) {
    console.error('Error calculating hashtag insights:', error);
    return NextResponse.json({ error: 'Failed to calculate insights' }, { status: 500 });
  }
}
