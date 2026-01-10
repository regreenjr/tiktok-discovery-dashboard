import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'

// GET /api/debug/auth - Debug authentication state
export async function GET() {
  const cookieStore = await cookies()
  const allCookies = cookieStore.getAll()

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  // Log all cookies (masked)
  const cookieInfo = allCookies.map(c => ({
    name: c.name,
    valueLength: c.value.length,
    valuePreview: c.value.substring(0, 50) + '...'
  }))

  console.log('[Debug Auth] Cookies found:', JSON.stringify(cookieInfo, null, 2))

  // Try to find and parse auth cookie
  const authCookie = allCookies.find(c => c.name.includes('auth-token'))

  let user = null
  let parseError = null

  if (authCookie) {
    try {
      // Supabase stores the token as base64 encoded JSON
      let tokenData
      try {
        // First try direct JSON parse
        tokenData = JSON.parse(authCookie.value)
      } catch {
        // Try base64 decode
        try {
          const decoded = Buffer.from(authCookie.value, 'base64').toString('utf-8')
          tokenData = JSON.parse(decoded)
        } catch {
          parseError = 'Failed to parse as JSON or base64'
        }
      }

      if (tokenData?.access_token) {
        const supabase = createClient(supabaseUrl, supabaseAnonKey, {
          global: {
            headers: {
              Authorization: `Bearer ${tokenData.access_token}`
            }
          }
        })

        const { data, error } = await supabase.auth.getUser()
        if (error) {
          parseError = error.message
        } else {
          user = data.user
        }
      } else if (!parseError) {
        parseError = 'No access_token in parsed data'
      }
    } catch (e) {
      parseError = String(e)
    }
  }

  return NextResponse.json({
    cookies: cookieInfo,
    authCookieFound: !!authCookie,
    user: user ? { id: user.id, email: user.email } : null,
    parseError
  })
}
