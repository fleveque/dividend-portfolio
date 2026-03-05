import { useState, useEffect } from 'react'
import { Loader2, Minus, Maximize2, Package, Calendar } from 'lucide-react'
import { PortfolioStockCard } from '../components/PortfolioStockCard'
import { PortfolioStockRow } from '../components/PortfolioStockRow'
import { ViewToggle } from '../components/ViewToggle'
import StockCard from '../components/StockCard'
import { DividendCalendar } from '../components/DividendCalendar'
import { PortfolioInsights } from '../components/PortfolioInsights'
import { useHoldings, useCreateHolding, useDeleteHolding } from '../hooks/useHoldingsQueries'
import { useStockSearch } from '../hooks/useStockQueries'
import { useViewPreference } from '../contexts/ViewPreferenceContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { Stock } from '../types'

const METRICS_PREFERENCE_KEY = 'portfolio-show-metrics'

export function PortfolioPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [submittedQuery, setSubmittedQuery] = useState('')
  const [showMetrics, setShowMetrics] = useState(() => {
    const saved = localStorage.getItem(METRICS_PREFERENCE_KEY)
    return saved === 'true'
  })
  const [addingStockId, setAddingStockId] = useState<number | null>(null)
  const [quantity, setQuantity] = useState('')
  const [averagePrice, setAveragePrice] = useState('')
  const { viewMode } = useViewPreference()

  useEffect(() => {
    localStorage.setItem(METRICS_PREFERENCE_KEY, String(showMetrics))
  }, [showMetrics])

  const {
    data: holdingsData,
    isLoading: holdingsLoading,
    error: holdingsError,
    refetch: refetchHoldings,
  } = useHoldings()

  const {
    data: searchResults,
    isLoading: searchLoading,
    error: searchError,
  } = useStockSearch(submittedQuery)

  const createHolding = useCreateHolding()
  const deleteHolding = useDeleteHolding()

  const holdings = holdingsData?.holdings ?? []
  const stocks = holdings.map((h) => h.stock)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmittedQuery(searchQuery.trim())
  }

  const isInPortfolio = (stockId: number) => {
    return holdings.some((h) => h.stock.id === stockId)
  }

  const handleStartAdd = (stock: Stock) => {
    setAddingStockId(stock.id)
    setQuantity('1')
    setAveragePrice(stock.price?.toFixed(2) ?? '')
  }

  const handleCancelAdd = () => {
    setAddingStockId(null)
    setQuantity('')
    setAveragePrice('')
  }

  const handleConfirmAdd = (stock: Stock) => {
    if (!quantity || !averagePrice) return

    createHolding.mutate(
      { stockId: stock.id, quantity: parseFloat(quantity), averagePrice: parseFloat(averagePrice) },
      {
        onSuccess: () => {
          handleCancelAdd()
          setSearchQuery('')
          setSubmittedQuery('')
        },
      }
    )
  }

  const handleRemoveHolding = (holdingId: number) => {
    deleteHolding.mutate(holdingId)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-2xl sm:text-3xl flex items-center gap-2">
              <span className="w-1 h-8 bg-foreground rounded-full"></span>
              My Portfolio
            </CardTitle>
            {holdingsData && holdings.length > 0 && (
              <div className="text-right text-sm">
                <div className="text-muted-foreground">Total Value</div>
                <div className="font-bold text-foreground">${holdingsData.totalValue.toFixed(2)}</div>
                <div className={cn('text-xs font-medium', holdingsData.totalGainLoss >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400')}>
                  {holdingsData.totalGainLoss >= 0 ? '+' : ''}${holdingsData.totalGainLoss.toFixed(2)} ({holdingsData.totalGainLossPercent.toFixed(1)}%)
                </div>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Search Form */}
          <div className="mb-8">
            <form onSubmit={handleSearch} className="flex gap-3">
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search stocks by symbol (e.g., AAPL)..."
                className="flex-1"
              />
              <Button type="submit" disabled={searchLoading}>
                {searchLoading ? 'Searching...' : 'Search'}
              </Button>
            </form>
          </div>

          {/* Search Error */}
          {searchError && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{searchError instanceof Error ? searchError.message : 'Search failed'}</AlertDescription>
            </Alert>
          )}

          {/* Add Stock Error */}
          {createHolding.error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{createHolding.error instanceof Error ? createHolding.error.message : 'Failed to add holding'}</AlertDescription>
            </Alert>
          )}

          {/* Search Results */}
          {searchResults && searchResults.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-foreground mb-4">Search Results</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {searchResults.map((stock) => (
                  <div key={stock.id} className="relative">
                    <StockCard stock={stock} />
                    <div className="mt-3">
                      {isInPortfolio(stock.id) ? (
                        addingStockId === stock.id ? (
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs text-muted-foreground">Add more:</span>
                            <Input
                              type="number"
                              value={quantity}
                              onChange={(e) => setQuantity(e.target.value)}
                              placeholder="Qty"
                              className="w-20"
                              step="any"
                              min="0.0001"
                            />
                            <Input
                              type="number"
                              value={averagePrice}
                              onChange={(e) => setAveragePrice(e.target.value)}
                              placeholder="Avg $"
                              className="w-24"
                              step="0.01"
                              min="0"
                            />
                            <Button size="sm" onClick={() => handleConfirmAdd(stock)} disabled={createHolding.isPending || !quantity || !averagePrice}>
                              {createHolding.isPending ? <Loader2 className="size-4 animate-spin" /> : 'Add'}
                            </Button>
                            <Button variant="ghost" size="sm" onClick={handleCancelAdd}>Cancel</Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Badge variant="success">In portfolio</Badge>
                            <Button variant="outline" size="sm" onClick={() => handleStartAdd(stock)}>
                              Add more
                            </Button>
                          </div>
                        )
                      ) : addingStockId === stock.id ? (
                        <div className="flex items-center gap-2 flex-wrap">
                          <Input
                            type="number"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            placeholder="Qty"
                            className="w-20"
                            step="any"
                            min="0.0001"
                          />
                          <Input
                            type="number"
                            value={averagePrice}
                            onChange={(e) => setAveragePrice(e.target.value)}
                            placeholder="Avg $"
                            className="w-24"
                            step="0.01"
                            min="0"
                          />
                          <Button size="sm" onClick={() => handleConfirmAdd(stock)} disabled={createHolding.isPending || !quantity || !averagePrice}>
                            {createHolding.isPending ? <Loader2 className="size-4 animate-spin" /> : 'Add'}
                          </Button>
                          <Button variant="ghost" size="sm" onClick={handleCancelAdd}>Cancel</Button>
                        </div>
                      ) : (
                        <Button
                          onClick={() => handleStartAdd(stock)}
                          className="w-full"
                          size="sm"
                        >
                          Add to Portfolio
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No Results Found */}
          {submittedQuery && !searchLoading && searchResults && searchResults.length === 0 && (
            <Alert variant="warning" className="mb-8">
              <AlertDescription>No stocks found for "{submittedQuery.toUpperCase()}". Please check the symbol and try again.</AlertDescription>
            </Alert>
          )}

          {/* Holdings Section */}
          <div>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-4">
              <h2 className="text-xl sm:text-2xl font-semibold text-foreground">
                My Holdings ({holdings.length})
              </h2>
              <div className="flex items-center gap-4">
                <ViewToggle />
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => refetchHoldings()}
                  disabled={holdingsLoading}
                  className="p-0"
                >
                  {holdingsLoading ? 'Refreshing...' : 'Refresh'}
                </Button>
              </div>
            </div>

            {/* Holdings Error */}
            {holdingsError && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{holdingsError instanceof Error ? holdingsError.message : 'Failed to load portfolio'}</AlertDescription>
              </Alert>
            )}

            {/* Delete Error */}
            {deleteHolding.error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{deleteHolding.error instanceof Error ? deleteHolding.error.message : 'Failed to remove holding'}</AlertDescription>
              </Alert>
            )}

            {/* Holdings Loading */}
            {holdingsLoading && holdings.length === 0 && (
              <div className="text-center py-12">
                <Loader2 className="size-8 animate-spin text-muted-foreground mx-auto" />
                <p className="mt-3 text-muted-foreground">Loading your portfolio...</p>
              </div>
            )}

            {/* Empty State */}
            {!holdingsLoading && holdings.length === 0 && (
              <div className="text-center py-12 bg-muted rounded-xl">
                <div className="size-16 mx-auto mb-4 rounded-full bg-background flex items-center justify-center">
                  <Package className="size-8 text-muted-foreground" />
                </div>
                <p className="text-foreground font-medium">Your portfolio is empty.</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Search for stocks above to add them to your portfolio.
                </p>
              </div>
            )}

            {/* Card View */}
            {holdings.length > 0 && viewMode === 'card' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {holdings.map((holding) => (
                  <PortfolioStockCard
                    key={holding.id}
                    holding={holding}
                    onRemove={() => handleRemoveHolding(holding.id)}
                    isRemoving={deleteHolding.isPending}
                  />
                ))}
              </div>
            )}

            {/* Compact List View */}
            {holdings.length > 0 && viewMode === 'compact' && (
              <div className="flex flex-col gap-2">
                {/* Controls Row */}
                <div className={cn('hidden justify-end mb-2', showMetrics ? 'xl:flex' : 'md:flex')}>
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={() => setShowMetrics(!showMetrics)}
                  >
                    {showMetrics ? (
                      <><Minus className="size-3.5" /> Collapse</>
                    ) : (
                      <><Maximize2 className="size-3.5" /> Expand</>
                    )}
                  </Button>
                </div>
                <p className={cn('text-xs text-muted-foreground text-center mb-2', showMetrics ? 'xl:hidden' : 'md:hidden')}>
                  Tap a row to expand details
                </p>
                {/* Header Row */}
                <div className={cn('hidden px-4 py-2 items-center gap-4 text-xs font-medium text-muted-foreground uppercase tracking-wide border-b overflow-hidden', showMetrics ? 'xl:flex' : 'md:flex')}>
                  <span className="w-8 shrink-0"></span>
                  <span className="w-16 shrink-0">Symbol</span>
                  <span className="w-40 shrink min-w-0">Name</span>
                  <span className="w-16 shrink-0">Score</span>
                  <span className="w-20 text-right shrink-0">Price</span>
                  <span className="w-14 text-right shrink-0">Qty</span>
                  <span className="w-20 text-right shrink-0">Avg Price</span>
                  <span className="w-24 text-right shrink-0">Gain/Loss</span>
                  {showMetrics && (
                    <>
                      <span className="w-14 text-right shrink-0">PER</span>
                      <span className="w-16 text-right shrink-0">EPS</span>
                      <span className="w-14 text-right shrink-0">Div</span>
                      <span className="w-14 text-right shrink-0">Yield</span>
                      <span className="w-14 text-right shrink-0">Payout</span>
                      <span className="w-18 text-right shrink-0">MA50</span>
                      <span className="w-18 text-right shrink-0">MA200</span>
                      <span className="w-28 text-right shrink-0">Schedule</span>
                    </>
                  )}
                  <span className="w-6 shrink-0"></span>
                </div>
                {/* Stock Rows */}
                <div>
                  {holdings.map((holding) => (
                    <PortfolioStockRow
                      key={holding.id}
                      holding={holding}
                      onRemove={() => handleRemoveHolding(holding.id)}
                      isRemoving={deleteHolding.isPending}
                      showMetrics={showMetrics}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* AI Portfolio Insights */}
      {holdings.length > 0 && (
        <PortfolioInsights hasStocks={holdings.length > 0} />
      )}

      {/* Dividend Calendar */}
      {holdings.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Calendar className="size-5" />
              Dividend Calendar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DividendCalendar stocks={stocks} />
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default PortfolioPage
