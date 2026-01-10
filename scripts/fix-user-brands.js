const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function fix() {
  const email = 'testuser12345@gmail.com';

  // Get the user
  const { data: users } = await supabase.auth.admin.listUsers();
  const user = users.users.find(u => u.email === email);

  if (!user) {
    console.log('User not found');
    return;
  }

  console.log('Current brand_ids:', user.user_metadata.brand_ids);

  // Get all brands in the database that should belong to this user (created by them)
  // For now, just add the DELETE_VERIFY_111 brand they just created
  const { data: brands } = await supabase
    .from('brands')
    .select('id, name')
    .in('name', ['Mentor', 'DELETE_VERIFY_111']);

  const brandIds = brands.map(b => b.id);
  console.log('Updating to brand_ids:', brandIds);

  const { error } = await supabase.auth.admin.updateUserById(user.id, {
    user_metadata: {
      ...user.user_metadata,
      brand_ids: brandIds
    }
  });

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('Updated user brand_ids successfully');
}

fix();
