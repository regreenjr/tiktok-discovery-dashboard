'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { DashboardGrid } from '@/components/dashboard/DashboardGrid'
import { ScrapeStatus } from '@/components/ScrapeStatus'
import { Brand } from '@/lib/analytics/types'
import { getSupabaseClient } from '@/lib/supabase'
import { fetchWithAuth } from '@/lib/api'
import type { User } from '@supabase/supabase-js'

export default function Dashboard() {
  const router = useRouter()
  const [brands, setBrands] = useState<Brand[]>([])
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  const [loggingOut, setLoggingOut] = useState(false)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const supabase = getSupabaseClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      // Not authenticated, redirect to login
      router.push('/login?redirectTo=/')
      return
    }

    setUser(session.user)
    fetchBrands()
  }

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      const supabase = getSupabaseClient()
      await supabase.auth.signOut()
      router.push('/login')
    } catch (error) {
      console.error('[Frontend] Error logging out:', error)
    } finally {
      setLoggingOut(false)
    }
  }

  const fetchBrands = async () => {
    try {
      // Use authenticated fetch to include user's access token
      const response = await fetchWithAuth('/api/brands')
      const data = await response.json()
      if (data.data) {
        setBrands(data.data)
        if (data.data.length > 0 && !selectedBrand) {
          setSelectedBrand(data.data[0])
        }
      }
    } catch (error) {
      console.error('[Frontend] Error fetching brands:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleBrandChange = (brandId: string) => {
    const brand = brands.find(b => b.id === brandId)
    setSelectedBrand(brand || null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <main className="min-h-screen">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-3 sm:py-0 sm:h-16 gap-2 sm:gap-0">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <div className="flex items-center justify-between">
                <h1 className="text-xl font-bold text-gray-900">
                  TikTok Discovery
                </h1>
                {/* Navigation - Mobile */}
                <nav className="flex sm:hidden space-x-2">
                  <Link
                    href="/"
                    className="px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded-md"
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/manage"
                    className="px-2 py-1 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md"
                  >
                    Manage
                  </Link>
                  {user ? (
                    <button
                      onClick={handleLogout}
                      disabled={loggingOut}
                      className="px-2 py-1 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md disabled:opacity-50"
                    >
                      Logout
                    </button>
                  ) : (
                    <Link
                      href="/login"
                      className="px-2 py-1 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md"
                    >
                      Login
                    </Link>
                  )}
                </nav>
              </div>

              <div className="flex items-center gap-2">
                {/* Brand Selector */}
                <select
                  value={selectedBrand?.id || ''}
                  onChange={(e) => handleBrandChange(e.target.value)}
                  className="block w-full sm:w-48 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                >
                  <option value="">Select a brand</option>
                  {brands.map((brand) => (
                    <option key={brand.id} value={brand.id}>
                      {brand.name}
                    </option>
                  ))}
                </select>

                {/* Scrape Status Badge */}
                {selectedBrand && (
                  <ScrapeStatus brandId={selectedBrand.id} />
                )}
              </div>
            </div>

            {/* Navigation - Desktop */}
            <nav className="hidden sm:flex items-center space-x-4">
              <Link
                href="/"
                className="px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md"
              >
                Dashboard
              </Link>
              <Link
                href="/manage"
                className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md"
              >
                Manage
              </Link>
              {user ? (
                <button
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md disabled:opacity-50"
                >
                  {loggingOut ? 'Logging out...' : 'Logout'}
                </button>
              ) : (
                <Link
                  href="/login"
                  className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md"
                >
                  Login
                </Link>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {selectedBrand ? (
          <DashboardGrid brandId={selectedBrand.id} />
        ) : (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold text-gray-700 mb-2">
              No Brand Selected
            </h2>
            <p className="text-gray-500 mb-4">
              Select a brand from the dropdown above or create a new one.
            </p>
            <Link
              href="/manage"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              Go to Manage
            </Link>
          </div>
        )}
      </div>
    </main>
  )
}
