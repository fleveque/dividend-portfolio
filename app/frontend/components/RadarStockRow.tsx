import { useState } from 'react'
import { Check, X, ChevronDown, ArrowDown, ArrowUp, Minus as MinusIcon } from 'lucide-react'
import { useInlineEdit } from '../hooks/useInlineEdit'
import { useUpdateTargetPrice } from '../hooks/useRadarQueries'
import { StockLogo } from './StockLogo'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import type { RadarStock } from '../types'

interface RadarStockRowProps {
  stock: RadarStock
  onRemove?: () => void
  isRemoving?: boolean
  showMetrics?: boolean
  actionSlot?: React.ReactNode
}

export function RadarStockRow({ stock, onRemove, isRemoving, showMetrics = false, actionSlot }: RadarStockRowProps) {
  const [isMobileExpanded, setIsMobileExpanded] = useState(false)
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

  const getStatusIcon = () => {
    if (stock.belowTarget) return <ArrowDown className="size-5 text-emerald-500 dark:text-emerald-400" />
    if (stock.aboveTarget) return <ArrowUp className="size-5 text-red-500 dark:text-red-400" />
    return <MinusIcon className="size-5 text-muted-foreground" />
  }

  const getStatusBadge = () => {
    if (!stock.percentageDifference) return null
    if (stock.belowTarget) {
      return <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 whitespace-nowrap">↓{stock.percentageDifference}</span>
    }
    if (stock.aboveTarget) {
      return <span className="text-xs font-medium text-red-600 dark:text-red-400 whitespace-nowrap">↑{stock.percentageDifference}</span>
    }
    if (stock.atTarget) {
      return <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">At target</span>
    }
    return null
  }

  const handleMobileRowClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    if (target.closest('button') || target.closest('input')) return
    setIsMobileExpanded(!isMobileExpanded)
  }

  return (
    <Card className={cn('overflow-hidden', getStatusBorder())}>
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
          <span className="font-semibold text-foreground w-20 text-right shrink-0">{stock.formattedPrice}</span>

          {/* Target Price - Inline Editable */}
          <div className="w-24 shrink-0">
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
                  className="w-16 h-7 px-2 text-sm"
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
                className="text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                title="Click to edit target"
              >
                {stock.formattedTargetPrice}
              </span>
            )}
          </div>

          <div className="w-16 text-right shrink-0">{getStatusBadge()}</div>

          {showMetrics && (
            <>
              <span className="text-xs text-foreground w-14 text-right shrink-0">{stock.formattedPeRatio}</span>
              <span className="text-xs text-foreground w-16 text-right shrink-0">{stock.formattedEps}</span>
              <span className="text-xs text-foreground w-14 text-right shrink-0">{stock.formattedDividend}</span>
              <span className="text-xs text-foreground w-14 text-right shrink-0">{stock.formattedDividendYield}</span>
              <span className="text-xs text-foreground w-14 text-right shrink-0">{stock.formattedPayoutRatio}</span>
              <span className="text-xs text-foreground w-18 text-right shrink-0">{stock.formattedMa50}</span>
              <span className="text-xs text-foreground w-18 text-right shrink-0">{stock.formattedMa200}</span>
            </>
          )}

          {onRemove && (
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={onRemove}
              disabled={isRemoving}
              className="text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
              title="Remove from radar"
            >
              <X className="size-4" />
            </Button>
          )}

          {actionSlot && <div className="shrink-0">{actionSlot}</div>}
        </div>

        {/* Mobile Layout */}
        <div className={cn('overflow-hidden', showMetrics ? 'xl:hidden' : 'md:hidden')}>
          <div className="flex items-center gap-3 cursor-pointer overflow-hidden w-full" onClick={handleMobileRowClick}>
            <div className="shrink-0">
              <StockLogo symbol={stock.symbol} name={stock.name} size="sm" />
            </div>
            <div className="flex-1 min-w-0 overflow-hidden">
              <span className="font-bold text-foreground text-sm">{stock.symbol}</span>
              <p className="text-xs text-muted-foreground truncate" title={stock.name}>{stock.name}</p>
            </div>
            <div className="text-right shrink-0">
              <div className="font-semibold text-foreground text-sm">{stock.formattedPrice}</div>
              <div className="text-xs text-muted-foreground">{stock.formattedTargetPrice}</div>
            </div>
            <div className="shrink-0">{getStatusIcon()}</div>
            <ChevronDown className={cn('size-4 shrink-0 text-muted-foreground transition-transform', isMobileExpanded && 'rotate-180')} />
          </div>

          {isMobileExpanded && (
            <div className="mt-3 space-y-3">
              <Separator />
              {/* Target Price Edit */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground uppercase tracking-wide">Target Price</span>
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
                  <button
                    onClick={startEdit}
                    className="text-sm text-foreground font-medium cursor-pointer"
                  >
                    {stock.formattedTargetPrice} (tap to edit)
                  </button>
                )}
              </div>

              {/* Status Badge */}
              {stock.percentageDifference && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground uppercase tracking-wide">Status</span>
                  {stock.belowTarget && <Badge variant="success" className="text-xs">↓ {stock.percentageDifference} below target</Badge>}
                  {stock.aboveTarget && <Badge variant="destructive" className="text-xs">↑ {stock.percentageDifference} above target</Badge>}
                  {stock.atTarget && <Badge variant="secondary" className="text-xs">At target price</Badge>}
                </div>
              )}

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
                <div className="col-span-2 flex justify-between">
                  <span className="text-muted-foreground">MA200:</span>
                  <span className="text-foreground font-medium">{stock.formattedMa200}</span>
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
                  {isRemoving ? 'Removing...' : 'Remove from Radar'}
                </Button>
              )}
            </div>
          )}
        </div>

        {error && (
          <p className="mt-2 text-xs text-destructive">{error}</p>
        )}
      </CardContent>
    </Card>
  )
}

export default RadarStockRow
