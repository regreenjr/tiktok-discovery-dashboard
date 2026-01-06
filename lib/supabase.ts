import { createClient, SupabaseClient } from '@supabase/supabase-js';

let cachedClient: SupabaseClient | null = null;

/**
 * Get Supabase client (lazy initialization)
 * Only creates client when first accessed, not during module load
 */
export function getSupabase(): SupabaseClient {
  if (!cachedClient) {
    const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    cachedClient = createClient(url, key);
  }
  return cachedClient;
}
