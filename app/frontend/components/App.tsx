/**
 * App - Main application component with React Router and React Query
 *
 * Phase 9: React Router Integration
 * Phase 10: React Query Integration
 * =================================
 *
 * Provider Hierarchy:
 * 1. QueryClientProvider - React Query for data fetching/caching
 * 2. AuthProvider - Authentication state
 * 3. BrowserRouter - Client-side routing
 *
 * React Query Benefits:
 * - Automatic caching and background refetching
 * - Deduplication of requests
 * - Built-in loading/error states
 * - Optimistic updates support
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from '../contexts/AuthContext'
import Layout from './Layout'
import ProtectedRoute from './ProtectedRoute'
import HomePage from '../pages/HomePage'
import LoginPage from '../pages/LoginPage'
import RadarPage from '../pages/RadarPage'

/**
 * QueryClient Configuration
 *
 * staleTime: How long data is considered "fresh" (won't refetch)
 * retry: Number of retry attempts on failure
 *
 * These are sensible defaults - individual queries can override.
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false, // Don't refetch when tab regains focus
    },
  },
})

/**
 * App - Root component that sets up providers and routing.
 *
 * Provider order matters:
 * - QueryClientProvider must wrap anything using useQuery/useMutation
 * - AuthProvider must wrap anything using useAuth
 * - BrowserRouter must wrap anything using routing hooks
 */
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {/* React app is served from root "/" */}
        <BrowserRouter>
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
    </QueryClientProvider>
  )
}

export default App
