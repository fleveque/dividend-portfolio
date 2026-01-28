/**
 * StockSearch - Demonstrates useState with form inputs
 *
 * Controlled Components:
 * ======================
 *
 * In React, form inputs can be "controlled" or "uncontrolled":
 *
 * Uncontrolled (DOM manages value):
 *   <input defaultValue="hello" />
 *   - Value lives in the DOM
 *   - Use ref to read value when needed
 *
 * Controlled (React manages value):
 *   <input value={text} onChange={(e) => setText(e.target.value)} />
 *   - Value lives in React state
 *   - Every keystroke updates state
 *   - React re-renders with new value
 *
 * Controlled is preferred because:
 * - Single source of truth (React state)
 * - Easy to validate, transform, or reset
 * - Can derive other state from input value
 */

import { useState } from 'react'
import { Stock } from '../types'
import StockCard from './StockCard'

// Mock search function - will be replaced with real API in Phase 5
async function searchStock(query: string): Promise<Stock | null> {
  await new Promise(resolve => setTimeout(resolve, 500))

  const stocks: Record<string, Stock> = {
    'AAPL': { id: 1, symbol: 'AAPL', name: 'Apple Inc.', price: 178.50, formattedPrice: '$178.50' },
    'GOOGL': { id: 2, symbol: 'GOOGL', name: 'Alphabet Inc.', price: 141.80, formattedPrice: '$141.80' },
    'MSFT': { id: 3, symbol: 'MSFT', name: 'Microsoft Corporation', price: 378.91, formattedPrice: '$378.91' },
  }

  return stocks[query.toUpperCase()] || null
}

function StockSearch() {
  // Input value state
  const [query, setQuery] = useState('')

  // Search results state
  const [result, setResult] = useState<Stock | null>(null)

  // Loading state for search button
  const [searching, setSearching] = useState(false)

  // Error/message state
  const [message, setMessage] = useState<string | null>(null)

  // Handle form submission
  async function handleSubmit(event: React.FormEvent) {
    // Prevent default form submission (page reload)
    event.preventDefault()

    if (!query.trim()) {
      setMessage('Please enter a stock symbol')
      return
    }

    setSearching(true)
    setMessage(null)
    setResult(null)

    try {
      const stock = await searchStock(query)
      if (stock) {
        setResult(stock)
      } else {
        setMessage(`Stock "${query.toUpperCase()}" not found. Try AAPL, GOOGL, or MSFT.`)
      }
    } catch {
      setMessage('Search failed. Please try again.')
    } finally {
      setSearching(false)
    }
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-bold mb-4">Stock Search</h3>

      {/*
        Form with onSubmit:
        - Handles both Enter key and button click
        - event.preventDefault() stops page reload
      */}
      <form onSubmit={handleSubmit} className="mb-4">
        <div className="flex gap-2">
          {/*
            Controlled input:
            - value={query} - React controls what's displayed
            - onChange updates state on every keystroke
            - e.target.value is the new input value
          */}
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter stock symbol (e.g., AAPL)"
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={searching}
          />

          <button
            type="submit"
            disabled={searching}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed"
          >
            {searching ? 'Searching...' : 'Search'}
          </button>
        </div>
      </form>

      {/* Show message if any */}
      {message && (
        <div className="mb-4 p-3 bg-yellow-100 text-yellow-800 rounded">
          {message}
        </div>
      )}

      {/* Show result if found */}
      {result && (
        <div>
          <p className="text-sm text-gray-600 mb-2">Found:</p>
          <StockCard stock={result} />
        </div>
      )}

      {/* Demo: Show current input value (for learning) */}
      <div className="mt-4 pt-4 border-t text-sm text-gray-500">
        <p>Current query state: "{query}"</p>
        <p>Query length: {query.length}</p>
        <p>Uppercase: {query.toUpperCase()}</p>
      </div>
    </div>
  )
}

export default StockSearch
