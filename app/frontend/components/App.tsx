/**
 * App - Main application component
 *
 * Phase 6 Additions:
 * ==================
 *
 * 1. AuthProvider wraps the entire app to provide auth context
 * 2. AuthHeader uses useAuth() to show login/logout state
 * 3. RadarDemo tab shows the useInlineEdit hook in action
 *
 * Context Flow:
 *   <AuthProvider>           ← Provides auth state
 *     <AppContent>           ← Can use useAuth()
 *       <AuthHeader />       ← Uses useAuth() for user info
 *       <RadarDemo />        ← Uses useAuth() to check if logged in
 *     </AppContent>
 *   </AuthProvider>
 */

import { useState } from 'react'
import { AuthProvider, useAuth } from '../contexts/AuthContext'
import StockList from './StockList'
import StockSearch from './StockSearch'
import Counter from './Counter'
import RadarDemo from './RadarDemo'

// Tab type for switching between demos
type Tab = 'list' | 'search' | 'counter' | 'radar'

/**
 * AuthHeader - Displays auth state and login/logout controls.
 *
 * This component demonstrates useAuth() hook usage.
 * It can access the auth context because it's rendered
 * inside the AuthProvider.
 */
function AuthHeader() {
  const { user, isAuthenticated, isLoading, logout } = useAuth()

  if (isLoading) {
    return (
      <div className="text-blue-200 text-sm">
        Checking auth...
      </div>
    )
  }

  if (isAuthenticated && user) {
    return (
      <div className="flex items-center gap-4">
        <span className="text-blue-200 text-sm">
          Logged in as: {user.emailAddress}
        </span>
        <button
          onClick={logout}
          className="px-3 py-1 bg-blue-500 hover:bg-blue-400 rounded text-sm"
        >
          Logout
        </button>
      </div>
    )
  }

  return (
    <div className="text-blue-200 text-sm">
      Not logged in
      <span className="ml-2 text-blue-300">
        (Login via Rails at /session/new)
      </span>
    </div>
  )
}

/**
 * AppContent - The main app content.
 *
 * This is separated from App so it can use useAuth()
 * (needs to be inside AuthProvider).
 */
function AppContent() {
  // State for active tab
  const [activeTab, setActiveTab] = useState<Tab>('list')

  const tabs = [
    { id: 'list' as const, label: 'Stock List' },
    { id: 'search' as const, label: 'Search' },
    { id: 'counter' as const, label: 'Counter' },
    { id: 'radar' as const, label: 'Radar (Phase 6)' },
  ]

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header with Auth State */}
      <header className="bg-blue-600 text-white py-4 px-6 shadow-lg">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Dividend Portfolio</h1>
            <p className="text-blue-200 text-sm">
              React + TypeScript Demo (Phase 6: Context & Hooks)
            </p>
          </div>
          <AuthHeader />
        </div>
      </header>

      {/* Tab Navigation */}
      <nav className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex space-x-4">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto p-6">
        {activeTab === 'list' && <StockList />}
        {activeTab === 'search' && <StockSearch />}
        {activeTab === 'counter' && <Counter />}
        {activeTab === 'radar' && <RadarDemo />}
      </main>

      {/* Footer */}
      <footer className="max-w-4xl mx-auto px-6 py-8 text-sm text-gray-500">
        <h3 className="font-bold text-gray-700 mb-2">Phase 6 Concepts:</h3>
        <ul className="list-disc list-inside space-y-1">
          <li><strong>Context (useAuth)</strong> - Global auth state without prop drilling</li>
          <li><strong>Custom Hook (useInlineEdit)</strong> - Reusable editing logic</li>
          <li><strong>Provider Pattern</strong> - AuthProvider wraps app to provide context</li>
        </ul>
      </footer>
    </div>
  )
}

/**
 * App - Root component that sets up providers.
 *
 * The AuthProvider must wrap everything that needs access to auth state.
 * We can add more providers here as needed (e.g., ThemeProvider, QueryClientProvider).
 */
function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App
