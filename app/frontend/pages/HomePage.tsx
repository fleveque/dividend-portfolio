import { Loader2 } from 'lucide-react'
import StockCard from '../components/StockCard'
import { Logo } from '../components/Logo'
import { useLastAddedStocks, useMostAddedStocks } from '../hooks/useStockQueries'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

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
        <h1 className="text-2xl sm:text-4xl font-bold text-foreground mb-3">
          Dividend Stocks Radar
        </h1>
        <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto">
          Track your dividend stocks, set target prices, and build your investment radar.
        </p>
      </div>

      {/* Most Added Stocks Section */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-xl sm:text-2xl flex items-center gap-2">
            <span className="w-1 h-6 bg-foreground rounded-full"></span>
            Top 10 Most Added to Radar
          </CardTitle>
        </CardHeader>
        <CardContent>
          {mostAddedLoading && (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="size-8 animate-spin text-muted-foreground" />
              <span className="ml-3 text-muted-foreground">Loading...</span>
            </div>
          )}

          {mostAddedError && (
            <Alert variant="destructive">
              <AlertDescription>
                {mostAddedError instanceof Error ? mostAddedError.message : 'Failed to load'}
              </AlertDescription>
            </Alert>
          )}

          {!mostAddedLoading && !mostAddedError && (!mostAdded || mostAdded.length === 0) && (
            <p className="text-muted-foreground text-center py-8">No stocks found.</p>
          )}

          {!mostAddedLoading && !mostAddedError && mostAdded && mostAdded.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {mostAdded.map((stock) => (
                <StockCard key={stock.id} stock={stock} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Last Updated Stocks Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl sm:text-2xl flex items-center gap-2">
            <span className="w-1 h-6 bg-foreground rounded-full"></span>
            Last 10 Updated Stocks
          </CardTitle>
        </CardHeader>
        <CardContent>
          {lastAddedLoading && (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="size-8 animate-spin text-muted-foreground" />
              <span className="ml-3 text-muted-foreground">Loading...</span>
            </div>
          )}

          {lastAddedError && (
            <Alert variant="destructive">
              <AlertDescription>
                {lastAddedError instanceof Error ? lastAddedError.message : 'Failed to load'}
              </AlertDescription>
            </Alert>
          )}

          {!lastAddedLoading && !lastAddedError && (!lastAdded || lastAdded.length === 0) && (
            <p className="text-muted-foreground text-center py-8">No stocks found.</p>
          )}

          {!lastAddedLoading && !lastAddedError && lastAdded && lastAdded.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {lastAdded.map((stock) => (
                <StockCard key={stock.id} stock={stock} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default HomePage
