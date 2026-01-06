import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    hasNextPublicUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasNextPublicKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    hasSupabaseUrl: !!process.env.SUPABASE_URL,
    hasSupabaseKey: !!process.env.SUPABASE_SERVICE_KEY,
    // First 10 chars to verify it's the right value
    urlPreview: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 20),
    nodeEnv: process.env.NODE_ENV,
  });
}
