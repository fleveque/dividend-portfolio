/**
 * RadarDemo - Demonstrates Context and Custom Hooks
 *
 * This component:
 * 1. Uses useAuth() to check if user is logged in
 * 2. Fetches user's radar stocks from the API
 * 3. Renders RadarStockCard which uses useInlineEdit
 */

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { radarApi } from '../lib/api'
import { RadarStockCard } from './RadarStockCard'
import type { RadarStock } from '../types'

export function RadarDemo() {
  const { isAuthenticated, isLoading: authLoading } = useAuth()

  // State for radar data
  const [stocks, setStocks] = useState<RadarStock[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Fetch radar stocks from API.
   * Wrapped in useCallback so it can be called from useEffect
   * and passed to child components for refresh.
   */
  const fetchRadar = useCallback(async () => {
    if (!isAuthenticated) return

    setLoading(true)
    setError(null)

    try {
      const data = await radarApi.get()
      setStocks(data.stocks)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load radar')
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated])

  /**
   * Handle removing a stock from radar.
   */
  const handleRemove = useCallback(async (stockId: number) => {
    try {
      await radarApi.removeStock(stockId)
      // Refresh the list
      fetchRadar()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove stock')
    }
  }, [fetchRadar])

  // Fetch radar when auth state changes
  useEffect(() => {
    if (isAuthenticated) {
      fetchRadar()
    }
  }, [isAuthenticated, fetchRadar])

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-2 text-gray-600">Checking authentication...</p>
      </div>
    )
  }

  // Show login prompt if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
        <h3 className="text-lg font-semibold text-yellow-800 mb-2">
          Authentication Required
        </h3>
        <p className="text-yellow-700 mb-4">
          You need to be logged in to view your radar.
        </p>
        <p className="text-sm text-yellow-600">
          Login via Rails at{' '}
          <a href="/session/new" className="underline hover:text-yellow-800">
            /session/new
          </a>{' '}
          then return here.
        </p>

        {/* Phase 6 explanation */}
        <div className="mt-6 pt-6 border-t border-yellow-200 text-left">
          <h4 className="font-semibold text-yellow-800 mb-2">
            Phase 6: How this works
          </h4>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>
              <strong>AuthContext</strong> provides auth state to all components
            </li>
            <li>
              <strong>useAuth()</strong> hook gives access to user, isAuthenticated, etc.
            </li>
            <li>
              This component reads <code>isAuthenticated</code> to decide what to show
            </li>
          </ul>
        </div>
      </div>
    )
  }

  // Show loading while fetching radar
  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading your radar...</p>
      </div>
    )
  }

  // Show error if fetch failed
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-red-800 mb-2">Error</h3>
        <p className="text-red-700">{error}</p>
        <button
          onClick={fetchRadar}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Try Again
        </button>
      </div>
    )
  }

  // Show empty state if no stocks
  if (stocks.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          Your Radar is Empty
        </h3>
        <p className="text-gray-600 mb-4">
          Add stocks to your radar via the Rails app at{' '}
          <a href="/radar" className="underline hover:text-blue-600">
            /radar
          </a>
        </p>
      </div>
    )
  }

  // Show radar stocks
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Your Radar ({stocks.length} stocks)</h2>
        <button
          onClick={fetchRadar}
          className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
        >
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {stocks.map((stock) => (
          <RadarStockCard
            key={stock.id}
            stock={stock}
            onRemove={() => handleRemove(stock.id)}
          />
        ))}
      </div>

      {/* Phase 6 explanation */}
      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="font-semibold text-blue-800 mb-2">
          Phase 6: Try the inline editing
        </h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>Click on any <strong>Target</strong> price to edit it</li>
          <li>Press <strong>Enter</strong> to save or <strong>Escape</strong> to cancel</li>
          <li>The <strong>useInlineEdit</strong> hook handles all the state and keyboard events</li>
          <li>Changes are saved to the Rails API in real-time</li>
        </ul>
      </div>
    </div>
  )
}

export default RadarDemo
