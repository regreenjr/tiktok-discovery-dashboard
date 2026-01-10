// Setup multi-user brand assignments for testing
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function setup() {
  console.log('Setting up multi-user brand assignments...\n');

  // Get users
  const { data: users } = await supabase.auth.admin.listUsers();

  // Get brands
  const { data: brands } = await supabase.from('brands').select('*');

  console.log('Users:');
  users.users.forEach(u => console.log(`- ${u.email}`));

  console.log('\nBrands:');
  brands.forEach(b => console.log(`- ${b.name} (${b.id})`));

  // Find specific users
  const userA = users.users.find(u => u.email === 'verifytest184@gmail.com');
  const userB = users.users.find(u => u.email === 'testuser12345@gmail.com');

  // Find brands
  const brandMentor = brands.find(b => b.name === 'Mentor');
  const brandSwipe67 = brands.find(b => b.name === 'Swipe67');

  if (!userA || !userB || !brandMentor || !brandSwipe67) {
    console.error('Missing required users or brands');
    return;
  }

  // Assign Swipe67 to User A (verifytest184@gmail.com)
  console.log('\nAssigning Swipe67 to verifytest184@gmail.com...');
  await supabase.auth.admin.updateUserById(userA.id, {
    user_metadata: {
      ...userA.user_metadata,
      brand_ids: [brandSwipe67.id]
    }
  });

  // Assign Mentor to User B (testuser12345@gmail.com)
  console.log('Assigning Mentor to testuser12345@gmail.com...');
  await supabase.auth.admin.updateUserById(userB.id, {
    user_metadata: {
      ...userB.user_metadata,
      brand_ids: [brandMentor.id]
    }
  });

  console.log('\nSetup complete!');
  console.log('- User A (verifytest184@gmail.com) can only see: Swipe67');
  console.log('- User B (testuser12345@gmail.com) can only see: Mentor');
}

setup();
