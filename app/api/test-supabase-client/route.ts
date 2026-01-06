import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    // Get the exact same credentials
    const url = process.env.SUPABASE_URL || '';
    const key = process.env.SUPABASE_SERVICE_KEY || '';

    console.log('Testing Supabase client with:', {
      url: url.substring(0, 30),
      keyLength: key.length,
    });

    // Create client directly (not using shared instance)
    const supabase = createClient(url, key);

    // Try to query brands
    const { data, error } = await supabase
      .from('brands')
      .select('*')
      .limit(1);

    if (error) {
      console.error('Supabase query error:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });

      return NextResponse.json({
        success: false,
        error: {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        },
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data,
      message: 'Successfully connected to Supabase',
    });
  } catch (err) {
    const error = err as Error;
    console.error('Unexpected error:', error);
    return NextResponse.json({
      success: false,
      error: {
        message: error.message,
        stack: error.stack,
      },
    }, { status: 500 });
  }
}
