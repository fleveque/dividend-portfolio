/**
 * App - Main application component with React Router and React Query
 *
 * Provider Hierarchy:
 * 1. ThemeProvider - Dark/light theme management
 * 2. ViewPreferenceProvider - Radar view mode (card/compact)
 * 3. QueryClientProvider - React Query for data fetching/caching
 * 4. AuthProvider - Authentication state
 * 5. BuyPlanProvider - Buy plan mode state
 * 6. BrowserRouter - Client-side routing
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from '../contexts/ThemeContext'
import { ViewPreferenceProvider } from '../contexts/ViewPreferenceContext'
import { AuthProvider } from '../contexts/AuthContext'
import { BuyPlanProvider } from '../contexts/BuyPlanContext'
import Layout from './Layout'
import ProtectedRoute from './ProtectedRoute'
import AdminRoute from './AdminRoute'
import HomePage from '../pages/HomePage'
import LoginPage from '../pages/LoginPage'
import SignUpPage from '../pages/SignUpPage'
import RadarPage from '../pages/RadarPage'
import AdminDashboardPage from '../pages/AdminDashboardPage'

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
 * - ThemeProvider must be outermost for theme to apply everywhere
 * - QueryClientProvider must wrap anything using useQuery/useMutation
 * - AuthProvider must wrap anything using useAuth
 * - BrowserRouter must wrap anything using routing hooks
 */
function App() {
  return (
    <ThemeProvider>
      <ViewPreferenceProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <BuyPlanProvider>
              <BrowserRouter>
                <Routes>
                  <Route element={<Layout />}>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/signup" element={<SignUpPage />} />
                    <Route element={<ProtectedRoute />}>
                      <Route path="/radar" element={<RadarPage />} />
                    </Route>
                    <Route element={<AdminRoute />}>
                      <Route path="/admin" element={<AdminDashboardPage />} />
                    </Route>
                  </Route>
                </Routes>
              </BrowserRouter>
            </BuyPlanProvider>
          </AuthProvider>
        </QueryClientProvider>
      </ViewPreferenceProvider>
    </ThemeProvider>
  )
}

export default App
