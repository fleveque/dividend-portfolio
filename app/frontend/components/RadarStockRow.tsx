/**
 * RadarStockRow - Compact row view for radar stocks
 *
 * Features:
 * - Horizontal single-line layout
 * - Inline target price editing
 * - Visual status indicators
 * - Expandable metrics display
 * - Theme-aware styling
 */

import { useInlineEdit } from '../hooks/useInlineEdit'
import { useUpdateTargetPrice } from '../hooks/useRadarQueries'
import { StockLogo } from './StockLogo'
import type { RadarStock } from '../types'

interface RadarStockRowProps {
  stock: RadarStock
  onRemove?: () => void
  isRemoving?: boolean
  showMetrics?: boolean
}

export function RadarStockRow({ stock, onRemove, isRemoving, showMetrics = false }: RadarStockRowProps) {
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

  // Determine row border color based on price status
  const getStatusClasses = () => {
    if (stock.belowTarget) {
      return 'border-l-4 border-l-emerald-500 dark:border-l-emerald-400'
    }
    if (stock.aboveTarget) {
      return 'border-l-4 border-l-red-500 dark:border-l-red-400'
    }
    return 'border-l-4 border-l-gray-300 dark:border-l-gray-600'
  }

  // Compact badge for status
  const getStatusBadge = () => {
    if (!stock.percentageDifference) return null

    if (stock.belowTarget) {
      return (
        <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
          ↓{stock.percentageDifference}
        </span>
      )
    }
    if (stock.aboveTarget) {
      return (
        <span className="text-xs font-medium text-red-600 dark:text-red-400 whitespace-nowrap">
          ↑{stock.percentageDifference}
        </span>
      )
    }
    if (stock.atTarget) {
      return (
        <span className="text-xs font-medium text-theme-muted whitespace-nowrap">
          At target
        </span>
      )
    }
    return null
  }

  return (
    <div className={`card px-4 py-3 ${getStatusClasses()}`}>
      <div className="flex items-center gap-4">
        {/* Logo */}
        <StockLogo symbol={stock.symbol} name={stock.name} size="sm" />

        {/* Symbol */}
        <span className="font-bold text-theme-primary w-16 shrink-0">
          {stock.symbol}
        </span>

        {/* Name - truncate on overflow */}
        <span
          className="text-sm text-theme-secondary truncate flex-1 min-w-0"
          title={stock.name}
        >
          {stock.name}
        </span>

        {/* Current Price */}
        <span className="font-semibold text-theme-primary w-20 text-right shrink-0">
          {stock.formattedPrice}
        </span>

        {/* Target Price - Inline Editable */}
        <div className="w-24 shrink-0">
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
                className="w-16 px-2 py-1 border border-theme rounded text-sm
                           bg-theme-base text-theme-primary
                           focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="0.00"
              />
              <button
                onClick={save}
                disabled={isSaving}
                className="p-1 bg-emerald-500 text-white rounded text-xs
                           hover:bg-emerald-600 disabled:bg-emerald-300 dark:disabled:bg-emerald-800
                           transition-colors"
              >
                {isSaving ? '...' : '✓'}
              </button>
              <button
                onClick={cancelEdit}
                disabled={isSaving}
                className="p-1 bg-gray-500 text-white rounded text-xs
                           hover:bg-gray-600 disabled:bg-gray-300 dark:disabled:bg-gray-700
                           transition-colors"
              >
                ✕
              </button>
            </span>
          ) : (
            <span
              onClick={startEdit}
              className="text-sm text-theme-secondary cursor-pointer
                         hover:text-brand transition-colors"
              title="Click to edit target"
            >
              {stock.formattedTargetPrice}
            </span>
          )}
        </div>

        {/* Status Badge */}
        <div className="w-16 text-right shrink-0">
          {getStatusBadge()}
        </div>

        {/* Metrics - Only shown when expanded */}
        {showMetrics && (
          <>
            <span className="text-xs text-theme-primary w-14 text-right shrink-0">
              {stock.formattedPeRatio}
            </span>
            <span className="text-xs text-theme-primary w-16 text-right shrink-0">
              {stock.formattedEps}
            </span>
            <span className="text-xs text-theme-primary w-14 text-right shrink-0">
              {stock.formattedDividend}
            </span>
            <span className="text-xs text-theme-primary w-14 text-right shrink-0">
              {stock.formattedDividendYield}
            </span>
            <span className="text-xs text-theme-primary w-14 text-right shrink-0">
              {stock.formattedPayoutRatio}
            </span>
            <span className="text-xs text-theme-primary w-18 text-right shrink-0">
              {stock.formattedMa50}
            </span>
            <span className="text-xs text-theme-primary w-18 text-right shrink-0">
              {stock.formattedMa200}
            </span>
          </>
        )}

        {/* Remove Button */}
        {onRemove && (
          <button
            onClick={onRemove}
            disabled={isRemoving}
            className="text-red-500 hover:text-red-700 dark:hover:text-red-400
                       disabled:text-red-300 dark:disabled:text-red-800
                       transition-colors shrink-0 p-1 cursor-pointer"
            title="Remove from radar"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <p className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  )
}

export default RadarStockRow
