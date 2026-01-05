import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function GET() {
  try {
    // Get competitor videos
    const { data: videos } = await supabase
      .from('competitor_videos')
      .select('*')
      .order('views', { ascending: false })
      .limit(20);

    // Get pain points
    const { data: painPoints } = await supabase
      .from('pain_points')
      .select('*')
      .order('upvotes', { ascending: false })
      .limit(10);

    // Get trending sounds
    const { data: sounds } = await supabase
      .from('trending_assets')
      .select('*')
      .eq('asset_type', 'sound')
      .order('virality_score', { ascending: false })
      .limit(15);

    // Get stats
    const { data: stats } = await supabase.rpc('get_stats', {}).single();

    return NextResponse.json({
      videos: videos || [],
      painPoints: painPoints || [],
      sounds: sounds || [],
      stats: {
        totalVideos: videos?.length || 0,
        totalInsights: painPoints?.length || 0,
        totalSounds: sounds?.length || 0
      }
    });
  } catch (error) {
    console.error('Error fetching data:', error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}
