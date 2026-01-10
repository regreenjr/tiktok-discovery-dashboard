// Setup admin user for testing
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function setupAdmin() {
  console.log('Setting up admin user...\n');

  // Get all users
  const { data: users } = await supabase.auth.admin.listUsers();

  console.log('Current users:');
  users.users.forEach(u => {
    console.log(`- ${u.email} (role: ${u.user_metadata?.role || 'user'})`);
  });

  // Find the user to make admin - using solvingalpha.marketing@gmail.com
  const adminEmail = process.env.ADMIN_EMAIL || 'solvingalpha.marketing@gmail.com';
  const adminUser = users.users.find(u => u.email === adminEmail);

  if (!adminUser) {
    console.log(`\nUser ${adminEmail} not found.`);
    console.log('Available users:', users.users.map(u => u.email).join(', '));
    return;
  }

  console.log(`\nMaking ${adminEmail} an admin...`);

  // Set admin role
  const { data, error } = await supabase.auth.admin.updateUserById(
    adminUser.id,
    {
      user_metadata: {
        ...adminUser.user_metadata,
        role: 'admin',
        // Admin can see all brands - remove brand_ids restriction
        brand_ids: undefined
      }
    }
  );

  if (error) {
    console.error('Error setting admin:', error);
    return;
  }

  console.log('Admin role set successfully!');
  console.log('User can now access /admin page');
}

setupAdmin();
