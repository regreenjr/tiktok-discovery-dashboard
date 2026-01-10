// Script to add user_id column to brands table via Supabase REST API
const https = require('https');
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

// Extract project ref from URL
const projectRef = SUPABASE_URL.split('//')[1].split('.')[0];

const sql = `
-- Add user_id column to brands table for multi-user support
ALTER TABLE public.brands ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_brands_user_id ON public.brands(user_id);
`;

async function runSQL() {
  return new Promise((resolve, reject) => {
    const url = `${SUPABASE_URL}/rest/v1/rpc/exec_sql`;
    const parsedUrl = new URL(url);

    const options = {
      hostname: parsedUrl.hostname,
      path: parsedUrl.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log('Status:', res.statusCode);
        console.log('Response:', data);
        resolve(data);
      });
    });

    req.on('error', reject);
    req.write(JSON.stringify({ query: sql }));
    req.end();
  });
}

// Alternative: Use pg directly if available
async function runWithPg() {
  try {
    const { Pool } = require('pg');

    // Try direct connection - this usually won't work due to network restrictions
    // So we'll fall back to updating through the API in a different way
    console.log('pg module not available or direct DB connection not supported');
    console.log('');
    console.log('Please run this SQL in the Supabase SQL Editor:');
    console.log('https://supabase.com/dashboard/project/' + projectRef + '/sql/new');
    console.log('');
    console.log(sql);
  } catch (e) {
    console.log('pg module not available');
    console.log('');
    console.log('Please run this SQL in the Supabase SQL Editor:');
    console.log('https://supabase.com/dashboard/project/' + projectRef + '/sql/new');
    console.log('');
    console.log(sql);
  }
}

runWithPg();
