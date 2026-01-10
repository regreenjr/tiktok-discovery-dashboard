// Test API user isolation
const token = process.argv[2];

async function testIsolation() {
  // Swipe67 brand belongs to verifytest184@gmail.com, not testuser12345@gmail.com
  const otherUserBrandId = 'a4f01a84-117e-4a59-bb09-9608ce2d1464';

  console.log('Testing API isolation...\n');

  // Step 2-3: GET /api/brands should only return User A's brands
  console.log('1. GET /api/brands (should only return Mentor, not Swipe67):');
  const brandsRes = await fetch('http://localhost:3000/api/brands', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const brandsData = await brandsRes.json();
  console.log('   Status:', brandsRes.status);
  console.log('   Brands:', brandsData.data?.map(b => b.name) || []);

  const hasSwipe67 = brandsData.data?.some(b => b.name === 'Swipe67');
  console.log('   Contains Swipe67 (should be false):', hasSwipe67);
  console.log('   PASS:', !hasSwipe67 ? 'YES' : 'NO');

  // Step 4: Try to delete User B's brand
  console.log('\n2. DELETE /api/brands/[Swipe67 ID] (should be forbidden):');
  const deleteRes = await fetch(`http://localhost:3000/api/brands/${otherUserBrandId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const deleteData = await deleteRes.json();
  console.log('   Status:', deleteRes.status);
  console.log('   Response:', deleteData);
  console.log('   PASS:', deleteRes.status === 403 ? 'YES' : 'NO');

  // Step 5: Verify Swipe67 still exists
  console.log('\n3. Verify Swipe67 still exists in database:');
  const { createClient } = require('@supabase/supabase-js');
  require('dotenv').config({ path: '.env.local' });
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );
  const { data: brand } = await supabase
    .from('brands')
    .select('name')
    .eq('id', otherUserBrandId)
    .single();
  console.log('   Swipe67 exists:', !!brand);
  console.log('   PASS:', brand ? 'YES' : 'NO');

  console.log('\n--- All API isolation tests completed ---');
}

testIsolation();
