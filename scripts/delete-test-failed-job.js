require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function deleteTestFailedJob() {
  const { data, error } = await supabase
    .from('scrape_jobs')
    .delete()
    .eq('error_message', 'Test error: API rate limit exceeded. Please try again later.')
    .select();

  if (error) {
    console.error('Error deleting test job:', error);
    return;
  }

  console.log('Deleted test jobs:', data.length);
}

deleteTestFailedJob();
