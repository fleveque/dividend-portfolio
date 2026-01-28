/**
 * App - Main application component
 *
 * Phase 7-8: Full Page Migration
 * ==============================
 *
 * This component now serves as a simple router, rendering different pages
 * based on state. In Phase 9, we'll replace this with React Router for
 * proper URL-based navigation.
 *
 * Current navigation:
 * - State-based (currentPage)
 * - No URL changes
 * - Browser back/forward doesn't work
 *
 * After Phase 9 (React Router):
 * - URL-based routing
 * - Browser history works
 * - Shareable URLs
 */

import { useState, useEffect } from 'react'
import { AuthProvider, useAuth } from '../contexts/AuthContext'
import Layout from './Layout'
import HomePage from '../pages/HomePage'
import LoginPage from '../pages/LoginPage'
import RadarPage from '../pages/RadarPage'

// Page type for simple routing
type Page = 'home' | 'login' | 'radar'

/**
 * AppContent - The main app with routing logic.
 *
 * Separated from App so it can use useAuth()
 * (needs to be inside AuthProvider).
 */
function AppContent() {
  const { isAuthenticated } = useAuth()

  // Simple state-based routing (will be replaced by React Router in Phase 9)
  const [currentPage, setCurrentPage] = useState<Page>('home')

  // Redirect to home after login
  const handleLoginSuccess = () => {
    setCurrentPage('home')
  }

  // Navigate to a page
  const handleNavigate = (page: string) => {
    setCurrentPage(page as Page)
  }

  // Redirect from radar to login if not authenticated
  useEffect(() => {
    if (currentPage === 'radar' && !isAuthenticated) {
      // In Phase 9 with React Router, we'll use proper redirect with "from" state
      // For now, just show the page (it handles auth internally)
    }
  }, [currentPage, isAuthenticated])

  // Render the current page
  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage />
      case 'login':
        return <LoginPage onLoginSuccess={handleLoginSuccess} />
      case 'radar':
        return <RadarPage />
      default:
        return <HomePage />
    }
  }

  return (
    <Layout currentPage={currentPage} onNavigate={handleNavigate}>
      {renderPage()}
    </Layout>
  )
}

/**
 * App - Root component that sets up providers.
 *
 * The AuthProvider must wrap everything that needs access to auth state.
 */
function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App
