// Reset user password for testing
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function resetPassword() {
  const email = 'testuser12345@gmail.com';
  const newPassword = 'TestPassword123!';

  // Get user by email
  const { data: users } = await supabase.auth.admin.listUsers();
  const user = users.users.find(u => u.email === email);

  if (!user) {
    console.log('User not found:', email);
    return;
  }

  console.log('Found user:', user.id);

  // Update password
  const { data, error } = await supabase.auth.admin.updateUserById(
    user.id,
    { password: newPassword }
  );

  if (error) {
    console.error('Error updating password:', error);
    return;
  }

  console.log('Password reset successfully!');
  console.log('Email:', email);
  console.log('New password:', newPassword);
}

resetPassword();
