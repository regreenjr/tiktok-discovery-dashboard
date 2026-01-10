import { createClient } from '@supabase/supabase-js'

// Client-side Supabase client (uses anon key)
export function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables')
  }

  return createClient(supabaseUrl, supabaseAnonKey)
}

// Server-side Supabase client (uses service key for admin operations)
export function getSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables')
  }

  return createClient(supabaseUrl, supabaseServiceKey)
}

// Type definitions for database tables
export interface Database {
  public: {
    Tables: {
      brands: {
        Row: {
          id: string
          name: string
          created_at: string
          updated_at: string
          last_scraped_at: string | null
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
          updated_at?: string
          last_scraped_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
          updated_at?: string
          last_scraped_at?: string | null
        }
      }
      competitor_accounts: {
        Row: {
          id: string
          handle: string
          display_name: string | null
          follower_count: number | null
          is_active: boolean
          category: string | null
          notes: string | null
          created_at: string
          updated_at: string
          brand_id: string
        }
        Insert: {
          id?: string
          handle: string
          display_name?: string | null
          follower_count?: number | null
          is_active?: boolean
          category?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
          brand_id: string
        }
        Update: {
          id?: string
          handle?: string
          display_name?: string | null
          follower_count?: number | null
          is_active?: boolean
          category?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
          brand_id?: string
        }
      }
      videos: {
        Row: {
          id: string
          account_id: string
          tiktok_id: string
          description: string
          views: number
          comments: number
          shares: number
          saves: number
          virality_score: number
          hook_type: string | null
          format: string | null
          emotion: string | null
          posted_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          account_id: string
          tiktok_id: string
          description: string
          views: number
          comments: number
          shares: number
          saves: number
          virality_score: number
          hook_type?: string | null
          format?: string | null
          emotion?: string | null
          posted_at: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          account_id?: string
          tiktok_id?: string
          description?: string
          views?: number
          comments?: number
          shares?: number
          saves?: number
          virality_score?: number
          hook_type?: string | null
          format?: string | null
          emotion?: string | null
          posted_at?: string
          created_at?: string
          updated_at?: string
        }
      }
      scrape_jobs: {
        Row: {
          id: string
          brand_id: string
          scraper_type: string
          status: string
          started_at: string
          completed_at: string | null
          error_message: string | null
          accounts_processed: number
          videos_found: number
          created_at: string
        }
        Insert: {
          id?: string
          brand_id: string
          scraper_type: string
          status?: string
          started_at?: string
          completed_at?: string | null
          error_message?: string | null
          accounts_processed?: number
          videos_found?: number
          created_at?: string
        }
        Update: {
          id?: string
          brand_id?: string
          scraper_type?: string
          status?: string
          started_at?: string
          completed_at?: string | null
          error_message?: string | null
          accounts_processed?: number
          videos_found?: number
          created_at?: string
        }
      }
    }
  }
}
