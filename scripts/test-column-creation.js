// Test if we can add user_id column via Supabase client
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function testColumn() {
  console.log('Testing column creation...');

  // First, check if the column exists
  const { data: brands, error: selectError } = await supabase
    .from('brands')
    .select('*')
    .limit(1);

  if (selectError) {
    console.error('Error selecting:', selectError);
    return;
  }

  console.log('Current columns:', brands?.[0] ? Object.keys(brands[0]) : 'empty');

  // Check if user_id column exists
  const hasUserId = brands?.[0] && 'user_id' in brands[0];
  console.log('Has user_id column:', hasUserId);

  if (!hasUserId) {
    console.log('\nTo add the user_id column, you need to run this SQL in Supabase:');
    console.log('Dashboard URL: https://supabase.com/dashboard/project/rexutrcvypdijyzvhkew/sql/new');
    console.log('');
    console.log('ALTER TABLE public.brands ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);');
    console.log('CREATE INDEX IF NOT EXISTS idx_brands_user_id ON public.brands(user_id);');
  }
}

testColumn();
