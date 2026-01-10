// Setup user-brand assignments for multi-user testing
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function setup() {
  console.log('Checking user_brand_assignments table...');

  // Try to select from the table to see if it exists
  const { error: checkError } = await supabase
    .from('user_brand_assignments')
    .select('*')
    .limit(1);

  if (checkError && checkError.message.includes('relation')) {
    console.log('Table does not exist.');
    console.log('\nTo create the table, run this SQL in Supabase Dashboard:');
    console.log('https://supabase.com/dashboard/project/rexutrcvypdijyzvhkew/sql/new');
    console.log('');
    console.log(`
-- Create user_brand_assignments table for multi-user support
CREATE TABLE IF NOT EXISTS public.user_brand_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  brand_id UUID NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, brand_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_brand_assignments_user_id ON public.user_brand_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_user_brand_assignments_brand_id ON public.user_brand_assignments(brand_id);

-- Enable RLS
ALTER TABLE public.user_brand_assignments ENABLE ROW LEVEL SECURITY;

-- Policy for users to see only their own assignments
CREATE POLICY "Users can see own assignments" ON public.user_brand_assignments
  FOR SELECT USING (auth.uid() = user_id);

-- Policy for service role to manage all
CREATE POLICY "Service can manage all" ON public.user_brand_assignments
  FOR ALL USING (true) WITH CHECK (true);
    `.trim());
    return;
  }

  if (checkError) {
    console.error('Error:', checkError);
    return;
  }

  console.log('Table exists! Ready for multi-user testing.');
}

setup();
