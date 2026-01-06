import { createClient } from '@supabase/supabase-js';

// Use dummy values during build if env vars not available
const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const key = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

/**
 * Shared Supabase client for server-side use
 * Uses placeholder values during build, real values at runtime
 */
export const supabase = createClient(url, key);
