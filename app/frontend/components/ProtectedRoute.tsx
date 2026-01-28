/**
 * ProtectedRoute - Auth guard for protected routes
 *
 * React Router Concepts:
 * ======================
 *
 * <Outlet> - Renders child routes
 *   When you have nested routes, Outlet is where the child renders.
 *   Example: /radar renders inside the Layout's Outlet
 *
 * <Navigate> - Redirect component
 *   Declarative navigation - renders to redirect immediately.
 *   `replace` prop replaces history entry (back won't return here)
 *   `state` prop passes data to the destination (e.g., where user came from)
 *
 * useLocation() - Current location info
 *   Returns { pathname, search, hash, state, key }
 *   We use it to remember where the user wanted to go
 *
 * Usage:
 *   <Route element={<ProtectedRoute />}>
 *     <Route path="/radar" element={<RadarPage />} />
 *   </Route>
 *
 * If not authenticated:
 *   - Redirects to /login
 *   - Passes original location in state
 *   - LoginPage can redirect back after successful login
 */

import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  // Show loading while checking auth status
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking authentication...</p>
        </div>
      </div>
    )
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    // Pass the current location so we can redirect back after login
    // The `state` prop is available via useLocation() in LoginPage
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // User is authenticated - render the child route
  return <Outlet />
}

export default ProtectedRoute
