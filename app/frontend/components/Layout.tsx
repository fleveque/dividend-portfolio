/**
 * Layout - Shared layout wrapper for all pages
 *
 * Provides:
 * - Header with navigation and auth state
 * - Main content area
 * - Footer
 *
 * In Phase 9, this will work with React Router's <Outlet>.
 * For now, it takes children as props.
 */

import { type ReactNode } from 'react'
import { useAuth } from '../contexts/AuthContext'

interface LayoutProps {
  children: ReactNode
  currentPage?: string
  onNavigate?: (page: string) => void
}

export function Layout({ children, currentPage, onNavigate }: LayoutProps) {
  const { user, isAuthenticated, isLoading, logout } = useAuth()

  const navItems = [
    { id: 'home', label: 'Home', requiresAuth: false },
    { id: 'radar', label: 'My Radar', requiresAuth: true },
  ]

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <header className="bg-blue-600 text-white shadow-lg">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center py-4">
            {/* Logo/Title */}
            <button
              onClick={() => onNavigate?.('home')}
              className="text-2xl font-bold hover:text-blue-200 transition-colors"
            >
              Dividend Portfolio
            </button>

            {/* Navigation */}
            <nav className="flex items-center gap-6">
              {navItems.map((item) => {
                // Hide auth-required items if not logged in
                if (item.requiresAuth && !isAuthenticated) return null

                return (
                  <button
                    key={item.id}
                    onClick={() => onNavigate?.(item.id)}
                    className={`hover:text-blue-200 transition-colors ${
                      currentPage === item.id
                        ? 'text-white font-semibold'
                        : 'text-blue-100'
                    }`}
                  >
                    {item.label}
                  </button>
                )
              })}

              {/* Auth Section */}
              <div className="ml-4 pl-4 border-l border-blue-500">
                {isLoading ? (
                  <span className="text-blue-200 text-sm">Loading...</span>
                ) : isAuthenticated && user ? (
                  <div className="flex items-center gap-3">
                    <span className="text-blue-200 text-sm hidden md:inline">
                      {user.emailAddress}
                    </span>
                    <button
                      onClick={logout}
                      className="px-3 py-1 bg-blue-500 hover:bg-blue-400 rounded text-sm transition-colors"
                    >
                      Logout
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => onNavigate?.('login')}
                    className="px-3 py-1 bg-blue-500 hover:bg-blue-400 rounded text-sm transition-colors"
                  >
                    Sign In
                  </button>
                )}
              </div>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-gray-400 py-6">
        <div className="container mx-auto px-4 text-center text-sm">
          <p>Dividend Portfolio - React Migration Demo</p>
          <p className="mt-1">
            Built with React, TypeScript, Vite, and Tailwind CSS
          </p>
        </div>
      </footer>
    </div>
  )
}

export default Layout
