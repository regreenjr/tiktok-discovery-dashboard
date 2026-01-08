import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

// GET - Get scrape status for a brand or all brands
export async function GET(request: Request) {
  const supabase = getSupabase();
  const { searchParams } = new URL(request.url);
  const brandId = searchParams.get('brandId');

  try {
    if (brandId && brandId !== 'all') {
      // Get status for specific brand
      const { data: brand, error: brandError } = await supabase
        .from('brands')
        .select('id, name, last_scraped_at')
        .eq('id', brandId)
        .single();

      if (brandError) throw brandError;

      // Get latest scrape job for this brand
      const { data: latestJob, error: jobError } = await supabase
        .from('scrape_jobs')
        .select('*')
        .eq('brand_id', brandId)
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (jobError) throw jobError;

      return NextResponse.json({
        brand: brand.name,
        lastScraped: brand.last_scraped_at,
        currentJob: latestJob,
        isRunning: latestJob?.status === 'running' || latestJob?.status === 'pending',
      });
    } else {
      // Get status for all brands
      const { data: brands, error: brandsError } = await supabase
        .from('brands')
        .select('id, name, last_scraped_at')
        .order('name');

      if (brandsError) throw brandsError;

      // Get running jobs
      const { data: runningJobs, error: jobsError } = await supabase
        .from('scrape_jobs')
        .select('*')
        .in('status', ['running', 'pending'])
        .order('started_at', { ascending: false });

      if (jobsError) throw jobsError;

      const brandsWithStatus = brands.map((brand) => ({
        id: brand.id,
        name: brand.name,
        lastScraped: brand.last_scraped_at,
        isRunning: runningJobs.some((job) => job.brand_id === brand.id),
      }));

      return NextResponse.json({
        brands: brandsWithStatus,
        runningJobs: runningJobs.length,
      });
    }
  } catch (error: any) {
    console.error('Error fetching scrape status:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
