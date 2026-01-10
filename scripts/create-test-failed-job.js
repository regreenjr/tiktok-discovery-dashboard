require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function createTestFailedJob() {
  const mentorBrandId = '89fdc738-41dd-49f6-a58f-00d0ffdfd3f4';

  const { data, error } = await supabase
    .from('scrape_jobs')
    .insert({
      brand_id: mentorBrandId,
      scraper_type: 'competitor',
      status: 'failed',
      started_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
      error_message: 'Test error: API rate limit exceeded. Please try again later.',
      accounts_processed: 0,
      videos_found: 0
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating test job:', error);
    return;
  }

  console.log('Created test failed job:', data.id);
  console.log('Status:', data.status);
  console.log('Error message:', data.error_message);
}

createTestFailedJob();
