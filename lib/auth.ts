import { createClient } from '@supabase/supabase-js'
import { headers } from 'next/headers'
import type { User } from '@supabase/supabase-js'

// Extended user type with brand_ids and role in metadata
export interface UserWithBrands extends User {
  user_metadata: {
    brand_ids?: string[]
    role?: 'admin' | 'user'
    [key: string]: unknown
  }
}

// Get the authenticated user from the request using Authorization header
export async function getAuthenticatedUser(): Promise<UserWithBrands | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('[Auth] Missing Supabase environment variables')
    return null
  }

  try {
    // Get Authorization header from the request
    const headersList = await headers()
    const authHeader = headersList.get('authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('[Auth] No authorization header found')
      return null
    }

    const accessToken = authHeader.substring(7) // Remove 'Bearer ' prefix

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }
    })

    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) {
      console.error('[Auth] Error getting user:', error)
      return null
    }

    console.log('[Auth] User authenticated:', user?.id)
    console.log('[Auth] User brand_ids:', (user as UserWithBrands)?.user_metadata?.brand_ids)
    return user as UserWithBrands
  } catch (e) {
    console.error('[Auth] Error:', e)
    return null
  }
}

// Get the user's assigned brand IDs from their metadata
export function getUserBrandIds(user: UserWithBrands | null): string[] {
  if (!user) return []
  return user.user_metadata?.brand_ids || []
}

// Check if user is an admin
export function isAdmin(user: UserWithBrands | null): boolean {
  if (!user) return false
  return user.user_metadata?.role === 'admin'
}

// Check if user_id column exists in brands table
let userIdColumnExists: boolean | null = null

export async function checkUserIdColumnExists(): Promise<boolean> {
  if (userIdColumnExists !== null) {
    return userIdColumnExists
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    return false
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  // Try to select user_id column - if it fails, the column doesn't exist
  const { error } = await supabase
    .from('brands')
    .select('user_id')
    .limit(1)

  userIdColumnExists = !error || !error.message.includes('user_id')
  console.log('[Auth] user_id column exists:', userIdColumnExists)
  return userIdColumnExists
}

// Reset the column existence cache (useful after migrations)
export function resetUserIdColumnCache() {
  userIdColumnExists = null
}
