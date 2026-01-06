import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { analyzeVideoBatch } from '@/lib/ai/content-analyzer';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

/**
 * POST /api/analyze-videos
 * Analyzes top-performing videos using Claude AI to identify content patterns
 */
export async function POST() {
  try {
    // Get top 20 videos with high virality for analysis
    const { data: videos, error } = await supabase
      .from('competitor_videos')
      .select('video_id, caption, views, engagement_rate, virality_score')
      .gte('virality_score', 1.5) // Only analyze viral content
      .order('virality_score', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error fetching videos:', error);
      return NextResponse.json({ error: 'Failed to fetch videos' }, { status: 500 });
    }

    if (!videos || videos.length === 0) {
      return NextResponse.json({ message: 'No videos found for analysis' }, { status: 200 });
    }

    // Analyze videos using Claude API
    const analyses = await analyzeVideoBatch(videos);

    // Update database with AI insights
    let updated = 0;
    for (const [videoId, analysis] of analyses.entries()) {
      const { error: updateError } = await supabase
        .from('competitor_videos')
        .update({
          hook_type: analysis.hook_type,
          content_format: analysis.content_format,
          emotional_trigger: analysis.emotional_trigger,
          cta_type: analysis.cta_type,
          ai_summary: analysis.summary,
          ai_analyzed_at: new Date().toISOString(),
        })
        .eq('video_id', videoId);

      if (!updateError) updated++;
    }

    return NextResponse.json({
      success: true,
      analyzed: analyses.size,
      updated,
      message: `Successfully analyzed ${analyses.size} videos`,
    });

  } catch (error: any) {
    console.error('Error analyzing videos:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to analyze videos' },
      { status: 500 }
    );
  }
}
