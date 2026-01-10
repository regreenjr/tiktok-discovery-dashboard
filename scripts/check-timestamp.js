require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function checkTimestamp() {
  const { data, error } = await supabase
    .from('brands')
    .select('*')
    .eq('name', 'TIMESTAMP_TEST_SESSION23')
    .single();

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('Brand created_at:', data.created_at);
  console.log('Brand updated_at:', data.updated_at);

  const now = new Date();
  const created = new Date(data.created_at);
  const diffSeconds = Math.abs((now - created) / 1000);

  console.log('Current time:', now.toISOString());
  console.log('Time difference from now (seconds):', diffSeconds);
  console.log('Timestamp within 1 minute:', diffSeconds < 60 ? 'YES - PASS' : 'NO - FAIL');
}

checkTimestamp();
