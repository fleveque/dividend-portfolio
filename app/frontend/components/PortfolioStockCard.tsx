import { useState, useCallback } from 'react'
import { Check, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useInlineEdit } from '../hooks/useInlineEdit'
import { useUpdateHolding } from '../hooks/useHoldingsQueries'
import { StockLogo } from './StockLogo'
import { DividendMonthGrid } from './DividendMonthGrid'
import { FiftyTwoWeekRange } from './FiftyTwoWeekRange'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { ScoreBadge } from './ScoreBadge'
import { StockAiSummary } from './StockAiSummary'
import type { Holding } from '../types'

interface PortfolioStockCardProps {
  holding: Holding
  onRemove?: () => void
  isRemoving?: boolean
}

export function PortfolioStockCard({ holding, onRemove, isRemoving }: PortfolioStockCardProps) {
  const { t } = useTranslation()
  const { stock } = holding
  const isPositive = holding.gainLoss >= 0
  const updateHolding = useUpdateHolding()
  const [editingField, setEditingField] = useState<'qty' | 'avg' | null>(null)

  const qtyEdit = useInlineEdit({
    initialValue: holding.quantity.toString(),
    onSave: async (newValue) => {
      const qty = parseFloat(newValue)
      if (qty <= 0 || isNaN(qty)) throw new Error(t('stock.qtyMustBePositive'))
      await updateHolding.mutateAsync({ id: holding.id, quantity: qty, averagePrice: holding.averagePrice })
    },
  })

  const avgPriceEdit = useInlineEdit({
    initialValue: holding.averagePrice.toFixed(2),
    onSave: async (newValue) => {
      const price = parseFloat(newValue)
      if (price < 0 || isNaN(price)) throw new Error(t('stock.priceMustBePositive'))
      await updateHolding.mutateAsync({ id: holding.id, quantity: holding.quantity, averagePrice: price })
    },
  })

  const startQtyEdit = useCallback(() => {
    if (editingField === 'avg') avgPriceEdit.cancelEdit()
    setEditingField('qty')
    qtyEdit.startEdit()
  }, [editingField, avgPriceEdit, qtyEdit])

  const startAvgEdit = useCallback(() => {
    if (editingField === 'qty') qtyEdit.cancelEdit()
    setEditingField('avg')
    avgPriceEdit.startEdit()
  }, [editingField, qtyEdit, avgPriceEdit])

  const cancelQtyEdit = useCallback(() => {
    setEditingField(null)
    qtyEdit.cancelEdit()
  }, [qtyEdit])

  const cancelAvgEdit = useCallback(() => {
    setEditingField(null)
    avgPriceEdit.cancelEdit()
  }, [avgPriceEdit])

  const saveQty = useCallback(async () => {
    await qtyEdit.save()
    setEditingField(null)
  }, [qtyEdit])

  const saveAvg = useCallback(async () => {
    await avgPriceEdit.save()
    setEditingField(null)
  }, [avgPriceEdit])

  return (
    <Card className={cn('overflow-hidden border-l-4', isPositive ? 'border-l-emerald-500 dark:border-l-emerald-400' : 'border-l-red-500 dark:border-l-red-400')}>
      <CardContent className="p-4">
        {/* Stock Header */}
        <div className="flex items-start gap-3 mb-3 overflow-hidden">
          <div className="shrink-0">
            <StockLogo symbol={stock.symbol} name={stock.name} size="md" />
          </div>
          <div className="flex-1 min-w-0 overflow-hidden">
            <div className="flex justify-between items-start gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-foreground">{stock.symbol}</h3>
                  <ScoreBadge score={stock.dividendScore} label={stock.dividendScoreLabel} />
                </div>
                <p className="text-sm text-muted-foreground truncate" title={stock.name}>
                  {stock.name}
                </p>
              </div>
              {onRemove && (
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={onRemove}
                  disabled={isRemoving}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0 cursor-pointer"
                >
                  {isRemoving ? '...' : t('common.remove')}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Portfolio Position */}
        <Separator className="mb-3" />
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-muted-foreground block text-xs uppercase tracking-wide">{t('stock.qty')}</span>
            {editingField === 'qty' && qtyEdit.isEditing ? (
              <span className="inline-flex items-center gap-1">
                <Input
                  ref={qtyEdit.inputRef}
                  type="number"
                  step="any"
                  min="0.0001"
                  value={qtyEdit.value}
                  onChange={(e) => qtyEdit.setValue(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); saveQty() } else if (e.key === 'Escape') { e.preventDefault(); cancelQtyEdit() } }}
                  disabled={qtyEdit.isSaving}
                  className="w-20 h-7 px-2 text-sm"
                />
                <Button size="icon-xs" onClick={saveQty} disabled={qtyEdit.isSaving}>
                  {qtyEdit.isSaving ? '...' : <Check className="size-3" />}
                </Button>
                <Button variant="secondary" size="icon-xs" onClick={cancelQtyEdit} disabled={qtyEdit.isSaving}>
                  <X className="size-3" />
                </Button>
              </span>
            ) : (
              <span
                onClick={startQtyEdit}
                className="font-semibold text-foreground cursor-pointer hover:text-muted-foreground transition-colors"
                title={t('common.clickToEdit')}
              >
                {holding.quantity}
              </span>
            )}
          </div>
          <div>
            <span className="text-muted-foreground block text-xs uppercase tracking-wide">{t('stock.avgPrice')}</span>
            {editingField === 'avg' && avgPriceEdit.isEditing ? (
              <span className="inline-flex items-center gap-1">
                <Input
                  ref={avgPriceEdit.inputRef}
                  type="number"
                  step="0.01"
                  min="0"
                  value={avgPriceEdit.value}
                  onChange={(e) => avgPriceEdit.setValue(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); saveAvg() } else if (e.key === 'Escape') { e.preventDefault(); cancelAvgEdit() } }}
                  disabled={avgPriceEdit.isSaving}
                  className="w-20 h-7 px-2 text-sm"
                />
                <Button size="icon-xs" onClick={saveAvg} disabled={avgPriceEdit.isSaving}>
                  {avgPriceEdit.isSaving ? '...' : <Check className="size-3" />}
                </Button>
                <Button variant="secondary" size="icon-xs" onClick={cancelAvgEdit} disabled={avgPriceEdit.isSaving}>
                  <X className="size-3" />
                </Button>
              </span>
            ) : (
              <span
                onClick={startAvgEdit}
                className="font-semibold text-foreground cursor-pointer hover:text-muted-foreground transition-colors"
                title={t('common.clickToEdit')}
              >
                ${holding.averagePrice.toFixed(2)}
              </span>
            )}
          </div>
          <div>
            <span className="text-muted-foreground block text-xs uppercase tracking-wide">{t('stock.marketValue')}</span>
            <span className="font-semibold text-foreground">${holding.marketValue.toFixed(2)}</span>
          </div>
          <div>
            <span className="text-muted-foreground block text-xs uppercase tracking-wide">{t('stock.gainLoss')}</span>
            <span className={cn('font-semibold', isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400')}>
              ${holding.gainLoss.toFixed(2)} ({holding.gainLossPercent.toFixed(1)}%)
            </span>
          </div>
        </div>

        {(qtyEdit.error || avgPriceEdit.error) && (
          <p className="mt-2 text-xs text-destructive">{qtyEdit.error || avgPriceEdit.error}</p>
        )}

        {/* Current Price */}
        <div className="mt-2">
          <span className="text-muted-foreground text-xs uppercase tracking-wide">{t('stock.current')}: </span>
          <span className="text-sm font-semibold text-foreground">{stock.formattedPrice}</span>
        </div>

        {/* Financial Metrics */}
        <Separator className="my-3" />
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">PER:</span>
            <span className="text-foreground font-medium">{stock.formattedPeRatio}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">EPS:</span>
            <span className="text-foreground font-medium">{stock.formattedEps}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Div:</span>
            <span className="text-foreground font-medium">{stock.formattedDividend}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Yield:</span>
            <span className="text-foreground font-medium">{stock.formattedDividendYield}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Payout:</span>
            <span className="text-foreground font-medium">{stock.formattedPayoutRatio}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">MA50:</span>
            <span className="text-foreground font-medium">{stock.formattedMa50}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">MA200:</span>
            <span className="text-foreground font-medium">{stock.formattedMa200}</span>
          </div>
        </div>

        {/* Dividend Schedule */}
        {stock.dividendScheduleAvailable && (
          <>
            <Separator className="my-3" />
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground uppercase tracking-wide">{t('stock.dividends')}</span>
              <DividendMonthGrid paymentMonths={stock.paymentMonths} shiftedPaymentMonths={stock.shiftedPaymentMonths} size="md" />
            </div>
          </>
        )}

        {/* 52-Week Range */}
        {stock.fiftyTwoWeekDataAvailable && (
          <>
            <Separator className="my-3" />
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground uppercase tracking-wide shrink-0">{t('stock.fiftyTwoWeek')}</span>
              <FiftyTwoWeekRange
                low={stock.formattedFiftyTwoWeekLow}
                high={stock.formattedFiftyTwoWeekHigh}
                position={stock.fiftyTwoWeekRangePosition}
              />
            </div>
          </>
        )}

        {/* AI Summary */}
        <StockAiSummary stockId={stock.id} />
      </CardContent>
    </Card>
  )
}
