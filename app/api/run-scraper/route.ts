import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { ApifyClient } from 'apify-client';

export async function POST(request: Request) {
  const body = await request.json();
  const { scraper, brandId } = body;

  if (!scraper) {
    return NextResponse.json(
      { error: 'Scraper type is required (competitor, comments, trends, or all)' },
      { status: 400 }
    );
  }

  const validScrapers = ['competitor', 'comments', 'trends', 'all'];
  if (!validScrapers.includes(scraper)) {
    return NextResponse.json(
      { error: `Invalid scraper type. Must be one of: ${validScrapers.join(', ')}` },
      { status: 400 }
    );
  }

  if (!brandId || brandId === 'all') {
    return NextResponse.json(
      { error: 'Please select a specific brand to scrape' },
      { status: 400 }
    );
  }

  try {
    const supabase = getSupabase();

    // Check if scraper is already running for this brand
    const { data: runningJob } = await supabase
      .from('scrape_jobs')
      .select('id')
      .eq('brand_id', brandId)
      .in('status', ['pending', 'running'])
      .maybeSingle();

    if (runningJob) {
      return NextResponse.json({
        message: 'Scraper is already running for this brand',
        status: 'running'
      });
    }

    // Create scrape job
    const { data: job, error: jobError } = await supabase
      .from('scrape_jobs')
      .insert({
        brand_id: brandId,
        scraper_type: scraper,
        status: 'pending',
      })
      .select()
      .single();

    if (jobError) throw jobError;

    // Get competitor accounts for this brand
    const { data: accounts, error: accountsError } = await supabase
      .from('competitor_accounts')
      .select('id, handle')
      .eq('brand_id', brandId)
      .eq('is_active', true);

    if (accountsError) throw accountsError;

    if (!accounts || accounts.length === 0) {
      // Update job as failed
      await supabase
        .from('scrape_jobs')
        .update({ status: 'failed', error_message: 'No active accounts found for this brand' })
        .eq('id', job.id);

      return NextResponse.json({
        error: 'No active competitor accounts found for this brand. Please add accounts first.',
      }, { status: 400 });
    }

    // Trigger Apify scraper in background
    if (process.env.APIFY_TOKEN && scraper === 'competitor') {
      try {
        const apify = new ApifyClient({ token: process.env.APIFY_TOKEN });
        const startUrls = accounts.map(a => `https://www.tiktok.com/@${a.handle}`);

        // Update job to running
        await supabase
          .from('scrape_jobs')
          .update({ status: 'running', accounts_processed: 0 })
          .eq('id', job.id);

        // Trigger Apify actor (fire and forget)
        apify.actor('apidojo/tiktok-profile-scraper').call({
          startUrls: startUrls.map(url => ({ url })),
          resultsPerPage: 10,
          shouldDownloadVideos: false,
          shouldDownloadCovers: false,
          shouldDownloadSubtitles: false,
          shouldDownloadSlideshowImages: true,
        }).then(async (run) => {
          // This runs asynchronously - webhook would be better for production
          console.log(`Apify actor started: ${run.id}`);
        }).catch(async (error) => {
          console.error('Apify error:', error);
          await supabase
            .from('scrape_jobs')
            .update({ status: 'failed', error_message: error.message })
            .eq('id', job.id);
        });

        return NextResponse.json({
          message: `Scraping ${accounts.length} accounts for selected brand...`,
          jobId: job.id,
          accountCount: accounts.length,
          status: 'running'
        });
      } catch (apifyError: any) {
        console.error('Apify initialization error:', apifyError);
        await supabase
          .from('scrape_jobs')
          .update({ status: 'failed', error_message: apifyError.message })
          .eq('id', job.id);

        return NextResponse.json({
          error: 'Failed to start scraper. Please check configuration.',
        }, { status: 500 });
      }
    }

    // For other scraper types, just mark as pending
    return NextResponse.json({
      message: `Scraper job created for ${accounts.length} accounts`,
      jobId: job.id,
      accountCount: accounts.length,
      note: scraper !== 'competitor' ? 'Other scrapers need to be run manually via npm scripts' : undefined
    });
  } catch (error: any) {
    console.error('Error triggering scraper:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
