const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function deleteBrand(brandId) {
  const { error } = await supabase
    .from('brands')
    .delete()
    .eq('id', brandId);

  if (error) {
    console.log('Error:', error);
  } else {
    console.log('Brand deleted successfully');
  }
}

const brandId = process.argv[2];
if (!brandId) {
  console.log('Usage: node delete-brand-direct.js <brand-id>');
  process.exit(1);
}
deleteBrand(brandId);
