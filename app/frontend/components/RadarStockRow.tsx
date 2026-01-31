/**
 * RadarStockRow - Compact row view for radar stocks
 *
 * Features:
 * - Horizontal single-line layout on desktop
 * - Mobile-friendly layout with tap-to-expand
 * - Inline target price editing
 * - Visual status indicators
 * - Expandable metrics display
 * - Theme-aware styling
 */

import { useState } from 'react'
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

  // Status icon for mobile view
  const getStatusIcon = () => {
    if (stock.belowTarget) {
      return (
        <svg className="w-5 h-5 text-emerald-500 dark:text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l4.293-4.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      )
    }
    if (stock.aboveTarget) {
      return (
        <svg className="w-5 h-5 text-red-500 dark:text-red-400" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
        </svg>
      )
    }
    return (
      <svg className="w-5 h-5 text-gray-400 dark:text-gray-500" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
      </svg>
    )
  }

  // Compact badge for status (desktop)
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

  const handleMobileRowClick = (e: React.MouseEvent) => {
    // Don't expand if clicking on interactive elements
    const target = e.target as HTMLElement
    if (target.closest('button') || target.closest('input')) {
      return
    }
    setIsMobileExpanded(!isMobileExpanded)
  }

  return (
    <div className={`card px-4 py-3 ${getStatusClasses()}`}>
      {/* Desktop Layout */}
      <div className="hidden md:flex items-center gap-4 overflow-hidden">
        {/* Logo */}
        <div className="shrink-0">
          <StockLogo symbol={stock.symbol} name={stock.name} size="sm" />
        </div>

        {/* Symbol */}
        <span className="font-bold text-theme-primary w-16 shrink-0">
          {stock.symbol}
        </span>

        {/* Name - truncate on overflow */}
        <div className="w-40 shrink min-w-0 overflow-hidden">
          <span
            className="text-sm text-theme-secondary truncate block"
            title={stock.name}
          >
            {stock.name}
          </span>
        </div>

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
                           transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                {isSaving ? '...' : '✓'}
              </button>
              <button
                onClick={cancelEdit}
                disabled={isSaving}
                className="p-1 bg-gray-500 text-white rounded text-xs
                           hover:bg-gray-600 disabled:bg-gray-300 dark:disabled:bg-gray-700
                           transition-colors cursor-pointer disabled:cursor-not-allowed"
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

      {/* Mobile Layout */}
      <div className="md:hidden overflow-hidden">
        {/* Main row - tappable to expand */}
        <div
          className="flex items-center gap-3 cursor-pointer overflow-hidden w-full"
          onClick={handleMobileRowClick}
        >
          {/* Logo */}
          <div className="shrink-0">
            <StockLogo symbol={stock.symbol} name={stock.name} size="sm" />
          </div>

          {/* Symbol & Name */}
          <div className="flex-1 min-w-0 overflow-hidden">
            <span className="font-bold text-theme-primary text-sm">{stock.symbol}</span>
            <p className="text-xs text-theme-muted truncate" title={stock.name}>{stock.name}</p>
          </div>

          {/* Prices */}
          <div className="text-right shrink-0">
            <div className="font-semibold text-theme-primary text-sm">
              {stock.formattedPrice}
            </div>
            <div className="text-xs text-theme-muted">
              {stock.formattedTargetPrice}
            </div>
          </div>

          {/* Status Icon */}
          <div className="shrink-0">
            {getStatusIcon()}
          </div>

          {/* Expand indicator */}
          <svg
            className={`w-4 h-4 shrink-0 text-theme-muted transition-transform ${isMobileExpanded ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>

        {/* Expanded content */}
        {isMobileExpanded && (
          <div className="mt-3 pt-3 border-t border-theme space-y-3">
            {/* Target Price Edit */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-theme-muted uppercase tracking-wide">Target Price</span>
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
                    className="w-20 px-2 py-1 border border-theme rounded text-sm
                               bg-theme-base text-theme-primary
                               focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                  <button
                    onClick={save}
                    disabled={isSaving}
                    className="p-1.5 bg-emerald-500 text-white rounded text-xs
                               hover:bg-emerald-600 disabled:bg-emerald-300 dark:disabled:bg-emerald-800
                               transition-colors cursor-pointer disabled:cursor-not-allowed"
                  >
                    {isSaving ? '...' : '✓'}
                  </button>
                  <button
                    onClick={cancelEdit}
                    disabled={isSaving}
                    className="p-1.5 bg-gray-500 text-white rounded text-xs
                               hover:bg-gray-600 disabled:bg-gray-300 dark:disabled:bg-gray-700
                               transition-colors cursor-pointer disabled:cursor-not-allowed"
                  >
                    ✕
                  </button>
                </span>
              ) : (
                <button
                  onClick={startEdit}
                  className="text-sm text-brand font-medium cursor-pointer"
                >
                  {stock.formattedTargetPrice} (tap to edit)
                </button>
              )}
            </div>

            {/* Status Badge */}
            {stock.percentageDifference && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-theme-muted uppercase tracking-wide">Status</span>
                {stock.belowTarget && (
                  <span className="badge badge-success text-xs">
                    ↓ {stock.percentageDifference} below target
                  </span>
                )}
                {stock.aboveTarget && (
                  <span className="badge badge-danger text-xs">
                    ↑ {stock.percentageDifference} above target
                  </span>
                )}
                {stock.atTarget && (
                  <span className="badge bg-theme-muted text-theme-secondary text-xs">
                    At target price
                  </span>
                )}
              </div>
            )}

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
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

            {/* Remove Button */}
            {onRemove && (
              <button
                onClick={onRemove}
                disabled={isRemoving}
                className="w-full py-2 text-sm text-red-500 hover:text-red-700
                           dark:hover:text-red-400 disabled:text-red-300
                           dark:disabled:text-red-800 transition-colors
                           border border-red-200 dark:border-red-800 rounded-lg
                           cursor-pointer disabled:cursor-not-allowed"
              >
                {isRemoving ? 'Removing...' : 'Remove from Radar'}
              </button>
            )}
          </div>
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
