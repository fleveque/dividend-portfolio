/**
 * LoginPage - Login form with theme support
 *
 * Features:
 * - React Router integration
 * - Theme-aware styling
 * - Redirect after login
 */

import { useState, type FormEvent } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Logo } from '../components/Logo'

interface LocationState {
  from?: {
    pathname: string
  }
}

export function LoginPage() {
  const { login, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const from = (location.state as LocationState)?.from?.pathname || '/'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
      navigate(from, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-md mx-auto">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Logo size="lg" showText={false} />
          </div>
          <h1 className="text-2xl font-bold text-theme-primary">
            Sign in to Dividend Portfolio
          </h1>
        </div>

        {/* Login Card */}
        <div className="card">
          {/* Error Alert */}
          {error && (
            <div className="alert alert-danger mb-4">
              {error}
            </div>
          )}

          {/* Redirect notice */}
          {from !== '/' && (
            <div className="alert alert-info mb-4 text-sm">
              Please sign in to continue to {from}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-theme-secondary mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                autoComplete="username"
                placeholder="Enter your email address"
                disabled={isSubmitting}
                className="input-field"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-theme-secondary mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="Enter your password"
                maxLength={72}
                disabled={isSubmitting}
                className="input-field"
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary w-full"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="spinner spinner-sm"></span>
                    Signing in...
                  </span>
                ) : (
                  'Sign in'
                )}
              </button>
            </div>
          </form>

          <div className="mt-4 text-center">
            <a
              href="/passwords/new"
              className="text-sm text-brand hover:underline"
            >
              Forgot password?
            </a>
          </div>

          <div className="mt-6 pt-6 border-t border-theme text-center">
            <Link to="/" className="text-sm text-brand hover:underline">
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
