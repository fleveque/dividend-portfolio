import { useState, useCallback } from 'react'
import { Check, X, ChevronDown } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useInlineEdit } from '../hooks/useInlineEdit'
import { useUpdateHolding } from '../hooks/useHoldingsQueries'
import { StockLogo } from './StockLogo'
import { DividendMonthGrid } from './DividendMonthGrid'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { ScoreBadge } from './ScoreBadge'
import type { Holding } from '../types'

interface PortfolioStockRowProps {
  holding: Holding
  onRemove?: () => void
  isRemoving?: boolean
  showMetrics?: boolean
}

export function PortfolioStockRow({ holding, onRemove, isRemoving, showMetrics = false }: PortfolioStockRowProps) {
  const { t } = useTranslation()
  const [isMobileExpanded, setIsMobileExpanded] = useState(false)
  const [editingField, setEditingField] = useState<'qty' | 'avg' | null>(null)
  const { stock } = holding
  const isPositive = holding.gainLoss >= 0
  const updateHolding = useUpdateHolding()

  const gainLossColor = isPositive
    ? 'text-emerald-600 dark:text-emerald-400'
    : 'text-red-600 dark:text-red-400'

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

  const handleMobileRowClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    if (target.closest('button') || target.closest('input')) return
    setIsMobileExpanded(!isMobileExpanded)
  }

  return (
    <Card className={cn('overflow-hidden border-l-4', isPositive ? 'border-l-emerald-500 dark:border-l-emerald-400' : 'border-l-red-500 dark:border-l-red-400')}>
      <CardContent className="px-4 py-3">
        {/* Desktop Layout */}
        <div className={cn('hidden items-center gap-4 overflow-hidden', showMetrics ? 'xl:flex' : 'md:flex')}>
          <div className="shrink-0">
            <StockLogo symbol={stock.symbol} name={stock.name} size="sm" />
          </div>
          <span className="font-bold text-foreground w-16 shrink-0">{stock.symbol}</span>
          <div className="w-40 shrink min-w-0 overflow-hidden">
            <span className="text-sm text-muted-foreground truncate block" title={stock.name}>{stock.name}</span>
          </div>
          <div className="w-16 shrink-0">
            <ScoreBadge score={stock.dividendScore} label={stock.dividendScoreLabel} />
          </div>
          <span className="font-semibold text-foreground w-20 text-right shrink-0">{stock.formattedPrice}</span>

          {/* Qty - Inline Editable */}
          <div className="w-14 shrink-0 text-right">
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
                  className="w-16 h-7 px-2 text-sm"
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
                className="text-sm text-foreground cursor-pointer hover:text-muted-foreground transition-colors"
                title={t('common.clickToEdit')}
              >
                {holding.quantity}
              </span>
            )}
          </div>

          {/* Avg Price - Inline Editable */}
          <div className="w-20 shrink-0 text-right">
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
                  className="w-16 h-7 px-2 text-sm"
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
                className="text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                title={t('common.clickToEdit')}
              >
                ${holding.averagePrice.toFixed(2)}
              </span>
            )}
          </div>

          <span className={cn('text-sm font-medium w-24 text-right shrink-0', gainLossColor)}>
            {holding.gainLossPercent >= 0 ? '+' : ''}{holding.gainLossPercent.toFixed(1)}%
          </span>

          {showMetrics && (
            <>
              <span className="text-xs text-foreground w-14 text-right shrink-0">{stock.formattedPeRatio}</span>
              <span className="text-xs text-foreground w-16 text-right shrink-0">{stock.formattedEps}</span>
              <span className="text-xs text-foreground w-14 text-right shrink-0">{stock.formattedDividend}</span>
              <span className="text-xs text-foreground w-14 text-right shrink-0">{stock.formattedDividendYield}</span>
              <span className="text-xs text-foreground w-14 text-right shrink-0">{stock.formattedPayoutRatio}</span>
              <span className="text-xs text-foreground w-18 text-right shrink-0">{stock.formattedMa50}</span>
              <span className="text-xs text-foreground w-18 text-right shrink-0">{stock.formattedMa200}</span>
              <div className="w-28 shrink-0 flex justify-end">
                <DividendMonthGrid paymentMonths={stock.paymentMonths} shiftedPaymentMonths={stock.shiftedPaymentMonths} size="sm" />
              </div>
            </>
          )}

          {onRemove && (
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={onRemove}
              disabled={isRemoving}
              className="text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
              title={t('common.remove')}
            >
              <X className="size-4" />
            </Button>
          )}
        </div>

        {/* Mobile Layout */}
        <div className={cn('overflow-hidden', showMetrics ? 'xl:hidden' : 'md:hidden')}>
          <div className="flex items-center gap-3 cursor-pointer overflow-hidden w-full" onClick={handleMobileRowClick}>
            <div className="shrink-0">
              <StockLogo symbol={stock.symbol} name={stock.name} size="sm" />
            </div>
            <div className="flex-1 min-w-0 overflow-hidden">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-foreground text-sm">{stock.symbol}</span>
                <ScoreBadge score={stock.dividendScore} label={stock.dividendScoreLabel} />
              </div>
              <p className="text-xs text-muted-foreground truncate" title={stock.name}>{stock.name}</p>
            </div>
            <div className="text-right shrink-0">
              <div className="font-semibold text-foreground text-sm">{stock.formattedPrice}</div>
              <div className={cn('text-xs font-medium', gainLossColor)}>
                {holding.gainLossPercent >= 0 ? '+' : ''}{holding.gainLossPercent.toFixed(1)}%
              </div>
            </div>
            <ChevronDown className={cn('size-4 shrink-0 text-muted-foreground transition-transform', isMobileExpanded && 'rotate-180')} />
          </div>

          {isMobileExpanded && (
            <div className="mt-3 space-y-3">
              <Separator />
              {/* Position Details - Editable */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t('stock.qty')}:</span>
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
                        className="w-16 h-6 px-1.5 text-xs"
                      />
                      <Button size="icon-xs" onClick={saveQty} disabled={qtyEdit.isSaving}>
                        {qtyEdit.isSaving ? '...' : <Check className="size-3" />}
                      </Button>
                      <Button variant="secondary" size="icon-xs" onClick={cancelQtyEdit} disabled={qtyEdit.isSaving}>
                        <X className="size-3" />
                      </Button>
                    </span>
                  ) : (
                    <button onClick={startQtyEdit} className="text-foreground font-medium cursor-pointer">
                      {holding.quantity} ({t('common.clickToEdit')})
                    </button>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t('stock.avgPrice')}:</span>
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
                        className="w-16 h-6 px-1.5 text-xs"
                      />
                      <Button size="icon-xs" onClick={saveAvg} disabled={avgPriceEdit.isSaving}>
                        {avgPriceEdit.isSaving ? '...' : <Check className="size-3" />}
                      </Button>
                      <Button variant="secondary" size="icon-xs" onClick={cancelAvgEdit} disabled={avgPriceEdit.isSaving}>
                        <X className="size-3" />
                      </Button>
                    </span>
                  ) : (
                    <button onClick={startAvgEdit} className="text-foreground font-medium cursor-pointer">
                      ${holding.averagePrice.toFixed(2)} ({t('common.clickToEdit')})
                    </button>
                  )}
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('stock.marketValue')}:</span>
                  <span className="text-foreground font-medium">${holding.marketValue.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('stock.gainLoss')}:</span>
                  <span className={cn('font-medium', gainLossColor)}>
                    ${holding.gainLoss.toFixed(2)}
                  </span>
                </div>
              </div>

              {(qtyEdit.error || avgPriceEdit.error) && (
                <p className="text-xs text-destructive">{qtyEdit.error || avgPriceEdit.error}</p>
              )}

              <Separator />
              {/* Metrics Grid */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
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
                <div className="col-span-2 flex items-center justify-between">
                  <span className="text-muted-foreground">{t('stock.dividends')}:</span>
                  <DividendMonthGrid paymentMonths={stock.paymentMonths} shiftedPaymentMonths={stock.shiftedPaymentMonths} size="md" />
                </div>
              </div>

              {onRemove && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRemove}
                  disabled={isRemoving}
                  className="w-full text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/10"
                >
                  {isRemoving ? `${t('common.remove')}...` : t('common.remove')}
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
