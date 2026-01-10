import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

// GET - List all brands
export async function GET() {
  const supabase = getSupabase();
  const { data: brands, error } = await supabase
    .from('brands')
    .select('*')
    .order('name');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: brands });
}

// POST - Create a new brand
export async function POST(request: Request) {
  const supabase = getSupabase();
  const body = await request.json();
  const { name, description } = body;

  if (!name) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('brands')
    .insert({ name, description })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// DELETE - Delete a brand
export async function DELETE(request: Request) {
  const supabase = getSupabase();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Brand ID is required' }, { status: 400 });
  }

  // First delete all associated accounts (and their videos due to CASCADE)
  const { error: accountsError } = await supabase
    .from('competitor_accounts')
    .delete()
    .eq('brand_id', id);

  if (accountsError) {
    return NextResponse.json({ error: `Failed to delete accounts: ${accountsError.message}` }, { status: 500 });
  }

  // Then delete the brand
  const { error: brandError } = await supabase
    .from('brands')
    .delete()
    .eq('id', id);

  if (brandError) {
    return NextResponse.json({ error: `Failed to delete brand: ${brandError.message}` }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
