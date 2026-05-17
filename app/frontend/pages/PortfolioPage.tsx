import { useState, useEffect, useMemo } from 'react'
import { Loader2, Minus, Maximize2, Package, Calendar } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { PortfolioStockCard } from '../components/PortfolioStockCard'
import { PortfolioStockRow } from '../components/PortfolioStockRow'
import { ViewToggle } from '../components/ViewToggle'
import { SearchResultCard } from '../components/SearchResultCard'
import { DividendCalendar } from '../components/DividendCalendar'
import { PortfolioInsights } from '../components/PortfolioInsights'
import { PortfolioStatsCard } from '../components/PortfolioStatsCard'
import { PulseShareButton } from '../components/PulseShareButton'
import { useHoldings, useCreateHolding, useDeleteHolding } from '../hooks/useHoldingsQueries'
import { useStockSearch, useResolveStock } from '../hooks/useStockQueries'
import { useViewPreference } from '../contexts/ViewPreferenceContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { formatCurrency, formatFxRate } from '../lib/currency'
import type { CurrencyTotals, DisplayTotal, Stock, StockSearchResult } from '../types'

const METRICS_PREFERENCE_KEY = 'portfolio-show-metrics'
const SORT_PREFERENCE_KEY = 'portfolio-sort-preference'

type SortBy = 'marketValue' | 'gainLoss' | 'gainLossPercent' | 'symbol'

export function PortfolioPage() {
  const { t } = useTranslation()
  const [searchQuery, setSearchQuery] = useState('')
  const [submittedQuery, setSubmittedQuery] = useState('')
  const [showMetrics, setShowMetrics] = useState(() => {
    const saved = localStorage.getItem(METRICS_PREFERENCE_KEY)
    return saved === 'true'
  })
  const [sortBy, setSortBy] = useState<SortBy>(() => {
    return (localStorage.getItem(SORT_PREFERENCE_KEY) as SortBy) || 'marketValue'
  })
  const [addingSymbol, setAddingSymbol] = useState<string | null>(null)
  const [resolvedStock, setResolvedStock] = useState<Stock | null>(null)
  const [resolvingSymbol, setResolvingSymbol] = useState<string | null>(null)
  const [quantity, setQuantity] = useState('')
  const [averagePrice, setAveragePrice] = useState('')
  const { viewMode } = useViewPreference()

  useEffect(() => {
    localStorage.setItem(METRICS_PREFERENCE_KEY, String(showMetrics))
  }, [showMetrics])

  useEffect(() => {
    localStorage.setItem(SORT_PREFERENCE_KEY, sortBy)
  }, [sortBy])

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
  const resolveStock = useResolveStock()

  const holdings = holdingsData?.holdings ?? []

  const sortedHoldings = useMemo(() => {
    if (holdings.length === 0) return holdings
    return [...holdings].sort((a, b) => {
      switch (sortBy) {
        case 'marketValue':
          return b.marketValue - a.marketValue
        case 'gainLoss':
          return b.gainLoss - a.gainLoss
        case 'gainLossPercent':
          return b.gainLossPercent - a.gainLossPercent
        case 'symbol':
          return a.stock.symbol.localeCompare(b.stock.symbol)
        default:
          return 0
      }
    })
  }, [holdings, sortBy])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmittedQuery(searchQuery.trim())
  }

  const isInPortfolio = (symbol: string) => {
    return holdings.some((h) => h.stock.symbol === symbol)
  }

  // Resolve the Stock id for the row currently being added: prefer the freshly resolved
  // stock; otherwise fall back to the existing holding's stock (for "add more").
  const stockForSymbol = (symbol: string): Stock | undefined => {
    if (resolvedStock?.symbol === symbol) return resolvedStock
    const holding = holdings.find((h) => h.stock.symbol === symbol)
    return holding?.stock
  }

  const handleStartAdd = async (result: StockSearchResult) => {
    const existing = holdings.find((h) => h.stock.symbol === result.symbol)?.stock
    if (existing) {
      setAddingSymbol(result.symbol)
      setResolvedStock(null)
      setQuantity('1')
      setAveragePrice(existing.price?.toFixed(2) ?? '')
      return
    }

    try {
      setResolvingSymbol(result.symbol)
      const resolved = await resolveStock.mutateAsync(result.symbol)
      setResolvedStock(resolved)
      setAddingSymbol(result.symbol)
      setQuantity('1')
      setAveragePrice(resolved.price?.toFixed(2) ?? '')
    } finally {
      setResolvingSymbol(null)
    }
  }

  const handleCancelAdd = () => {
    setAddingSymbol(null)
    setResolvedStock(null)
    setQuantity('')
    setAveragePrice('')
  }

  const handleConfirmAdd = (symbol: string) => {
    if (!quantity || !averagePrice) return
    const stock = stockForSymbol(symbol)
    if (!stock) return

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
              {t('portfolio.title')}
            </CardTitle>
            {holdingsData && holdings.length > 0 && (
              <PortfolioTotalsHeader
                totalsByCurrency={holdingsData.totalsByCurrency}
                displayTotal={holdingsData.displayTotal}
              />
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Pulse share — only when user has holdings worth sharing */}
          {holdings.length > 0 && (
            <div className="mb-6 flex justify-end">
              <PulseShareButton />
            </div>
          )}

          {/* Search Form */}
          <div className="mb-8">
            <form onSubmit={handleSearch} className="flex gap-3">
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('common.searchPlaceholder')}
                className="flex-1"
              />
              <Button type="submit" disabled={searchLoading}>
                {searchLoading ? t('common.searching') : t('common.search')}
              </Button>
            </form>
          </div>

          {/* Search Error */}
          {searchError && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{searchError instanceof Error ? searchError.message : t('common.searchFailed')}</AlertDescription>
            </Alert>
          )}

          {/* Add Stock Error */}
          {createHolding.error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{createHolding.error instanceof Error ? createHolding.error.message : t('portfolio.failedToAddHolding')}</AlertDescription>
            </Alert>
          )}

          {/* Search Results */}
          {searchResults && searchResults.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-foreground mb-4">{t('common.searchResults')}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {searchResults.map((result) => {
                  const inPortfolio = isInPortfolio(result.symbol)
                  const isAdding = addingSymbol === result.symbol
                  const isResolving = resolvingSymbol === result.symbol
                  return (
                  <div key={result.symbol} className="relative">
                    <SearchResultCard result={result} />
                    <div className="mt-3">
                      {inPortfolio ? (
                        isAdding ? (
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs text-muted-foreground">{t('portfolio.addMore')}:</span>
                            <Input
                              type="number"
                              value={quantity}
                              onChange={(e) => setQuantity(e.target.value)}
                              placeholder={t('stock.qty')}
                              className="w-20"
                              step="any"
                              min="0.0001"
                            />
                            <Input
                              type="number"
                              value={averagePrice}
                              onChange={(e) => setAveragePrice(e.target.value)}
                              placeholder={t('stock.avgPrice')}
                              className="w-24"
                              step="0.01"
                              min="0"
                            />
                            <Button size="sm" onClick={() => handleConfirmAdd(result.symbol)} disabled={createHolding.isPending || !quantity || !averagePrice}>
                              {createHolding.isPending ? <Loader2 className="size-4 animate-spin" /> : t('common.add')}
                            </Button>
                            <Button variant="ghost" size="sm" onClick={handleCancelAdd}>{t('common.cancel')}</Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Badge variant="success">{t('portfolio.inPortfolio')}</Badge>
                            <Button variant="outline" size="sm" onClick={() => handleStartAdd(result)} disabled={isResolving}>
                              {isResolving ? t('common.resolving') : t('portfolio.addMore')}
                            </Button>
                          </div>
                        )
                      ) : isAdding ? (
                        <div className="flex items-center gap-2 flex-wrap">
                          <Input
                            type="number"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            placeholder={t('stock.qty')}
                            className="w-20"
                            step="any"
                            min="0.0001"
                          />
                          <Input
                            type="number"
                            value={averagePrice}
                            onChange={(e) => setAveragePrice(e.target.value)}
                            placeholder={t('stock.avgPrice')}
                            className="w-24"
                            step="0.01"
                            min="0"
                          />
                          <Button size="sm" onClick={() => handleConfirmAdd(result.symbol)} disabled={createHolding.isPending || !quantity || !averagePrice}>
                            {createHolding.isPending ? <Loader2 className="size-4 animate-spin" /> : t('common.add')}
                          </Button>
                          <Button variant="ghost" size="sm" onClick={handleCancelAdd}>{t('common.cancel')}</Button>
                        </div>
                      ) : (
                        <Button
                          onClick={() => handleStartAdd(result)}
                          disabled={isResolving}
                          className="w-full"
                          size="sm"
                        >
                          {isResolving ? t('common.resolving') : t('portfolio.addToPortfolio')}
                        </Button>
                      )}
                    </div>
                  </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* No Results Found */}
          {submittedQuery && !searchLoading && searchResults && searchResults.length === 0 && (
            <Alert variant="warning" className="mb-8">
              <AlertDescription>{t('common.noSearchResults', { query: submittedQuery.toUpperCase() })}</AlertDescription>
            </Alert>
          )}

          {/* Holdings Section */}
          <div>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-4">
              <h2 className="text-xl sm:text-2xl font-semibold text-foreground">
                {t('portfolio.myHoldings', { count: holdings.length })}
              </h2>
              <div className="flex items-center gap-4">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortBy)}
                  className="text-xs border rounded-md px-2 py-1.5 bg-background text-foreground"
                >
                  <option value="marketValue">{t('portfolio.sortValue')}</option>
                  <option value="gainLoss">{t('portfolio.sortGainLoss')}</option>
                  <option value="gainLossPercent">{t('portfolio.sortGainPercent')}</option>
                  <option value="symbol">{t('portfolio.sortSymbol')}</option>
                </select>
                <ViewToggle />
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => refetchHoldings()}
                  disabled={holdingsLoading}
                  className="p-0"
                >
                  {holdingsLoading ? t('common.refreshing') : t('common.refresh')}
                </Button>
              </div>
            </div>

            {/* Holdings Error */}
            {holdingsError && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{holdingsError instanceof Error ? holdingsError.message : t('portfolio.failedToLoadPortfolio')}</AlertDescription>
              </Alert>
            )}

            {/* Delete Error */}
            {deleteHolding.error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{deleteHolding.error instanceof Error ? deleteHolding.error.message : t('portfolio.failedToRemoveHolding')}</AlertDescription>
              </Alert>
            )}

            {/* Holdings Loading */}
            {holdingsLoading && holdings.length === 0 && (
              <div className="text-center py-12">
                <Loader2 className="size-8 animate-spin text-muted-foreground mx-auto" />
                <p className="mt-3 text-muted-foreground">{t('portfolio.loadingPortfolio')}</p>
              </div>
            )}

            {/* Empty State */}
            {!holdingsLoading && holdings.length === 0 && (
              <div className="text-center py-12 bg-muted rounded-xl">
                <div className="size-16 mx-auto mb-4 rounded-full bg-background flex items-center justify-center">
                  <Package className="size-8 text-muted-foreground" />
                </div>
                <p className="text-foreground font-medium">{t('portfolio.emptyTitle')}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {t('portfolio.emptyDescription')}
                </p>
              </div>
            )}

            {/* Card View */}
            {holdings.length > 0 && viewMode === 'card' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sortedHoldings.map((holding) => (
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
                      <><Minus className="size-3.5" /> {t('common.collapse')}</>
                    ) : (
                      <><Maximize2 className="size-3.5" /> {t('common.expand')}</>
                    )}
                  </Button>
                </div>
                <p className={cn('text-xs text-muted-foreground text-center mb-2', showMetrics ? 'xl:hidden' : 'md:hidden')}>
                  {t('common.tapRowToExpand')}
                </p>
                {/* Header Row */}
                <div className={cn('hidden px-4 py-2 items-center gap-4 text-xs font-medium text-muted-foreground uppercase tracking-wide border-b overflow-hidden', showMetrics ? 'xl:flex' : 'md:flex')}>
                  <span className="w-8 shrink-0"></span>
                  <span className="w-16 shrink-0">{t('stock.symbol')}</span>
                  <span className="w-40 shrink min-w-0">{t('stock.name')}</span>
                  <span className="w-16 shrink-0">{t('stock.score')}</span>
                  <span className="w-20 text-right shrink-0">{t('stock.price')}</span>
                  <span className="w-14 text-right shrink-0">{t('stock.qty')}</span>
                  <span className="w-20 text-right shrink-0">{t('stock.avgPrice')}</span>
                  <span className="w-24 text-right shrink-0">{t('stock.gainLoss')}</span>
                  {showMetrics && (
                    <>
                      <span className="w-14 text-right shrink-0">PER</span>
                      <span className="w-16 text-right shrink-0">EPS</span>
                      <span className="w-14 text-right shrink-0">Div</span>
                      <span className="w-14 text-right shrink-0">Yield</span>
                      <span className="w-14 text-right shrink-0">Payout</span>
                      <span className="w-18 text-right shrink-0">MA50</span>
                      <span className="w-18 text-right shrink-0">MA200</span>
                      <span className="w-28 text-right shrink-0">{t('stock.schedule')}</span>
                    </>
                  )}
                  <span className="w-6 shrink-0"></span>
                </div>
                {/* Stock Rows */}
                <div>
                  {sortedHoldings.map((holding) => (
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

      {/* Portfolio Stats */}
      {holdings.length > 0 && holdingsData?.portfolioStats && (
        <div className="mt-6">
          <PortfolioStatsCard stats={holdingsData.portfolioStats} />
        </div>
      )}

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
              {t('portfolio.dividendCalendar')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DividendCalendar holdings={holdings} />
          </CardContent>
        </Card>
      )}
    </div>
  )
}

interface PortfolioTotalsHeaderProps {
  totalsByCurrency: Record<string, CurrencyTotals>
  displayTotal: DisplayTotal | null
}

function PortfolioTotalsHeader({ totalsByCurrency, displayTotal }: PortfolioTotalsHeaderProps) {
  const { t } = useTranslation()
  const entries = Object.entries(totalsByCurrency)
  const hasDisplayTotal = displayTotal !== null
  const isMultiCurrency = entries.length > 1
  const showBreakdown = hasDisplayTotal && isMultiCurrency

  return (
    <div className="text-right text-sm space-y-2">
      <div className="text-muted-foreground">{t('portfolio.totalValue')}</div>
      {hasDisplayTotal ? (
        <DisplayTotalBlock displayTotal={displayTotal} />
      ) : (
        entries.map(([code, totals]) => <CurrencyTotalRow key={code} code={code} totals={totals} />)
      )}
      {showBreakdown && (
        <div className="pt-1 border-t border-border/40 text-xs text-muted-foreground space-y-0.5">
          {entries.map(([code, totals]) => (
            <div key={code}>
              {formatCurrency(totals.value, code)}
              {displayTotal.conversions[code] !== undefined && (
                <span className="opacity-70"> @ {formatFxRate(displayTotal.conversions[code])}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function DisplayTotalBlock({ displayTotal }: { displayTotal: DisplayTotal }) {
  return (
    <div>
      <div className="font-bold text-foreground">{formatCurrency(displayTotal.value, displayTotal.currency)}</div>
      <div className={cn('text-xs font-medium', displayTotal.gainLoss >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400')}>
        {displayTotal.gainLoss >= 0 ? '+' : ''}{formatCurrency(displayTotal.gainLoss, displayTotal.currency)} ({displayTotal.gainLossPercent.toFixed(1)}%)
      </div>
    </div>
  )
}

function CurrencyTotalRow({ code, totals }: { code: string; totals: CurrencyTotals }) {
  return (
    <div>
      <div className="font-bold text-foreground">{formatCurrency(totals.value, code)}</div>
      <div className={cn('text-xs font-medium', totals.gainLoss >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400')}>
        {totals.gainLoss >= 0 ? '+' : ''}{formatCurrency(totals.gainLoss, code)} ({totals.gainLossPercent.toFixed(1)}%)
      </div>
    </div>
  )
}

export default PortfolioPage
