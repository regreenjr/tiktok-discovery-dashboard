import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

// GET - List all accounts (optionally filtered by brand)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const brandId = searchParams.get('brandId');

  let query = supabase
    .from('competitor_accounts')
    .select('*, brands(name)')
    .order('handle');

  if (brandId) {
    query = query.eq('brand_id', brandId);
  }

  const { data: accounts, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(accounts);
}

// POST - Create a new account
export async function POST(request: Request) {
  const body = await request.json();
  const { handle, brand_id, platform = 'tiktok', is_active = true } = body;

  if (!handle || !brand_id) {
    return NextResponse.json(
      { error: 'Handle and brand_id are required' },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from('competitor_accounts')
    .insert({ handle, brand_id, platform, is_active })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// PATCH - Update an account
export async function PATCH(request: Request) {
  const body = await request.json();
  const { id, handle, brand_id, is_active } = body;

  if (!id) {
    return NextResponse.json({ error: 'Account ID is required' }, { status: 400 });
  }

  const updates: any = {};
  if (handle !== undefined) updates.handle = handle;
  if (brand_id !== undefined) updates.brand_id = brand_id;
  if (is_active !== undefined) updates.is_active = is_active;

  const { data, error } = await supabase
    .from('competitor_accounts')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// DELETE - Delete an account
export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Account ID is required' }, { status: 400 });
  }

  const { error } = await supabase
    .from('competitor_accounts')
    .delete()
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
