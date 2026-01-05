import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );

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
