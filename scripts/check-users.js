const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function check() {
  // List all users
  const { data: { users }, error } = await supabase.auth.admin.listUsers();

  if (error) {
    console.log('Error:', error);
    return;
  }

  console.log('Users count:', users.length);
  users.forEach(user => {
    console.log('\nUser:', user.email);
    console.log('ID:', user.id);
    console.log('Metadata:', user.user_metadata);
  });
}

check();
