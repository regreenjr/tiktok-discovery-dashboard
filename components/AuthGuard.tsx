'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseClient } from '@/lib/supabase'

interface AuthGuardProps {
  children: React.ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [authenticated, setAuthenticated] = useState(false)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const supabase = getSupabaseClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        // Redirect to login with return URL
        const currentPath = window.location.pathname
        router.push(`/login?redirectTo=${encodeURIComponent(currentPath)}`)
        return
      }

      setAuthenticated(true)
    } catch (error) {
      console.error('[AuthGuard] Error checking auth:', error)
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!authenticated) {
    return null
  }

  return <>{children}</>
}
