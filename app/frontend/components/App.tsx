/**
 * App - Main application component with React Router
 *
 * Phase 9: React Router Integration
 * =================================
 *
 * React Router Concepts Used:
 *
 * BrowserRouter - Enables client-side routing using HTML5 history API
 *   Wraps the entire app to provide routing context.
 *
 * Routes/Route - Define which component renders at which URL
 *   <Route path="/" element={<HomePage />} />
 *
 * Nested Routes - Routes can be nested for layouts
 *   Layout route contains Outlet where child routes render.
 *
 * Protected Routes - Auth guard pattern
 *   ProtectedRoute checks auth and redirects to login if needed.
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from '../contexts/AuthContext'
import Layout from './Layout'
import ProtectedRoute from './ProtectedRoute'
import HomePage from '../pages/HomePage'
import LoginPage from '../pages/LoginPage'
import RadarPage from '../pages/RadarPage'

/**
 * App - Root component that sets up providers and routing.
 *
 * The AuthProvider must wrap everything that needs access to auth state.
 * BrowserRouter enables client-side navigation without page reloads.
 */
function App() {
  return (
    <AuthProvider>
      {/* basename="/react" - React app is served from /react/* */}
      <BrowserRouter basename="/react">
        <Routes>
          {/* Layout wraps all pages with header/footer */}
          <Route element={<Layout />}>
            {/* Public routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />

            {/* Protected routes - require authentication */}
            <Route element={<ProtectedRoute />}>
              <Route path="/radar" element={<RadarPage />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
