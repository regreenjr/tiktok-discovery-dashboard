import { NextResponse } from 'next/server';

export async function GET() {
  const url = process.env.SUPABASE_URL || '';
  const key = process.env.SUPABASE_SERVICE_KEY || '';

  return NextResponse.json({
    urlLength: url.length,
    urlFirst20: url.substring(0, 20),
    urlLast10: url.substring(url.length - 10),
    keyLength: key.length,
    keyFirst20: key.substring(0, 20),
    keyLast10: key.substring(key.length - 10),
    hasQuotesUrl: url.startsWith('"') || url.endsWith('"'),
    hasQuotesKey: key.startsWith('"') || key.endsWith('"'),
  });
}
