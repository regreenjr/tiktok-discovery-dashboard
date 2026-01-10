import { getSupabaseClient } from './supabase'

// Helper to make authenticated API requests
export async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const supabase = getSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()

  const headers = new Headers(options.headers)

  if (session?.access_token) {
    headers.set('Authorization', `Bearer ${session.access_token}`)
  }

  return fetch(url, {
    ...options,
    headers
  })
}

// GET request with auth
export async function getWithAuth<T>(url: string): Promise<T> {
  const response = await fetchWithAuth(url)
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Request failed')
  }
  return response.json()
}

// POST request with auth
export async function postWithAuth<T>(url: string, data: unknown): Promise<T> {
  const response = await fetchWithAuth(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Request failed')
  }
  return response.json()
}

// DELETE request with auth
export async function deleteWithAuth<T>(url: string): Promise<T> {
  const response = await fetchWithAuth(url, {
    method: 'DELETE'
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Request failed')
  }
  return response.json()
}
