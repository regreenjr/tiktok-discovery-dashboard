import { NextResponse } from 'next/server';

/**
 * Runtime configuration endpoint
 * Returns public configuration that the client needs
 */
export async function GET() {
  return NextResponse.json({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  });
}
