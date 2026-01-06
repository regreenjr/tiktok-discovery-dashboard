import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

export async function GET() {
  const supabase = getSupabase();
  const { data, error, count } = await supabase
    .from('competitor_videos')
    .select('*', { count: 'exact' })
    .limit(1);

  return NextResponse.json({
    success: !error,
    error: error ? {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code
    } : null,
    dataCount: count,
    sampleData: data?.[0] || null
  });
}
