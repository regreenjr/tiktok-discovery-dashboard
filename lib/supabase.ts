import { createClient, SupabaseClient } from '@supabase/supabase-js';

let cachedClient: SupabaseClient | null = null;

/**
 * Get Supabase client (lazy initialization)
 * Only creates client when first accessed, not during module load
 */
function stripQuotes(value: string): string {
  if (!value) return value;
  // Remove surrounding quotes if present
  return value.replace(/^["'](.*)["']$/, '$1');
}

export function getSupabase(): SupabaseClient {
  if (!cachedClient) {
    const rawUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const rawKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

    const url = stripQuotes(rawUrl);
    const key = stripQuotes(rawKey);

    // Debug logging
    console.log('Supabase init:', {
      urlRaw: rawUrl?.substring(0, 30),
      urlStripped: url?.substring(0, 30),
      keyRaw: rawKey?.substring(0, 30),
      keyStripped: key?.substring(0, 30),
      hadQuotesUrl: rawUrl !== url,
      hadQuotesKey: rawKey !== key,
    });

    if (!url || !key) {
      throw new Error('Supabase configuration is missing');
    }

    cachedClient = createClient(url, key);
  }
  return cachedClient;
}
