import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load local environment
dotenv.config({ path: '.env.local' });

const url = process.env.SUPABASE_URL || '';
const key = process.env.SUPABASE_SERVICE_KEY || '';

console.log('Testing Supabase client locally');
console.log('URL:', url);
console.log('Key length:', key.length);
console.log('Key preview:', key.substring(0, 50) + '...');

const supabase = createClient(url, key);

async function test() {
  console.log('\nQuerying brands table...');
  const { data, error } = await supabase
    .from('brands')
    .select('*')
    .limit(1);

  if (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }

  console.log('✅ Success! Data:', data);
}

test();
