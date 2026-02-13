import { Check, X } from 'lucide-react'
import { useInlineEdit } from '../hooks/useInlineEdit'
import { useUpdateTargetPrice } from '../hooks/useRadarQueries'
import { StockLogo } from './StockLogo'
import { DividendMonthGrid } from './DividendMonthGrid'
import { FiftyTwoWeekRange } from './FiftyTwoWeekRange'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { ScoreBadge } from './ScoreBadge'
import type { RadarStock } from '../types'

interface RadarStockCardProps {
  stock: RadarStock
  onRemove?: () => void
  isRemoving?: boolean
}

export function RadarStockCard({ stock, onRemove, isRemoving }: RadarStockCardProps) {
  const updateTargetPrice = useUpdateTargetPrice()

  const {
    isEditing,
    value,
    error,
    isSaving,
    startEdit,
    cancelEdit,
    setValue,
    save,
    inputRef,
    handleKeyDown,
  } = useInlineEdit({
    initialValue: stock.targetPrice?.toString() ?? '',
    onSave: async (newValue) => {
      const price = newValue === '' ? 0 : parseFloat(newValue)
      await updateTargetPrice.mutateAsync({ stockId: stock.id, price })
    },
  })

  const getStatusBorder = () => {
    if (stock.belowTarget) return 'border-l-4 border-l-emerald-500 dark:border-l-emerald-400'
    if (stock.aboveTarget) return 'border-l-4 border-l-red-500 dark:border-l-red-400'
    return 'border-l-4 border-l-muted'
  }

  return (
    <Card className={cn('overflow-hidden', getStatusBorder())}>
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
                  {isRemoving ? '...' : 'Remove'}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Price Information */}
        <Separator className="mb-3" />
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-muted-foreground block text-xs uppercase tracking-wide">Current</span>
            <span className="font-semibold text-foreground">{stock.formattedPrice}</span>
          </div>
          <div>
            <span className="text-muted-foreground block text-xs uppercase tracking-wide">Target</span>
            {isEditing ? (
              <span className="inline-flex items-center gap-1">
                <Input
                  ref={inputRef}
                  type="number"
                  step="0.01"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isSaving}
                  className="w-20 h-7 px-2 text-sm"
                  placeholder="0.00"
                />
                <Button size="icon-xs" onClick={save} disabled={isSaving}>
                  {isSaving ? '...' : <Check className="size-3" />}
                </Button>
                <Button variant="secondary" size="icon-xs" onClick={cancelEdit} disabled={isSaving}>
                  <X className="size-3" />
                </Button>
              </span>
            ) : (
              <span
                onClick={startEdit}
                className="font-semibold text-foreground cursor-pointer hover:text-muted-foreground transition-colors"
                title="Click to edit"
              >
                {stock.formattedTargetPrice}
              </span>
            )}
          </div>
        </div>

        {error && (
          <p className="mt-2 text-xs text-destructive">{error}</p>
        )}

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
              <span className="text-xs text-muted-foreground uppercase tracking-wide">Dividends</span>
              <DividendMonthGrid paymentMonths={stock.paymentMonths} shiftedPaymentMonths={stock.shiftedPaymentMonths} size="md" />
            </div>
          </>
        )}

        {/* 52-Week Range */}
        {stock.fiftyTwoWeekDataAvailable && (
          <>
            <Separator className="my-3" />
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground uppercase tracking-wide shrink-0">52W</span>
              <FiftyTwoWeekRange
                low={stock.formattedFiftyTwoWeekLow}
                high={stock.formattedFiftyTwoWeekHigh}
                position={stock.fiftyTwoWeekRangePosition}
              />
            </div>
          </>
        )}

        {/* Status Indicator */}
        <Separator className="my-3" />
        {stock.percentageDifference ? (
          <>
            {stock.belowTarget && (
              <Badge variant="success">
                ↓ {stock.percentageDifference} below target
              </Badge>
            )}
            {stock.aboveTarget && (
              <Badge variant="destructive">
                ↑ {stock.percentageDifference} above target
              </Badge>
            )}
            {stock.atTarget && (
              <Badge variant="secondary">
                At target price
              </Badge>
            )}
          </>
        ) : (
          <Badge variant="outline">No target set</Badge>
        )}
      </CardContent>
    </Card>
  )
}

export default RadarStockCard
