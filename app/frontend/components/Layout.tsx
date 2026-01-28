/**
 * Layout - Shared layout with React Router integration
 *
 * React Router Concepts:
 * ======================
 *
 * <Link> - Navigation without page reload
 *   Replaces <a> tags for internal navigation.
 *   <Link to="/radar">My Radar</Link>
 *
 * <NavLink> - Link with active state
 *   Like Link but knows if it's the current route.
 *   Useful for styling active nav items.
 *
 * <Outlet> - Where child routes render
 *   In a layout route, Outlet is where nested routes appear.
 *   Layout wraps all pages, Outlet shows the current page.
 *
 * useLocation() - Current URL info
 *   Returns { pathname, search, hash, state }
 *   We use pathname to highlight the active nav item.
 *
 * useNavigate() - Programmatic navigation
 *   const navigate = useNavigate()
 *   navigate('/login') - go to login
 *   navigate(-1) - go back
 */

import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export function Layout() {
  const { user, isAuthenticated, isLoading, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <header className="bg-blue-600 text-white shadow-lg">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center py-4">
            {/* Logo/Title - Link to home */}
            <Link
              to="/"
              className="text-2xl font-bold hover:text-blue-200 transition-colors"
            >
              Dividend Portfolio
            </Link>

            {/* Navigation */}
            <nav className="flex items-center gap-6">
              {/* Home - always visible */}
              <NavLink
                to="/"
                className={({ isActive }) =>
                  `hover:text-blue-200 transition-colors ${
                    isActive ? 'text-white font-semibold' : 'text-blue-100'
                  }`
                }
              >
                Home
              </NavLink>

              {/* My Radar - only when authenticated */}
              {isAuthenticated && (
                <NavLink
                  to="/radar"
                  className={({ isActive }) =>
                    `hover:text-blue-200 transition-colors ${
                      isActive ? 'text-white font-semibold' : 'text-blue-100'
                    }`
                  }
                >
                  My Radar
                </NavLink>
              )}

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
                      onClick={handleLogout}
                      className="px-3 py-1 bg-blue-500 hover:bg-blue-400 rounded text-sm transition-colors"
                    >
                      Logout
                    </button>
                  </div>
                ) : (
                  <Link
                    to="/login"
                    className="px-3 py-1 bg-blue-500 hover:bg-blue-400 rounded text-sm transition-colors"
                  >
                    Sign In
                  </Link>
                )}
              </div>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content - Outlet renders the current route's component */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-gray-400 py-6">
        <div className="container mx-auto px-4 text-center text-sm">
          <p>Dividend Portfolio - React Migration Demo</p>
          <p className="mt-1">
            Built with React, TypeScript, Vite, Tailwind CSS, and React Router
          </p>
        </div>
      </footer>
    </div>
  )
}

export default Layout
