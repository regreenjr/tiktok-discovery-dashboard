// Run SQL migration via Supabase Management API
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

// Extract project ref from URL
const projectRef = SUPABASE_URL.split('//')[1].split('.')[0];

const sql = `
ALTER TABLE public.brands ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
CREATE INDEX IF NOT EXISTS idx_brands_user_id ON public.brands(user_id);
`;

async function runSQL() {
  // Try using the postgrest endpoint to create a function that runs the SQL
  // This approach uses Supabase's postgres functions feature

  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
    },
    body: JSON.stringify({ query: sql }),
  });

  if (!response.ok) {
    console.log('exec_sql RPC not available (expected).');
    console.log('');
    console.log('To add the user_id column, please run this SQL in Supabase Dashboard:');
    console.log(`https://supabase.com/dashboard/project/${projectRef}/sql/new`);
    console.log('');
    console.log('SQL to run:');
    console.log('```sql');
    console.log(sql);
    console.log('```');
    console.log('');
    console.log('Alternatively, the app will handle this gracefully by checking column existence.');
    return false;
  }

  const result = await response.json();
  console.log('Migration result:', result);
  return true;
}

runSQL().catch(console.error);
