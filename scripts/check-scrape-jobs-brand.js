require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function checkScrapeJobsBrand() {
  // Check all scrape jobs with brand info
  const { data, error } = await supabase
    .from('scrape_jobs')
    .select('*, brands(name)')
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('Total scrape jobs found:', data.length);

  data.forEach((job, i) => {
    console.log(`\nJob ${i + 1}:`);
    console.log('  Brand:', job.brands?.name || 'Unknown');
    console.log('  Brand ID:', job.brand_id);
    console.log('  Status:', job.status);
    console.log('  Error:', job.error_message || 'None');
  });

  // Get Mentor brand ID
  const { data: mentorBrand } = await supabase
    .from('brands')
    .select('id, name')
    .eq('name', 'Mentor')
    .single();

  console.log('\nMentor brand ID:', mentorBrand?.id);
}

checkScrapeJobsBrand();
