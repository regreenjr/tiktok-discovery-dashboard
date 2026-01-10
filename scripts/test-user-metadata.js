// Test if we can store brand assignments in user metadata
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function testMetadata() {
  console.log('Testing user metadata...');

  // Get users
  const { data: users, error: usersError } = await supabase.auth.admin.listUsers();

  if (usersError) {
    console.error('Error listing users:', usersError);
    return;
  }

  console.log('Users found:', users.users.length);
  for (const user of users.users) {
    console.log(`- ${user.email} (${user.id})`);
    console.log('  User metadata:', user.user_metadata);
    console.log('  App metadata:', user.app_metadata);
  }

  // Get brands
  const { data: brands, error: brandsError } = await supabase
    .from('brands')
    .select('*');

  if (brandsError) {
    console.error('Error fetching brands:', brandsError);
    return;
  }

  console.log('\nBrands found:', brands.length);
  for (const brand of brands) {
    console.log(`- ${brand.name} (${brand.id})`);
  }

  // Test updating user metadata to assign a brand
  if (users.users.length > 0 && brands.length > 0) {
    const firstUser = users.users[0];
    const firstBrand = brands[0];

    console.log(`\nAssigning brand "${firstBrand.name}" to user "${firstUser.email}"...`);

    const { data: updateData, error: updateError } = await supabase.auth.admin.updateUserById(
      firstUser.id,
      {
        user_metadata: {
          ...firstUser.user_metadata,
          brand_ids: [firstBrand.id]
        }
      }
    );

    if (updateError) {
      console.error('Error updating user:', updateError);
    } else {
      console.log('User updated successfully!');
      console.log('New metadata:', updateData.user.user_metadata);
    }
  }
}

testMetadata();
