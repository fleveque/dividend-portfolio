/**
 * RadarPage - React version of radars/show.html.erb
 *
 * This page provides:
 * - Stock search functionality
 * - Search results with "Add to Radar" button
 * - List of stocks on user's radar with inline editing
 *
 * Uses AuthContext for auth state and RadarStockCard for display.
 */

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { stocksApi, radarApi } from '../lib/api'
import { RadarStockCard } from '../components/RadarStockCard'
import StockCard from '../components/StockCard'
import type { Stock, RadarStock } from '../types'

export function RadarPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth()

  // Radar stocks state
  const [radarStocks, setRadarStocks] = useState<RadarStock[]>([])
  const [radarLoading, setRadarLoading] = useState(false)
  const [radarError, setRadarError] = useState<string | null>(null)

  // Search state
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Stock[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)

  // Adding stock state
  const [addingStockId, setAddingStockId] = useState<number | null>(null)

  /**
   * Fetch radar stocks from API
   */
  const fetchRadar = useCallback(async () => {
    if (!isAuthenticated) return

    setRadarLoading(true)
    setRadarError(null)

    try {
      const data = await radarApi.get()
      setRadarStocks(data.stocks)
    } catch (err) {
      setRadarError(err instanceof Error ? err.message : 'Failed to load radar')
    } finally {
      setRadarLoading(false)
    }
  }, [isAuthenticated])

  /**
   * Search for stocks
   */
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }

    setSearchLoading(true)
    setSearchError(null)

    try {
      const results = await stocksApi.search(searchQuery)
      setSearchResults(results)
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : 'Search failed')
    } finally {
      setSearchLoading(false)
    }
  }

  /**
   * Add a stock to the radar
   */
  const handleAddStock = async (stock: Stock) => {
    setAddingStockId(stock.id)

    try {
      await radarApi.addStock(stock.id)
      // Refresh radar and clear search
      await fetchRadar()
      setSearchResults([])
      setSearchQuery('')
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : 'Failed to add stock')
    } finally {
      setAddingStockId(null)
    }
  }

  /**
   * Remove a stock from the radar
   */
  const handleRemoveStock = async (stockId: number) => {
    try {
      await radarApi.removeStock(stockId)
      await fetchRadar()
    } catch (err) {
      setRadarError(err instanceof Error ? err.message : 'Failed to remove stock')
    }
  }

  // Fetch radar on mount and when auth changes
  useEffect(() => {
    if (isAuthenticated) {
      fetchRadar()
    }
  }, [isAuthenticated, fetchRadar])

  // Check if a stock is already on the radar
  const isOnRadar = (stockId: number) => {
    return radarStocks.some((s) => s.id === stockId)
  }

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Show login prompt if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center max-w-md mx-auto">
          <h2 className="text-xl font-semibold text-yellow-800 mb-2">
            Sign In Required
          </h2>
          <p className="text-yellow-700 mb-4">
            Please sign in to view your radar.
          </p>
          <a
            href="/session/new"
            className="inline-block bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600"
          >
            Sign In
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-3xl font-bold mb-6">My Radar</h1>

        {/* Search Form */}
        <div className="mb-8">
          <form onSubmit={handleSearch} className="flex gap-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search stocks by symbol (e.g., AAPL)..."
              className="flex-1 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={searchLoading}
              className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors disabled:bg-blue-300"
            >
              {searchLoading ? 'Searching...' : 'Search'}
            </button>
          </form>
        </div>

        {/* Search Error */}
        {searchError && (
          <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {searchError}
          </div>
        )}

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Search Results</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {searchResults.map((stock) => (
                <div key={stock.id} className="relative">
                  <StockCard stock={stock} />
                  <div className="mt-2">
                    {isOnRadar(stock.id) ? (
                      <span className="text-green-600 text-sm">
                        Already on your radar
                      </span>
                    ) : (
                      <button
                        onClick={() => handleAddStock(stock)}
                        disabled={addingStockId === stock.id}
                        className="w-full bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 disabled:bg-green-300 text-sm"
                      >
                        {addingStockId === stock.id ? 'Adding...' : 'Add to Radar'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Radar Stocks */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold">
              Stocks on My Radar ({radarStocks.length})
            </h2>
            <button
              onClick={fetchRadar}
              disabled={radarLoading}
              className="text-sm text-blue-500 hover:text-blue-700"
            >
              {radarLoading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>

          {/* Radar Error */}
          {radarError && (
            <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {radarError}
            </div>
          )}

          {/* Radar Loading */}
          {radarLoading && radarStocks.length === 0 && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading your radar...</p>
            </div>
          )}

          {/* Empty State */}
          {!radarLoading && radarStocks.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>Your radar is empty.</p>
              <p className="text-sm mt-2">
                Search for stocks above to add them to your radar.
              </p>
            </div>
          )}

          {/* Stocks Grid */}
          {radarStocks.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {radarStocks.map((stock) => (
                <RadarStockCard
                  key={stock.id}
                  stock={stock}
                  onRemove={() => handleRemoveStock(stock.id)}
                  onUpdate={fetchRadar}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default RadarPage
