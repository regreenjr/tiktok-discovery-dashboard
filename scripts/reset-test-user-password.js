// Reset test user password
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function resetPassword() {
  const email = 'testuser12345@gmail.com';
  const { data: users } = await supabase.auth.admin.listUsers();
  const user = users.users.find(u => u.email === email);

  if (!user) {
    console.log('User not found');
    return;
  }

  const { data, error } = await supabase.auth.admin.updateUserById(user.id, {
    password: 'TestUser123!',
    email_confirm: true
  });

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('Password reset to: TestUser123!');
}

resetPassword();
