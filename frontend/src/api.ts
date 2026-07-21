export type User = {
  id: number
  name: string
}

const API_BASE = '/api'

export async function getHealth(): Promise<{ status: string }> {
  const response = await fetch(`${API_BASE}/health`)
  if (!response.ok) {
    throw new Error('Health check failed')
  }
  return response.json()
}

export async function getUsers(): Promise<User[]> {
  const response = await fetch(`${API_BASE}/users`)
  if (!response.ok) {
    throw new Error('Failed to fetch users')
  }
  return response.json()
}

export async function createUser(name: string): Promise<User> {
  const response = await fetch(`${API_BASE}/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  })
  if (!response.ok) {
    throw new Error('Failed to create user')
  }
  return response.json()
}
