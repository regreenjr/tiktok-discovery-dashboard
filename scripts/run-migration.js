// Script to add user_id column to brands table
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function runMigration() {
  console.log('Running migration to add user_id to brands table...');

  // Check if user_id column already exists
  const { data: columns, error: columnsError } = await supabase
    .rpc('exec_sql', {
      query: `SELECT column_name FROM information_schema.columns WHERE table_name = 'brands' AND column_name = 'user_id'`
    });

  // Since RPC may not be available, let's try to add the column directly through a workaround
  // We'll use the brands table to check existing structure first
  const { data: brands, error: brandsError } = await supabase
    .from('brands')
    .select('*')
    .limit(1);

  if (brandsError) {
    console.error('Error checking brands table:', brandsError);
    return;
  }

  console.log('Current brands structure:', brands && brands[0] ? Object.keys(brands[0]) : 'empty table');

  // Check if user_id already exists
  if (brands && brands[0] && 'user_id' in brands[0]) {
    console.log('user_id column already exists!');
    return;
  }

  console.log('Note: To add user_id column, run this SQL in Supabase SQL Editor:');
  console.log(`
ALTER TABLE public.brands ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
CREATE INDEX IF NOT EXISTS idx_brands_user_id ON public.brands(user_id);
  `);
}

runMigration();
