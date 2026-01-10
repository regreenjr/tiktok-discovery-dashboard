const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function deleteBrand() {
  // Find the brand first
  const { data: brand, error: findError } = await supabase
    .from('brands')
    .select('id')
    .eq('name', 'CONCURRENCY_TEST_SESSION26')
    .single();

  if (findError) {
    console.log('Brand not found:', findError);
    return;
  }

  console.log('Found brand:', brand.id);

  // Delete it directly from database (simulating concurrent deletion)
  const { error: deleteError } = await supabase
    .from('brands')
    .delete()
    .eq('id', brand.id);

  if (deleteError) {
    console.log('Delete error:', deleteError);
  } else {
    console.log('Brand deleted from database');
  }
}

deleteBrand();
