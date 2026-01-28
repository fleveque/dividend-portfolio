/**
 * RadarPage - User's stock radar/watchlist
 *
 * Phase 10: React Query Integration
 * =================================
 *
 * This page now uses React Query for all data operations:
 * - useRadar(): Fetch radar stocks with caching
 * - useStockSearch(): Search with automatic caching per query
 * - useAddStock(): Mutation to add stocks
 * - useRemoveStock(): Mutation to remove stocks
 *
 * Benefits over manual fetch:
 * - Mutations automatically invalidate and refetch radar
 * - Search results are cached (search same term = instant)
 * - Less boilerplate, cleaner code
 *
 * Note: Authentication is handled by ProtectedRoute wrapper.
 */

import { useState } from 'react'
import { RadarStockCard } from '../components/RadarStockCard'
import StockCard from '../components/StockCard'
import { useRadar, useAddStock, useRemoveStock } from '../hooks/useRadarQueries'
import { useStockSearch } from '../hooks/useStockQueries'
import type { Stock } from '../types'

export function RadarPage() {
  // Search input state (React Query handles the actual search)
  const [searchQuery, setSearchQuery] = useState('')
  const [submittedQuery, setSubmittedQuery] = useState('')

  // React Query hooks
  const {
    data: radarData,
    isLoading: radarLoading,
    error: radarError,
    refetch: refetchRadar,
  } = useRadar()

  const {
    data: searchResults,
    isLoading: searchLoading,
    error: searchError,
  } = useStockSearch(submittedQuery)

  // Mutations
  const addStock = useAddStock()
  const removeStock = useRemoveStock()

  // Get radar stocks from query data
  const radarStocks = radarData?.stocks ?? []

  /**
   * Handle search form submission
   */
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmittedQuery(searchQuery.trim())
  }

  /**
   * Add a stock to the radar using mutation
   */
  const handleAddStock = (stock: Stock) => {
    addStock.mutate(stock.id, {
      onSuccess: () => {
        // Clear search after successful add
        setSearchQuery('')
        setSubmittedQuery('')
      },
    })
  }

  /**
   * Remove a stock from the radar using mutation
   */
  const handleRemoveStock = (stockId: number) => {
    removeStock.mutate(stockId)
  }

  // Check if a stock is already on the radar
  const isOnRadar = (stockId: number) => {
    return radarStocks.some((s) => s.id === stockId)
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
            {searchError instanceof Error ? searchError.message : 'Search failed'}
          </div>
        )}

        {/* Add Stock Error */}
        {addStock.error && (
          <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {addStock.error instanceof Error ? addStock.error.message : 'Failed to add stock'}
          </div>
        )}

        {/* Search Results */}
        {searchResults && searchResults.length > 0 && (
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
                        disabled={addStock.isPending}
                        className="w-full bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 disabled:bg-green-300 text-sm"
                      >
                        {addStock.isPending ? 'Adding...' : 'Add to Radar'}
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
              onClick={() => refetchRadar()}
              disabled={radarLoading}
              className="text-sm text-blue-500 hover:text-blue-700"
            >
              {radarLoading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>

          {/* Radar Error */}
          {radarError && (
            <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {radarError instanceof Error ? radarError.message : 'Failed to load radar'}
            </div>
          )}

          {/* Remove Stock Error */}
          {removeStock.error && (
            <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {removeStock.error instanceof Error ? removeStock.error.message : 'Failed to remove stock'}
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
                  isRemoving={removeStock.isPending}
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
