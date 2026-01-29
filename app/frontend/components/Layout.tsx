/**
 * Layout - Shared layout with header, footer, and theme support
 *
 * Features:
 * - Sticky header with logo and navigation
 * - Theme toggle for dark/light modes
 * - Emerald green color scheme
 * - Responsive navigation
 */

import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Logo } from './Logo'
import { ThemeToggle } from './ThemeToggle'

export function Layout() {
  const { user, isAuthenticated, isLoading, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-theme-surface flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-theme-elevated border-b border-theme shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center py-3">
            {/* Logo */}
            <Link to="/" className="hover:opacity-80 transition-opacity">
              <Logo size="md" showText={true} />
            </Link>

            {/* Navigation */}
            <nav className="flex items-center gap-2 sm:gap-4">
              {/* Nav Links */}
              <NavLink
                to="/"
                className={({ isActive }) =>
                  `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary-100 dark:bg-primary-900 text-brand'
                      : 'text-theme-secondary hover:text-brand hover:bg-theme-muted'
                  }`
                }
              >
                Home
              </NavLink>

              {isAuthenticated && (
                <NavLink
                  to="/radar"
                  className={({ isActive }) =>
                    `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-primary-100 dark:bg-primary-900 text-brand'
                        : 'text-theme-secondary hover:text-brand hover:bg-theme-muted'
                    }`
                  }
                >
                  My Radar
                </NavLink>
              )}

              {/* Divider */}
              <div className="h-6 w-px bg-theme-muted mx-1 hidden sm:block" />

              {/* Theme Toggle */}
              <ThemeToggle />

              {/* Auth Section */}
              <div className="flex items-center gap-2 ml-1">
                {isLoading ? (
                  <span className="text-theme-muted text-sm">Loading...</span>
                ) : isAuthenticated && user ? (
                  <div className="flex items-center gap-2">
                    <span className="text-theme-secondary text-sm hidden md:inline truncate max-w-48">
                      {user.emailAddress}
                    </span>
                    <button
                      onClick={handleLogout}
                      className="px-3 py-1.5 rounded-lg text-sm font-medium
                                 bg-theme-muted hover:bg-red-100 dark:hover:bg-red-900
                                 text-theme-secondary hover:text-red-600 dark:hover:text-red-400
                                 transition-colors cursor-pointer"
                    >
                      Logout
                    </button>
                  </div>
                ) : (
                  <Link
                    to="/login"
                    className="btn-primary text-sm px-4 py-1.5"
                  >
                    Sign In
                  </Link>
                )}
              </div>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-theme-elevated border-t border-theme py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            {/* Logo in footer */}
            <Logo size="sm" showText={true} />

            {/* Footer text */}
            <div className="text-theme-muted text-sm text-center">
              <p>Built with Ruby on Rails, React, TypeScript, and Tailwind CSS</p>
              <p className="mt-1">
                &copy; {new Date().getFullYear()}{' '}
                <a
                  href="https://github.com/fleveque"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand hover:underline"
                >
                  Francesc Leveque
                </a>
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Layout
