import { NextResponse } from 'next/server';

export async function GET() {
  const rawUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const rawKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  function stripQuotes(value: string): string {
    if (!value) return value;
    return value.replace(/^["'](.*)["']$/, '$1');
  }

  const url = stripQuotes(rawUrl);
  const key = stripQuotes(rawKey);

  return NextResponse.json({
    urlSource: process.env.SUPABASE_URL ? 'SUPABASE_URL' : 'NEXT_PUBLIC_SUPABASE_URL',
    keySource: process.env.SUPABASE_SERVICE_KEY ? 'SUPABASE_SERVICE_KEY' : 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    urlLength: url.length,
    keyLength: key.length,
    urlFirst30: url.substring(0, 30),
    keyFirst30: key.substring(0, 30),
    keyLast30: key.substring(Math.max(0, key.length - 30)),
    // Show if it's the service key or anon key by checking the role claim
    // Service keys start with eyJ and contain "role":"service_role"
    // Anon keys contain "role":"anon"
    keyType: key.includes('InNlcnZpY2Vfcm9sZSI') ? 'service_role' :
             key.includes('ImFub24i') ? 'anon' : 'unknown',
  });
}
