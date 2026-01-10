const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function check() {
  const { data: brands, error } = await supabase
    .from('brands')
    .select('*')
    .order('created_at', { ascending: false });

  console.log('All brands in database:');
  brands.forEach(b => {
    console.log(`- ${b.name} (${b.id})`);
  });
  console.log('Error:', error);
}

check();
