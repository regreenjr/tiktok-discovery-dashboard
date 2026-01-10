require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function checkScrapeJobs() {
  const brandId = process.argv[2];

  if (brandId) {
    // Check scrape jobs for a specific brand ID
    const { data: jobs, error } = await supabase
      .from('scrape_jobs')
      .select('*')
      .eq('brand_id', brandId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error:', error);
      return;
    }

    console.log('Scrape jobs for brand ID', brandId + ':', jobs?.length || 0);

    if (jobs && jobs.length > 0) {
      jobs.forEach((job, i) => {
        console.log(`\nJob ${i + 1}:`);
        console.log('  ID:', job.id);
        console.log('  Brand ID:', job.brand_id);
        console.log('  Status:', job.status);
        console.log('  Error:', job.error_message || 'None');
        console.log('  Created:', job.created_at);
      });
    }
  } else {
    // List all scrape jobs
    const { data: jobs, error } = await supabase
      .from('scrape_jobs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error:', error);
      return;
    }

    console.log('Total scrape jobs:', jobs?.length || 0);

    if (jobs && jobs.length > 0) {
      jobs.forEach((job, i) => {
        console.log(`\nJob ${i + 1}:`);
        console.log('  ID:', job.id);
        console.log('  Brand ID:', job.brand_id);
        console.log('  Status:', job.status);
        console.log('  Error:', job.error_message || 'None');
        console.log('  Created:', job.created_at);
      });
    }
  }
}

checkScrapeJobs();
