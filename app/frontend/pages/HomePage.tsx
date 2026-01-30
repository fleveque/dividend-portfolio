/**
 * HomePage - Landing page with stock listings
 *
 * Features:
 * - React Query for data fetching
 * - Theme-aware styling
 * - Responsive grid layout
 */

import StockCard from '../components/StockCard'
import { Logo } from '../components/Logo'
import { useLastAddedStocks, useMostAddedStocks } from '../hooks/useStockQueries'

export function HomePage() {
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
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <div className="flex justify-center mb-4">
          <Logo size="lg" showText={false} />
        </div>
        <h1 className="text-4xl font-bold text-theme-primary mb-3">
          Dividend Stocks Radar
        </h1>
        <p className="text-theme-secondary text-lg max-w-2xl mx-auto">
          Track your dividend stocks, set target prices, and build your investment radar.
        </p>
      </div>

      {/* Most Added Stocks Section */}
      <section className="section mb-8">
        <h2 className="text-2xl font-bold text-theme-primary mb-6 flex items-center gap-2">
          <span className="w-1 h-6 bg-brand rounded-full"></span>
          Top 10 Most Added to Radar
        </h2>

        {mostAddedLoading && (
          <div className="flex items-center justify-center p-8">
            <div className="spinner spinner-lg text-brand"></div>
            <span className="ml-3 text-theme-secondary">Loading...</span>
          </div>
        )}

        {mostAddedError && (
          <div className="alert alert-danger">
            {mostAddedError instanceof Error ? mostAddedError.message : 'Failed to load'}
          </div>
        )}

        {!mostAddedLoading && !mostAddedError && (!mostAdded || mostAdded.length === 0) && (
          <p className="text-theme-muted text-center py-8">No stocks found.</p>
        )}

        {!mostAddedLoading && !mostAddedError && mostAdded && mostAdded.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {mostAdded.map((stock) => (
              <StockCard key={stock.id} stock={stock} />
            ))}
          </div>
        )}
      </section>

      {/* Last Updated Stocks Section */}
      <section className="section">
        <h2 className="text-2xl font-bold text-theme-primary mb-6 flex items-center gap-2">
          <span className="w-1 h-6 bg-brand rounded-full"></span>
          Last 10 Updated Stocks
        </h2>

        {lastAddedLoading && (
          <div className="flex items-center justify-center p-8">
            <div className="spinner spinner-lg text-brand"></div>
            <span className="ml-3 text-theme-secondary">Loading...</span>
          </div>
        )}

        {lastAddedError && (
          <div className="alert alert-danger">
            {lastAddedError instanceof Error ? lastAddedError.message : 'Failed to load'}
          </div>
        )}

        {!lastAddedLoading && !lastAddedError && (!lastAdded || lastAdded.length === 0) && (
          <p className="text-theme-muted text-center py-8">No stocks found.</p>
        )}

        {!lastAddedLoading && !lastAddedError && lastAdded && lastAdded.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {lastAdded.map((stock) => (
              <StockCard key={stock.id} stock={stock} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

export default HomePage
