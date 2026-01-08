import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

// POST - Create multiple accounts at once
export async function POST(request: Request) {
  console.log('[Bulk API] Starting bulk account creation');

  const supabase = getSupabase();
  const body = await request.json();
  const { handles, brand_id, platform = 'tiktok', is_active = true } = body;

  console.log('[Bulk API] Received request:', {
    handleCount: handles?.length,
    brand_id,
    platform,
    is_active
  });

  if (!handles || !Array.isArray(handles) || handles.length === 0) {
    console.log('[Bulk API] ERROR: Invalid handles array');
    return NextResponse.json(
      { success: false, error: 'Handles array is required and must not be empty' },
      { status: 400 }
    );
  }

  if (!brand_id) {
    console.log('[Bulk API] ERROR: Missing brand_id');
    return NextResponse.json(
      { success: false, error: 'brand_id is required' },
      { status: 400 }
    );
  }

  try {
    // Get ALL existing accounts (handle has unique constraint across all brands)
    console.log('[Bulk API] Fetching existing accounts...');
    const { data: existingAccounts, error: fetchError } = await supabase
      .from('competitor_accounts')
      .select('handle');

    if (fetchError) {
      console.log('[Bulk API] ERROR fetching existing accounts:', fetchError);
      return NextResponse.json(
        { success: false, error: `Failed to fetch existing accounts: ${fetchError.message}` },
        { status: 500 }
      );
    }

    console.log('[Bulk API] Found existing accounts:', existingAccounts?.length || 0);

    const existingHandles = new Set(
      (existingAccounts || []).map((acc) => acc.handle.toLowerCase())
    );

    // Filter out duplicates and prepare new accounts
    const newAccounts = handles
      .filter((handle) => !existingHandles.has(handle.toLowerCase()))
      .map((handle) => ({
        handle,
        brand_id,
        platform,
        is_active,
      }));

    const duplicates = handles.length - newAccounts.length;

    console.log('[Bulk API] Processing:', {
      totalHandles: handles.length,
      newAccounts: newAccounts.length,
      duplicates
    });

    // Insert new accounts in bulk
    if (newAccounts.length > 0) {
      console.log('[Bulk API] Inserting new accounts...');
      const { data, error } = await supabase
        .from('competitor_accounts')
        .insert(newAccounts)
        .select();

      if (error) {
        console.log('[Bulk API] ERROR inserting accounts:', error);
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 500 }
        );
      }

      console.log('[Bulk API] Successfully created accounts:', data?.length);

      return NextResponse.json({
        success: true,
        created: newAccounts.length,
        duplicates,
        accounts: data,
      });
    } else {
      console.log('[Bulk API] All handles are duplicates');
      return NextResponse.json({
        success: true,
        created: 0,
        duplicates,
        message: 'All handles already exist in the database (handles must be unique across all brands)',
      });
    }
  } catch (error: any) {
    console.log('[Bulk API] EXCEPTION:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
