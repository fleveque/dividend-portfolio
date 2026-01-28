/**
 * LoginPage - React version of sessions/new.html.erb
 *
 * This page provides:
 * - Email/password login form
 * - Error display
 * - Redirect after successful login
 *
 * Uses AuthContext for login action.
 */

import { useState, type FormEvent } from 'react'
import { useAuth } from '../contexts/AuthContext'

interface LoginPageProps {
  // Optional callback after successful login
  onLoginSuccess?: () => void
  // Optional URL to redirect to (for display purposes)
  redirectTo?: string
}

export function LoginPage({ onLoginSuccess, redirectTo }: LoginPageProps) {
  const { login, isAuthenticated } = useAuth()

  // Form state
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // If already logged in, show a message
  if (isAuthenticated) {
    return (
      <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md text-center">
        <h2 className="text-2xl font-bold mb-4 text-green-600">
          Already Logged In
        </h2>
        <p className="text-gray-600 mb-4">
          You are already signed in.
        </p>
        <a
          href="/"
          className="inline-block bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600"
        >
          Go to Home
        </a>
      </div>
    )
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      await login(email, password)
      // Call success callback if provided
      onLoginSuccess?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">Sign in</h2>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Redirect notice */}
      {redirectTo && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded mb-4 text-sm">
          Please sign in to continue to {redirectTo}
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
    </div>
  )
}

export default LoginPage
