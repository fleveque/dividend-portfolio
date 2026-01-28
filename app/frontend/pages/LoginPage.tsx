/**
 * LoginPage - Login form with React Router integration
 *
 * React Router Concepts Used:
 * ===========================
 *
 * useNavigate() - Programmatic navigation
 *   navigate('/') - go to home
 *   navigate('/radar', { replace: true }) - replace history entry
 *
 * useLocation() - Access current location and state
 *   location.state?.from - where user came from (set by ProtectedRoute)
 *
 * After successful login:
 *   1. Check if there's a "from" location in state
 *   2. Navigate there, or to home if not
 *   3. Use replace: true so back button doesn't return to login
 */

import { useState, type FormEvent } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

interface LocationState {
  from?: {
    pathname: string
  }
}

export function LoginPage() {
  const { login, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // Get the page user was trying to access (from ProtectedRoute)
  const from = (location.state as LocationState)?.from?.pathname || '/'

  // Form state
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // If already logged in, redirect to intended destination
  if (isAuthenticated) {
    navigate(from, { replace: true })
    return null
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      await login(email, password)
      // Navigate to the page they originally wanted, or home
      // replace: true so back button doesn't return to login
      navigate(from, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-6 text-center">Sign in</h2>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Redirect notice */}
        {from !== '/' && (
          <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded mb-4 text-sm">
            Please sign in to continue to {from}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
              autoComplete="username"
              placeholder="Enter your email address"
              disabled={isSubmitting}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            />
          </div>

          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="Enter your password"
              maxLength={72}
              disabled={isSubmitting}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>

        <div className="mt-4 text-center">
          <a
            href="/passwords/new"
            className="text-blue-500 hover:underline text-sm"
          >
            Forgot password?
          </a>
        </div>

        <div className="mt-6 pt-6 border-t text-center text-sm text-gray-500">
          <Link to="/" className="text-blue-500 hover:underline">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
