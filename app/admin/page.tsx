'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseClient } from '@/lib/supabase'
import { fetchWithAuth } from '@/lib/api'

interface Brand {
  id: string
  name: string
  created_at: string
}

interface User {
  id: string
  email: string
  user_metadata: {
    brand_ids?: string[]
    role?: string
  }
  created_at: string
  last_sign_in_at?: string
}

interface Stats {
  totalBrands: number
  totalAccounts: number
  totalVideos: number
  totalUsers: number
}

export default function AdminPage() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [brands, setBrands] = useState<Brand[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [editRole, setEditRole] = useState<string>('')
  const [editBrandIds, setEditBrandIds] = useState<string>('')
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  useEffect(() => {
    async function checkAdminAndLoad() {
      const supabase = getSupabaseClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        router.push('/login')
        return
      }

      // Check if user is admin
      const userRole = session.user.user_metadata?.role
      if (userRole !== 'admin') {
        setIsAdmin(false)
        setLoading(false)
        return
      }

      setIsAdmin(true)

      // Load admin data
      try {
        // Fetch all brands
        const brandsRes = await fetchWithAuth('/api/admin/brands')
        if (brandsRes.ok) {
          const brandsData = await brandsRes.json()
          setBrands(brandsData.data || [])
        }

        // Fetch all users
        const usersRes = await fetchWithAuth('/api/admin/users')
        if (usersRes.ok) {
          const usersData = await usersRes.json()
          setUsers(usersData.data || [])
        }

        // Fetch stats
        const statsRes = await fetchWithAuth('/api/admin/stats')
        if (statsRes.ok) {
          const statsData = await statsRes.json()
          setStats(statsData.data)
        }
      } catch (err) {
        console.error('Error loading admin data:', err)
        setError('Failed to load admin data')
      }

      setLoading(false)
    }

    checkAdminAndLoad()
  }, [router])

  const openEditModal = (user: User) => {
    setEditingUser(user)
    setEditRole(user.user_metadata?.role || 'user')
    setEditBrandIds(user.user_metadata?.brand_ids?.join(', ') || '')
  }

  const handleSaveUser = async () => {
    if (!editingUser) return
    setSaving(true)
    setError(null)

    try {
      const brandIds = editBrandIds.split(',').map(s => s.trim()).filter(Boolean)
      const res = await fetchWithAuth(`/api/admin/users/${editingUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: editRole,
          brand_ids: brandIds.length > 0 ? brandIds : undefined
        })
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to update user')
      }

      // Refresh user list
      const usersRes = await fetchWithAuth('/api/admin/users')
      if (usersRes.ok) {
        const usersData = await usersRes.json()
        setUsers(usersData.data || [])
      }

      setEditingUser(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save user')
    }
    setSaving(false)
  }

  const handleDeleteUser = async (userId: string, email: string) => {
    if (!confirm(`Are you sure you want to delete user ${email}? This cannot be undone.`)) {
      return
    }

    try {
      const res = await fetchWithAuth(`/api/admin/users/${userId}`, {
        method: 'DELETE'
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to delete user')
      }

      // Refresh user list
      setUsers(users.filter(u => u.id !== userId))

      // Update stats
      if (stats) {
        setStats({ ...stats, totalUsers: stats.totalUsers - 1 })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete user')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  if (isAdmin === false) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-red-500 mb-4">Access Denied</h1>
          <p className="text-gray-400 mb-4">You do not have admin privileges.</p>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-300 px-4 py-2 rounded mb-6">
            {error}
          </div>
        )}

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="text-gray-400 text-sm">Total Brands</h3>
              <p className="text-3xl font-bold">{stats.totalBrands}</p>
            </div>
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="text-gray-400 text-sm">Total Accounts</h3>
              <p className="text-3xl font-bold">{stats.totalAccounts}</p>
            </div>
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="text-gray-400 text-sm">Total Videos</h3>
              <p className="text-3xl font-bold">{stats.totalVideos}</p>
            </div>
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="text-gray-400 text-sm">Total Users</h3>
              <p className="text-3xl font-bold">{stats.totalUsers}</p>
            </div>
          </div>
        )}

        {/* All Brands */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">All Brands ({brands.length})</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-gray-400 border-b border-gray-700">
                  <th className="pb-2">Name</th>
                  <th className="pb-2">ID</th>
                  <th className="pb-2">Created</th>
                </tr>
              </thead>
              <tbody>
                {brands.map(brand => (
                  <tr key={brand.id} className="border-b border-gray-700">
                    <td className="py-2">{brand.name}</td>
                    <td className="py-2 text-gray-400 text-sm font-mono">{brand.id}</td>
                    <td className="py-2 text-gray-400">{new Date(brand.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* All Users */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">All Users ({users.length})</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-gray-400 border-b border-gray-700">
                  <th className="pb-2">Email</th>
                  <th className="pb-2">Role</th>
                  <th className="pb-2">Assigned Brands</th>
                  <th className="pb-2">Created</th>
                  <th className="pb-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id} className="border-b border-gray-700">
                    <td className="py-2">{user.email}</td>
                    <td className="py-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        user.user_metadata?.role === 'admin'
                          ? 'bg-purple-500/20 text-purple-300'
                          : 'bg-gray-700 text-gray-300'
                      }`}>
                        {user.user_metadata?.role || 'user'}
                      </span>
                    </td>
                    <td className="py-2 text-gray-400 text-sm">
                      {user.user_metadata?.brand_ids?.length || 0} brands
                    </td>
                    <td className="py-2 text-gray-400">{new Date(user.created_at).toLocaleDateString()}</td>
                    <td className="py-2">
                      <button
                        onClick={() => openEditModal(user)}
                        className="px-2 py-1 bg-blue-600 text-xs rounded hover:bg-blue-700 mr-2"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id, user.email || '')}
                        className="px-2 py-1 bg-red-600 text-xs rounded hover:bg-red-700"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Edit User Modal */}
        {editingUser && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
              <h3 className="text-xl font-semibold mb-4">Edit User</h3>
              <p className="text-gray-400 mb-4">{editingUser.email}</p>

              <div className="mb-4">
                <label className="block text-gray-400 text-sm mb-1">Role</label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-gray-400 text-sm mb-1">Brand IDs (comma-separated)</label>
                <textarea
                  value={editBrandIds}
                  onChange={(e) => setEditBrandIds(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 h-20"
                  placeholder="uuid1, uuid2, ..."
                />
                <p className="text-gray-500 text-xs mt-1">Leave empty for admins to see all brands</p>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveUser}
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6">
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  )
}
