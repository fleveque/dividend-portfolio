/**
 * App - Main application component
 *
 * Component Composition:
 * ======================
 *
 * React apps are built by composing smaller components into larger ones.
 * This App component is the "root" that renders all other components.
 *
 * In Phase 9, we'll add React Router here for navigation.
 * For now, it's a simple demo of our Phase 1-3 components.
 */

import { useState } from 'react'
import StockList from './StockList'
import StockSearch from './StockSearch'
import Counter from './Counter'

// Tab type for switching between demos
type Tab = 'list' | 'search' | 'counter'

function App() {
  // State for active tab
  const [activeTab, setActiveTab] = useState<Tab>('list')

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-blue-600 text-white py-4 px-6 shadow-lg">
        <h1 className="text-2xl font-bold">Dividend Portfolio</h1>
        <p className="text-blue-200 text-sm">React + TypeScript Demo (Phase 3)</p>
      </header>

      {/* Tab Navigation */}
      <nav className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex space-x-4">
            {([
              { id: 'list', label: 'Stock List (useEffect)' },
              { id: 'search', label: 'Search (Forms)' },
              { id: 'counter', label: 'Counter (useState)' },
            ] as const).map((tab) => (
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
        {/*
          Conditional rendering with &&:
          - If left side is true, render right side
          - If left side is false, render nothing
        */}
        {activeTab === 'list' && <StockList />}
        {activeTab === 'search' && <StockSearch />}
        {activeTab === 'counter' && <Counter />}
      </main>

      {/* Footer with learning notes */}
      <footer className="max-w-4xl mx-auto px-6 py-8 text-sm text-gray-500">
        <h3 className="font-bold text-gray-700 mb-2">Phase 3 Concepts Demonstrated:</h3>
        <ul className="list-disc list-inside space-y-1">
          <li><strong>useState</strong> - Counter (increment/decrement), Search (form input)</li>
          <li><strong>useEffect</strong> - StockList (data fetching on mount)</li>
          <li><strong>Loading states</strong> - Spinner while fetching data</li>
          <li><strong>Error handling</strong> - Display error messages gracefully</li>
          <li><strong>Controlled inputs</strong> - Search form tracks input value in state</li>
          <li><strong>Conditional rendering</strong> - Show different UI based on state</li>
          <li><strong>List rendering</strong> - Map over array to create elements</li>
        </ul>
      </footer>
    </div>
  )
}

export default App
