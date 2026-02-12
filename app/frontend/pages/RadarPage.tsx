import { useState, useEffect } from 'react'
import { Loader2, ShoppingCart, Minus, Maximize2, Package, Calendar } from 'lucide-react'
import { RadarStockCard } from '../components/RadarStockCard'
import { RadarStockRow } from '../components/RadarStockRow'
import { ViewToggle } from '../components/ViewToggle'
import StockCard from '../components/StockCard'
import { BuyPlanModeToggle } from '../components/BuyPlanModeToggle'
import { AddToCartButton } from '../components/AddToCartButton'
import { CartSummaryBar } from '../components/CartSummaryBar'
import { CartDrawer } from '../components/CartDrawer'
import { DividendCalendar } from '../components/DividendCalendar'
import { useRadar, useAddStock, useRemoveStock } from '../hooks/useRadarQueries'
import { useStockSearch } from '../hooks/useStockQueries'
import { useViewPreference } from '../contexts/ViewPreferenceContext'
import { useBuyPlanContext } from '../contexts/BuyPlanContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { Stock } from '../types'

const METRICS_PREFERENCE_KEY = 'radar-show-metrics'

export function RadarPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [submittedQuery, setSubmittedQuery] = useState('')
  const [showMetrics, setShowMetrics] = useState(() => {
    const saved = localStorage.getItem(METRICS_PREFERENCE_KEY)
    return saved === 'true'
  })
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false)
  const { viewMode } = useViewPreference()
  const { isActive: isBuyPlanMode } = useBuyPlanContext()

  useEffect(() => {
    localStorage.setItem(METRICS_PREFERENCE_KEY, String(showMetrics))
  }, [showMetrics])

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
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-2xl sm:text-3xl flex items-center gap-2">
              <span className="w-1 h-8 bg-foreground rounded-full"></span>
              My Radar
            </CardTitle>
            <BuyPlanModeToggle />
          </div>
        </CardHeader>
        <CardContent>
          {/* Buy Plan Mode Banner */}
          {isBuyPlanMode && (
            <Alert variant="warning" className="mb-4">
              <ShoppingCart className="size-4" />
              <AlertDescription>
                <span className="font-medium">Buy Plan Mode</span> — Add stocks to your buy plan cart. Click "View Cart" at the bottom to save.
              </AlertDescription>
            </Alert>
          )}

          {/* Search Form */}
          <div className="mb-8">
            <form onSubmit={handleSearch} className="flex gap-3">
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search stocks by symbol (e.g., AAPL)..."
                className="flex-1"
                disabled={isBuyPlanMode}
              />
              <Button type="submit" disabled={searchLoading || isBuyPlanMode}>
                {searchLoading ? 'Searching...' : 'Search'}
              </Button>
            </form>
            {isBuyPlanMode && (
              <p className="text-xs text-muted-foreground mt-1">Search is disabled in buy plan mode</p>
            )}
          </div>

          {/* Search Error */}
          {searchError && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{searchError instanceof Error ? searchError.message : 'Search failed'}</AlertDescription>
            </Alert>
          )}

          {/* Add Stock Error */}
          {addStock.error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{addStock.error instanceof Error ? addStock.error.message : 'Failed to add stock'}</AlertDescription>
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
                      {isOnRadar(stock.id) ? (
                        <Badge variant="success">Already on your radar</Badge>
                      ) : (
                        <Button
                          onClick={() => handleAddStock(stock)}
                          disabled={addStock.isPending}
                          className="w-full"
                          size="sm"
                        >
                          {addStock.isPending ? 'Adding...' : 'Add to Radar'}
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

          {/* Radar Stocks Section */}
          <div>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-4">
              <h2 className="text-xl sm:text-2xl font-semibold text-foreground">
                Stocks on My Radar ({radarStocks.length})
              </h2>
              <div className="flex items-center gap-4">
                <ViewToggle />
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => refetchRadar()}
                  disabled={radarLoading}
                  className="p-0"
                >
                  {radarLoading ? 'Refreshing...' : 'Refresh'}
                </Button>
              </div>
            </div>

            {/* Radar Error */}
            {radarError && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{radarError instanceof Error ? radarError.message : 'Failed to load radar'}</AlertDescription>
              </Alert>
            )}

            {/* Remove Stock Error */}
            {removeStock.error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{removeStock.error instanceof Error ? removeStock.error.message : 'Failed to remove stock'}</AlertDescription>
              </Alert>
            )}

            {/* Radar Loading */}
            {radarLoading && radarStocks.length === 0 && (
              <div className="text-center py-12">
                <Loader2 className="size-8 animate-spin text-muted-foreground mx-auto" />
                <p className="mt-3 text-muted-foreground">Loading your radar...</p>
              </div>
            )}

            {/* Empty State */}
            {!radarLoading && radarStocks.length === 0 && (
              <div className="text-center py-12 bg-muted rounded-xl">
                <div className="size-16 mx-auto mb-4 rounded-full bg-background flex items-center justify-center">
                  <Package className="size-8 text-muted-foreground" />
                </div>
                <p className="text-foreground font-medium">Your radar is empty.</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Search for stocks above to add them to your radar.
                </p>
              </div>
            )}

            {/* Stocks Grid/List */}
            {radarStocks.length > 0 && viewMode === 'card' && (
              <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${isBuyPlanMode ? 'pb-20' : ''}`}>
                {radarStocks.map((stock) => (
                  <div key={stock.id}>
                    <RadarStockCard
                      stock={stock}
                      onRemove={isBuyPlanMode ? undefined : () => handleRemoveStock(stock.id)}
                      isRemoving={removeStock.isPending}
                    />
                    {isBuyPlanMode && (
                      <div className="mt-2 flex justify-end">
                        <AddToCartButton stock={stock} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Compact List View */}
            {radarStocks.length > 0 && viewMode === 'compact' && (
              <div className={`flex flex-col gap-2 ${isBuyPlanMode ? 'pb-20' : ''}`}>
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
                  <span className="w-24 shrink-0">Target</span>
                  <span className="w-16 text-right shrink-0">Status</span>
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
                  {isBuyPlanMode ? (
                    <span className="w-28 shrink-0 text-right">Add to Cart</span>
                  ) : (
                    <span className="w-6 shrink-0"></span>
                  )}
                </div>
                {/* Stock Rows */}
                <div>
                  {radarStocks.map((stock) => (
                    <RadarStockRow
                      key={stock.id}
                      stock={stock}
                      onRemove={isBuyPlanMode ? undefined : () => handleRemoveStock(stock.id)}
                      isRemoving={removeStock.isPending}
                      showMetrics={showMetrics}
                      actionSlot={isBuyPlanMode ? <AddToCartButton stock={stock} /> : undefined}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dividend Calendar */}
      {radarStocks.length > 0 && !isBuyPlanMode && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Calendar className="size-5" />
              Dividend Calendar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DividendCalendar stocks={radarStocks} />
          </CardContent>
        </Card>
      )}

      {/* Buy Plan Cart Components */}
      <CartSummaryBar onOpenDrawer={() => setIsCartDrawerOpen(true)} />
      <CartDrawer isOpen={isCartDrawerOpen} onClose={() => setIsCartDrawerOpen(false)} />
    </div>
  )
}

export default RadarPage
