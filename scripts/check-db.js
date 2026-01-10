const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function check() {
  // Check videos in database
  const { data: videos, error } = await supabase
    .from('competitor_videos')
    .select('id, account_id, caption')
    .limit(5);

  console.log('Sample videos:', videos);
  console.log('Videos error:', error);

  // Check competitor accounts
  const { data: accounts, error: accError } = await supabase
    .from('competitor_accounts')
    .select('id, handle, brand_id')
    .limit(10);

  console.log('Sample accounts:', accounts);
  console.log('Accounts error:', accError);
}

check();
