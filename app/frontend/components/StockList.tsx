/**
 * StockList - Demonstrates useEffect for data fetching
 *
 * useEffect Hook Explained:
 * =========================
 *
 * useEffect(() => {
 *   // Effect code - runs AFTER render
 *   return () => {
 *     // Cleanup code - runs before next effect or unmount
 *   }
 * }, [dependencies])
 *
 * The dependency array controls WHEN the effect runs:
 * - [] = Run once when component mounts
 * - [value] = Run when 'value' changes
 * - [a, b] = Run when 'a' OR 'b' changes
 * - (no array) = Run after EVERY render (rarely wanted)
 *
 * Common Patterns:
 * 1. Data fetching on mount: useEffect(() => { fetch(...) }, [])
 * 2. Sync with prop: useEffect(() => { ... }, [propValue])
 * 3. Cleanup subscriptions: useEffect(() => { subscribe(); return unsubscribe }, [])
 */

import { useState, useEffect } from 'react'
import { Stock } from '../types'
import StockCard from './StockCard'

/**
 * Simulated API fetch
 *
 * In Phase 5, we'll replace this with a real API call.
 * For now, this demonstrates the loading/error/success pattern.
 */
async function fetchStocks(): Promise<Stock[]> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000))

  // Simulate occasional errors (10% chance)
  if (Math.random() < 0.1) {
    throw new Error('Failed to fetch stocks')
  }

  // Return mock data
  return [
    { id: 1, symbol: 'AAPL', name: 'Apple Inc.', price: 178.50, formattedPrice: '$178.50' },
    { id: 2, symbol: 'GOOGL', name: 'Alphabet Inc.', price: 141.80, formattedPrice: '$141.80' },
    { id: 3, symbol: 'MSFT', name: 'Microsoft Corporation', price: 378.91, formattedPrice: '$378.91' },
    { id: 4, symbol: 'AMZN', name: 'Amazon.com Inc.', price: 178.25, formattedPrice: '$178.25' },
    { id: 5, symbol: 'NVDA', name: 'NVIDIA Corporation', price: 721.33, formattedPrice: '$721.33' },
  ]
}

function StockList() {
  // State for the fetched data
  // useState<Stock[]>([]) - explicitly type the state as Stock array
  const [stocks, setStocks] = useState<Stock[]>([])

  // State for loading indicator
  const [loading, setLoading] = useState(true)

  // State for error message
  const [error, setError] = useState<string | null>(null)

  // useEffect for data fetching
  useEffect(() => {
    // Define async function inside useEffect
    // (useEffect callback itself can't be async)
    async function loadStocks() {
      try {
        setLoading(true)
        setError(null)

        const data = await fetchStocks()
        setStocks(data)
      } catch (err) {
        // Type guard: err could be anything
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    loadStocks()
  }, []) // Empty array = run once on mount

  // Conditional rendering based on state
  // This pattern is very common: loading -> error -> success
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-600">Loading stocks...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        <strong>Error:</strong> {error}
        <button
          onClick={() => window.location.reload()}
          className="ml-4 underline hover:no-underline"
        >
          Retry
        </button>
      </div>
    )
  }

  if (stocks.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        No stocks found.
      </div>
    )
  }

  // Success state - render the list
  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Stock List ({stocks.length} stocks)</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/*
          Rendering lists in React:
          - Use .map() to transform data into elements
          - Each element needs a unique 'key' prop
          - key helps React track which items changed
        */}
        {stocks.map((stock) => (
          <StockCard key={stock.id} stock={stock} />
        ))}
      </div>
    </div>
  )
}

export default StockList
