import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    hasSupabaseUrl: !!process.env.SUPABASE_URL,
    hasSupabaseKey: !!process.env.SUPABASE_SERVICE_KEY,
    urlValue: process.env.SUPABASE_URL,
    keyPrefix: process.env.SUPABASE_SERVICE_KEY?.substring(0, 20) + '...',
    keyLength: process.env.SUPABASE_SERVICE_KEY?.length || 0,
    allEnvKeys: Object.keys(process.env).filter(k => k.includes('SUPABASE'))
  });
}
