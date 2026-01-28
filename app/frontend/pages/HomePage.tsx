/**
 * HomePage - React version of home/index.html.erb
 *
 * Phase 10: React Query Integration
 * =================================
 *
 * This page now uses React Query hooks instead of manual fetch + useState.
 *
 * Before (manual):
 *   const [data, setData] = useState([])
 *   const [loading, setLoading] = useState(true)
 *   const [error, setError] = useState(null)
 *   useEffect(() => { fetch()... }, [])
 *
 * After (React Query):
 *   const { data, isLoading, error } = useLastAddedStocks()
 *
 * Benefits:
 * - Less boilerplate code
 * - Automatic caching (navigate away and back = instant data)
 * - Background refetching when data becomes stale
 * - Built-in retry on failure
 */

import StockCard from '../components/StockCard'
import { useLastAddedStocks, useMostAddedStocks } from '../hooks/useStockQueries'

export function HomePage() {
  // React Query handles loading, error, and data states
  const {
    data: lastAdded,
    isLoading: lastAddedLoading,
    error: lastAddedError,
  } = useLastAddedStocks()

  const {
    data: mostAdded,
    isLoading: mostAddedLoading,
    error: mostAddedError,
  } = useMostAddedStocks()

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
            {lastAddedError instanceof Error ? lastAddedError.message : 'Failed to load'}
          </div>
        )}

        {!lastAddedLoading && !lastAddedError && (!lastAdded || lastAdded.length === 0) && (
          <p className="text-gray-500 text-center py-4">No stocks found.</p>
        )}

        {!lastAddedLoading && !lastAddedError && lastAdded && lastAdded.length > 0 && (
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
            {mostAddedError instanceof Error ? mostAddedError.message : 'Failed to load'}
          </div>
        )}

        {!mostAddedLoading && !mostAddedError && (!mostAdded || mostAdded.length === 0) && (
          <p className="text-gray-500 text-center py-4">No stocks found.</p>
        )}

        {!mostAddedLoading && !mostAddedError && mostAdded && mostAdded.length > 0 && (
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
