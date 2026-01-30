/**
 * RadarStockCard - Stock card with target price editing for radar
 *
 * Features:
 * - Company logo with fallback
 * - Inline target price editing
 * - Visual status indicators (below/above/at target)
 * - Theme-aware styling
 */

import { useInlineEdit } from '../hooks/useInlineEdit'
import { useUpdateTargetPrice } from '../hooks/useRadarQueries'
import { StockLogo } from './StockLogo'
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

  // Determine card border color based on price status
  const getStatusClasses = () => {
    if (stock.belowTarget) {
      return 'border-l-4 border-l-emerald-500 dark:border-l-emerald-400'
    }
    if (stock.aboveTarget) {
      return 'border-l-4 border-l-red-500 dark:border-l-red-400'
    }
    return 'border-l-4 border-l-gray-300 dark:border-l-gray-600'
  }

  return (
    <div className={`card p-4 ${getStatusClasses()}`}>
      {/* Stock Header */}
      <div className="flex items-start gap-3 mb-3">
        {/* Logo */}
        <StockLogo symbol={stock.symbol} name={stock.name} size="md" />

        {/* Stock Info */}
        <div className="flex-1 min-w-0 overflow-hidden">
          <div className="flex justify-between items-start gap-2">
            <div className="min-w-0 flex-1">
              <h3 className="text-lg font-bold text-theme-primary">{stock.symbol}</h3>
              <p className="text-sm text-theme-secondary truncate" title={stock.name}>
                {stock.name}
              </p>
            </div>

            {/* Remove Button */}
            {onRemove && (
              <button
                onClick={onRemove}
                disabled={isRemoving}
                className="text-red-500 hover:text-red-700 dark:hover:text-red-400 text-xs
                           disabled:text-red-300 dark:disabled:text-red-800 transition-colors
                           shrink-0 whitespace-nowrap"
                title="Remove from radar"
              >
                {isRemoving ? '...' : 'Remove'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Price Information */}
      <div className="grid grid-cols-2 gap-3 text-sm border-t border-theme pt-3">
        <div>
          <span className="text-theme-muted block text-xs uppercase tracking-wide">Current</span>
          <span className="font-semibold text-theme-primary">{stock.formattedPrice}</span>
        </div>

        {/* Target Price - Inline Editable */}
        <div>
          <span className="text-theme-muted block text-xs uppercase tracking-wide">Target</span>
          {isEditing ? (
            <span className="inline-flex items-center gap-1">
              <input
                ref={inputRef}
                type="number"
                step="0.01"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isSaving}
                className="w-20 px-2 py-1 border border-theme rounded-lg text-sm
                           bg-theme-base text-theme-primary
                           focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="0.00"
              />
              <button
                onClick={save}
                disabled={isSaving}
                className="p-1.5 bg-emerald-500 text-white rounded-lg text-xs
                           hover:bg-emerald-600 disabled:bg-emerald-300 dark:disabled:bg-emerald-800
                           transition-colors"
              >
                {isSaving ? '...' : '✓'}
              </button>
              <button
                onClick={cancelEdit}
                disabled={isSaving}
                className="p-1.5 bg-gray-500 text-white rounded-lg text-xs
                           hover:bg-gray-600 disabled:bg-gray-300 dark:disabled:bg-gray-700
                           transition-colors"
              >
                ✕
              </button>
            </span>
          ) : (
            <span
              onClick={startEdit}
              className="font-semibold text-theme-primary cursor-pointer
                         hover:text-brand transition-colors"
              title="Click to edit"
            >
              {stock.formattedTargetPrice}
            </span>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <p className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p>
      )}

      {/* Financial Metrics */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs border-t border-theme pt-3 mt-3">
        <div className="flex justify-between">
          <span className="text-theme-muted">PER:</span>
          <span className="text-theme-primary font-medium">{stock.formattedPeRatio}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-theme-muted">EPS:</span>
          <span className="text-theme-primary font-medium">{stock.formattedEps}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-theme-muted">Div:</span>
          <span className="text-theme-primary font-medium">{stock.formattedDividend}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-theme-muted">Yield:</span>
          <span className="text-theme-primary font-medium">{stock.formattedDividendYield}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-theme-muted">Payout:</span>
          <span className="text-theme-primary font-medium">{stock.formattedPayoutRatio}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-theme-muted">MA50:</span>
          <span className="text-theme-primary font-medium">{stock.formattedMa50}</span>
        </div>
        <div className="col-span-2 flex justify-between">
          <span className="text-theme-muted">MA200:</span>
          <span className="text-theme-primary font-medium">{stock.formattedMa200}</span>
        </div>
      </div>

      {/* Status Indicator */}
      {stock.percentageDifference && (
        <div className="mt-3 pt-3 border-t border-theme">
          {stock.belowTarget && (
            <span className="badge badge-success">
              ↓ {stock.percentageDifference} below target
            </span>
          )}
          {stock.aboveTarget && (
            <span className="badge badge-danger">
              ↑ {stock.percentageDifference} above target
            </span>
          )}
          {stock.atTarget && (
            <span className="badge bg-theme-muted text-theme-secondary">
              At target price
            </span>
          )}
        </div>
      )}
    </div>
  )
}

export default RadarStockCard
