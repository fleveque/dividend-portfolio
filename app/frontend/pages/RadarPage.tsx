/**
 * RadarPage - User's stock radar/watchlist
 *
 * Features:
 * - React Query for all data operations
 * - Stock search with caching
 * - Theme-aware styling
 */

import { useState } from 'react'
import { RadarStockCard } from '../components/RadarStockCard'
import { RadarStockRow } from '../components/RadarStockRow'
import { ViewToggle } from '../components/ViewToggle'
import StockCard from '../components/StockCard'
import { useRadar, useAddStock, useRemoveStock } from '../hooks/useRadarQueries'
import { useStockSearch } from '../hooks/useStockQueries'
import { useViewPreference } from '../contexts/ViewPreferenceContext'
import type { Stock } from '../types'

export function RadarPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [submittedQuery, setSubmittedQuery] = useState('')
  const { viewMode } = useViewPreference()

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

  const addStock = useAddStock()
  const removeStock = useRemoveStock()

  const radarStocks = radarData?.stocks ?? []

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmittedQuery(searchQuery.trim())
  }

  const handleAddStock = (stock: Stock) => {
    addStock.mutate(stock.id, {
      onSuccess: () => {
        setSearchQuery('')
        setSubmittedQuery('')
      },
    })
  }

  const handleRemoveStock = (stockId: number) => {
    removeStock.mutate(stockId)
  }

  const isOnRadar = (stockId: number) => {
    return radarStocks.some((s) => s.id === stockId)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="section">
        <h1 className="text-3xl font-bold text-theme-primary mb-6 flex items-center gap-2">
          <span className="w-1 h-8 bg-brand rounded-full"></span>
          My Radar
        </h1>

        {/* Search Form */}
        <div className="mb-8">
          <form onSubmit={handleSearch} className="flex gap-3">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search stocks by symbol (e.g., AAPL)..."
              className="input-field flex-1"
            />
            <button
              type="submit"
              disabled={searchLoading}
              className="btn-primary"
            >
              {searchLoading ? 'Searching...' : 'Search'}
            </button>
          </form>
        </div>

        {/* Search Error */}
        {searchError && (
          <div className="alert alert-danger mb-4">
            {searchError instanceof Error ? searchError.message : 'Search failed'}
          </div>
        )}

        {/* Add Stock Error */}
        {addStock.error && (
          <div className="alert alert-danger mb-4">
            {addStock.error instanceof Error ? addStock.error.message : 'Failed to add stock'}
          </div>
        )}

        {/* Search Results */}
        {searchResults && searchResults.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-theme-primary mb-4">Search Results</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {searchResults.map((stock) => (
                <div key={stock.id} className="relative">
                  <StockCard stock={stock} />
                  <div className="mt-3">
                    {isOnRadar(stock.id) ? (
                      <span className="badge badge-success">
                        Already on your radar
                      </span>
                    ) : (
                      <button
                        onClick={() => handleAddStock(stock)}
                        disabled={addStock.isPending}
                        className="w-full btn-primary text-sm py-2"
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

        {/* No Results Found */}
        {submittedQuery && !searchLoading && searchResults && searchResults.length === 0 && (
          <div className="alert alert-warning mb-8">
            No stocks found for "{submittedQuery.toUpperCase()}". Please check the symbol and try again.
          </div>
        )}

        {/* Radar Stocks Section */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold text-theme-primary">
              Stocks on My Radar ({radarStocks.length})
            </h2>
            <div className="flex items-center gap-4">
              <ViewToggle />
              <button
                onClick={() => refetchRadar()}
                disabled={radarLoading}
                className="text-sm text-brand hover:underline disabled:opacity-50"
              >
                {radarLoading ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
          </div>

          {/* Radar Error */}
          {radarError && (
            <div className="alert alert-danger mb-4">
              {radarError instanceof Error ? radarError.message : 'Failed to load radar'}
            </div>
          )}

          {/* Remove Stock Error */}
          {removeStock.error && (
            <div className="alert alert-danger mb-4">
              {removeStock.error instanceof Error ? removeStock.error.message : 'Failed to remove stock'}
            </div>
          )}

          {/* Radar Loading */}
          {radarLoading && radarStocks.length === 0 && (
            <div className="text-center py-12">
              <div className="spinner spinner-lg text-brand mx-auto"></div>
              <p className="mt-3 text-theme-secondary">Loading your radar...</p>
            </div>
          )}

          {/* Empty State */}
          {!radarLoading && radarStocks.length === 0 && (
            <div className="text-center py-12 bg-theme-muted rounded-xl">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-theme-elevated flex items-center justify-center">
                <svg className="w-8 h-8 text-theme-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <p className="text-theme-secondary font-medium">Your radar is empty.</p>
              <p className="text-sm text-theme-muted mt-1">
                Search for stocks above to add them to your radar.
              </p>
            </div>
          )}

          {/* Stocks Grid/List */}
          {radarStocks.length > 0 && viewMode === 'card' && (
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

          {/* Compact List View */}
          {radarStocks.length > 0 && viewMode === 'compact' && (
            <div className="flex flex-col gap-2">
              {/* Header Row */}
              <div className="px-4 py-2 flex items-center gap-4 text-xs font-medium text-theme-muted uppercase tracking-wide border-b border-theme">
                <span className="w-8 shrink-0"></span>
                <span className="w-16 shrink-0">Symbol</span>
                <span className="flex-1 min-w-0">Name</span>
                <span className="w-24 text-right shrink-0">Price</span>
                <span className="w-28 shrink-0">Target</span>
                <span className="w-16 text-right shrink-0">Status</span>
                <span className="w-6 shrink-0"></span>
              </div>
              {radarStocks.map((stock) => (
                <RadarStockRow
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
