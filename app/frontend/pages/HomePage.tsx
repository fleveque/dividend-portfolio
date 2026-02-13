import { Loader2 } from 'lucide-react'
import { Logo } from '../components/Logo'
import { FeatureShowcase } from '../components/FeatureShowcase'
import { TopScoredShowcase } from '../components/TopScoredShowcase'
import { CompactStockRow } from '../components/CompactStockRow'
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

  const topMostAdded = mostAdded?.slice(0, 5)
  const topLastAdded = lastAdded?.slice(0, 5)

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <Logo size="lg" showText={false} />
        </div>
        <h1 className="text-2xl sm:text-4xl font-bold text-foreground mb-2">
          Dividend Stocks Radar
        </h1>
        <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto">
          Track your dividend stocks, set target prices, and build your investment radar.
        </p>
      </div>

      {/* Feature Showcase + Top Scored Stocks */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-8">
        <Card className="lg:col-span-3">
          <CardContent className="px-6 pt-4 pb-5">
            <FeatureShowcase />
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardContent className="px-6 pt-4 pb-5">
            <TopScoredShowcase />
          </CardContent>
        </Card>
      </div>

      {/* Stock Lists — side by side on large screens */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Most Added Stocks */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <span className="w-1 h-5 bg-foreground rounded-full"></span>
              Most Added to Radar
            </CardTitle>
          </CardHeader>
          <CardContent>
            {mostAddedLoading && (
              <div className="flex items-center justify-center p-6">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
                <span className="ml-3 text-muted-foreground text-sm">Loading...</span>
              </div>
            )}

            {mostAddedError && (
              <Alert variant="destructive">
                <AlertDescription>
                  {mostAddedError instanceof Error ? mostAddedError.message : 'Failed to load'}
                </AlertDescription>
              </Alert>
            )}

            {!mostAddedLoading && !mostAddedError && (!topMostAdded || topMostAdded.length === 0) && (
              <p className="text-muted-foreground text-center py-6 text-sm">No stocks found.</p>
            )}

            {!mostAddedLoading && !mostAddedError && topMostAdded && topMostAdded.length > 0 && (
              <div className="divide-y">
                {topMostAdded.map((stock) => (
                  <CompactStockRow key={stock.id} stock={stock} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Last Updated Stocks */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <span className="w-1 h-5 bg-foreground rounded-full"></span>
              Recently Updated
            </CardTitle>
          </CardHeader>
          <CardContent>
            {lastAddedLoading && (
              <div className="flex items-center justify-center p-6">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
                <span className="ml-3 text-muted-foreground text-sm">Loading...</span>
              </div>
            )}

            {lastAddedError && (
              <Alert variant="destructive">
                <AlertDescription>
                  {lastAddedError instanceof Error ? lastAddedError.message : 'Failed to load'}
                </AlertDescription>
              </Alert>
            )}

            {!lastAddedLoading && !lastAddedError && (!topLastAdded || topLastAdded.length === 0) && (
              <p className="text-muted-foreground text-center py-6 text-sm">No stocks found.</p>
            )}

            {!lastAddedLoading && !lastAddedError && topLastAdded && topLastAdded.length > 0 && (
              <div className="divide-y">
                {topLastAdded.map((stock) => (
                  <CompactStockRow key={stock.id} stock={stock} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default HomePage
