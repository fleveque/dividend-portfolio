/**
 * HomePage - React version of home/index.html.erb
 *
 * This page displays:
 * - Last 10 added stocks
 * - Top 10 most added stocks to radars
 *
 * It fetches data from the API and uses StockCard for display.
 */

import { useState, useEffect } from 'react'
import { stocksApi } from '../lib/api'
import StockCard from '../components/StockCard'
import type { Stock } from '../types'

export function HomePage() {
  // State for last added stocks
  const [lastAdded, setLastAdded] = useState<Stock[]>([])
  const [lastAddedLoading, setLastAddedLoading] = useState(true)
  const [lastAddedError, setLastAddedError] = useState<string | null>(null)

  // State for most added stocks
  const [mostAdded, setMostAdded] = useState<Stock[]>([])
  const [mostAddedLoading, setMostAddedLoading] = useState(true)
  const [mostAddedError, setMostAddedError] = useState<string | null>(null)

  // Fetch last added stocks
  useEffect(() => {
    async function fetchLastAdded() {
      try {
        const data = await stocksApi.getLastAdded()
        setLastAdded(data)
      } catch (err) {
        setLastAddedError(err instanceof Error ? err.message : 'Failed to load')
      } finally {
        setLastAddedLoading(false)
      }
    }
    fetchLastAdded()
  }, [])

  // Fetch most added stocks
  useEffect(() => {
    async function fetchMostAdded() {
      try {
        const data = await stocksApi.getMostAdded()
        setMostAdded(data)
      } catch (err) {
        setMostAddedError(err instanceof Error ? err.message : 'Failed to load')
      } finally {
        setMostAddedLoading(false)
      }
    }
    fetchMostAdded()
  }, [])

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-4xl font-bold text-center mb-8">
        Dividend Portfolio
      </h1>

      {/* Last Added Stocks Section */}
      <section className="bg-white rounded-lg shadow-lg p-6 mb-8">
        <h2 className="text-3xl font-bold mb-6">Last 10 Added Stocks</h2>

        {lastAddedLoading && (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-3 text-gray-600">Loading...</span>
          </div>
        )}

        {lastAddedError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {lastAddedError}
          </div>
        )}

        {!lastAddedLoading && !lastAddedError && lastAdded.length === 0 && (
          <p className="text-gray-500 text-center py-4">No stocks found.</p>
        )}

        {!lastAddedLoading && !lastAddedError && lastAdded.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {lastAdded.map((stock) => (
              <StockCard key={stock.id} stock={stock} />
            ))}
          </div>
        )}
      </section>

      {/* Most Added Stocks Section */}
      <section className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-3xl font-bold mb-6">Top 10 Most Added to Radar</h2>

        {mostAddedLoading && (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-3 text-gray-600">Loading...</span>
          </div>
        )}

        {mostAddedError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {mostAddedError}
          </div>
        )}

        {!mostAddedLoading && !mostAddedError && mostAdded.length === 0 && (
          <p className="text-gray-500 text-center py-4">No stocks found.</p>
        )}

        {!mostAddedLoading && !mostAddedError && mostAdded.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {mostAdded.map((stock) => (
              <StockCard key={stock.id} stock={stock} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

export default HomePage
