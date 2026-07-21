import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { createUser, getHealth, getUsers, type User } from './api'
import './App.css'

function App() {
  const [backendStatus, setBackendStatus] = useState<'loading' | 'ok' | 'error'>(
    'loading',
  )
  const [users, setUsers] = useState<User[]>([])
  const [usersLoading, setUsersLoading] = useState(true)
  const [usersError, setUsersError] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const loadUsers = useCallback(async () => {
    setUsersLoading(true)
    setUsersError(null)

    try {
      const data = await getUsers()
      setUsers(data)
    } catch {
      setUsersError('Could not load users')
    } finally {
      setUsersLoading(false)
    }
  }, [])

  useEffect(() => {
    getHealth()
      .then((data) => {
        setBackendStatus(data.status === 'ok' ? 'ok' : 'error')
      })
      .catch(() => {
        setBackendStatus('error')
      })
  }, [])

  useEffect(() => {
    if (backendStatus === 'ok') {
      loadUsers()
    }
  }, [backendStatus, loadUsers])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const trimmedName = name.trim()
    if (!trimmedName) {
      return
    }

    setSubmitting(true)
    setUsersError(null)

    try {
      const user = await createUser(trimmedName)
      setUsers((current) => [...current, user])
      setName('')
    } catch {
      setUsersError('Could not create user')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="app">
      <header className="app-header">
        <h1>Users</h1>
        <p className={`backend-status backend-status--${backendStatus}`}>
          Backend:{' '}
          {backendStatus === 'loading'
            ? 'connecting...'
            : backendStatus === 'ok'
              ? 'connected'
              : 'unreachable'}
        </p>
      </header>

      <section className="users-panel">
        <form className="user-form" onSubmit={handleSubmit}>
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Enter name"
            disabled={backendStatus !== 'ok' || submitting}
          />
          <button
            type="submit"
            disabled={backendStatus !== 'ok' || submitting || !name.trim()}
          >
            {submitting ? 'Adding...' : 'Add user'}
          </button>
        </form>

        {usersError && <p className="users-error">{usersError}</p>}

        {usersLoading ? (
          <p className="users-message">Loading users...</p>
        ) : users.length === 0 ? (
          <p className="users-message">No users yet.</p>
        ) : (
          <ul className="users-list">
            {users.map((user) => (
              <li key={user.id}>
                <span className="user-id">#{user.id}</span>
                <span className="user-name">{user.name}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}

export default App
