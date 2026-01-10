// Confirm user email for testing
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function confirmEmail() {
  const email = 'testuser12345@gmail.com';

  // Get user by email
  const { data: users } = await supabase.auth.admin.listUsers();
  const user = users.users.find(u => u.email === email);

  if (!user) {
    console.log('User not found:', email);
    return;
  }

  console.log('Found user:', user.id);
  console.log('Email verified:', user.email_confirmed_at);

  // Confirm email
  const { data, error } = await supabase.auth.admin.updateUserById(
    user.id,
    {
      email_confirm: true,
      user_metadata: {
        ...user.user_metadata,
        email_verified: true
      }
    }
  );

  if (error) {
    console.error('Error confirming email:', error);
    return;
  }

  console.log('Email confirmed successfully!');
  console.log('User can now log in with:', email);
}

confirmEmail();
