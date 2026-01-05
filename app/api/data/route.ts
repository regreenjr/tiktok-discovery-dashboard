import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const brandId = searchParams.get('brandId');

    console.log('API called - checking env vars:', {
      hasUrl: !!process.env.SUPABASE_URL,
      hasKey: !!process.env.SUPABASE_SERVICE_KEY,
      url: process.env.SUPABASE_URL,
      brandId
    });

    // Get competitor videos (filtered by brand if specified)
    let videoQuery = supabase
      .from('competitor_videos')
      .select('*, competitor_accounts!inner(brand_id)')
      .order('views', { ascending: false })
      .limit(20);

    if (brandId) {
      videoQuery = videoQuery.eq('competitor_accounts.brand_id', brandId);
    }

    const { data: videos, error: vError } = await videoQuery;

    if (vError) console.error('Videos error:', vError);

    // Get pain points
    const { data: painPoints, error: pError } = await supabase
      .from('pain_points')
      .select('*')
      .order('upvotes', { ascending: false })
      .limit(10);

    if (pError) console.error('Pain points error:', pError);

    // Get trending sounds
    const { data: sounds, error: sError } = await supabase
      .from('trending_assets')
      .select('*')
      .eq('asset_type', 'sound')
      .order('virality_score', { ascending: false })
      .limit(15);

    if (sError) console.error('Sounds error:', sError);

    console.log('Query results:', {
      videos: videos?.length || 0,
      painPoints: painPoints?.length || 0,
      sounds: sounds?.length || 0
    });

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
