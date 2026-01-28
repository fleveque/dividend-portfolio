/**
 * RadarStockCard - Component demonstrating advanced patterns
 *
 * Phase 10: React Query Integration
 * =================================
 *
 * This component now uses:
 * - useUpdateTargetPrice mutation (React Query)
 * - useInlineEdit custom hook for editing UI logic
 *
 * When target price is saved:
 * 1. useUpdateTargetPrice.mutate() calls the API
 * 2. On success, it invalidates the ['radar'] query
 * 3. React Query automatically refetches the radar
 * 4. Component re-renders with updated data
 */

import { useInlineEdit } from '../hooks/useInlineEdit'
import { useUpdateTargetPrice } from '../hooks/useRadarQueries'
import type { RadarStock } from '../types'

interface RadarStockCardProps {
  stock: RadarStock
  onRemove?: () => void
  isRemoving?: boolean
}

export function RadarStockCard({ stock, onRemove, isRemoving }: RadarStockCardProps) {
  // React Query mutation for updating target price
  const updateTargetPrice = useUpdateTargetPrice()

  /**
   * useInlineEdit hook manages all the editing state and logic.
   * Now uses React Query mutation for the save operation.
   */
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
      // Use React Query mutation - it will invalidate radar query on success
      await updateTargetPrice.mutateAsync({ stockId: stock.id, price })
    },
  })

  return (
    <div
      className={`p-4 rounded-lg border-2 ${stock.priceStatusClass} transition-all`}
    >
      {/* Stock Header */}
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="text-lg font-bold">{stock.symbol}</h3>
          <p className="text-sm text-gray-600 truncate" title={stock.name}>
            {stock.name}
          </p>
        </div>

        {/* Remove Button */}
        {onRemove && (
          <button
            onClick={onRemove}
            disabled={isRemoving}
            className="text-red-500 hover:text-red-700 text-sm disabled:text-red-300"
            title="Remove from radar"
          >
            {isRemoving ? 'Removing...' : 'Remove'}
          </button>
        )}
      </div>

      {/* Price Information */}
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <span className="text-gray-500">Current:</span>
          <span className="ml-1 font-semibold">{stock.formattedPrice}</span>
        </div>

        {/* Target Price - Inline Editable */}
        <div>
          <span className="text-gray-500">Target:</span>
          {isEditing ? (
            <span className="ml-1 inline-flex items-center gap-1">
              <input
                ref={inputRef}
                type="number"
                step="0.01"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isSaving}
                className="w-20 px-1 py-0.5 border rounded text-sm focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
              />
              <button
                onClick={save}
                disabled={isSaving}
                className="px-2 py-0.5 bg-green-500 text-white rounded text-xs hover:bg-green-600 disabled:bg-green-300"
              >
                {isSaving ? '...' : '✓'}
              </button>
              <button
                onClick={cancelEdit}
                disabled={isSaving}
                className="px-2 py-0.5 bg-gray-500 text-white rounded text-xs hover:bg-gray-600 disabled:bg-gray-300"
              >
                ✕
              </button>
            </span>
          ) : (
            <span
              onClick={startEdit}
              className="ml-1 font-semibold cursor-pointer hover:text-blue-600"
              title="Click to edit"
            >
              {stock.formattedTargetPrice}
            </span>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <p className="mt-2 text-xs text-red-600">{error}</p>
      )}

      {/* Status Indicator */}
      {stock.percentageDifference && (
        <div className="mt-2 text-xs">
          {stock.belowTarget && (
            <span className="text-green-600">
              ↓ {stock.percentageDifference} below target
            </span>
          )}
          {stock.aboveTarget && (
            <span className="text-red-600">
              ↑ {stock.percentageDifference} above target
            </span>
          )}
          {stock.atTarget && (
            <span className="text-gray-600">At target price</span>
          )}
        </div>
      )}
    </div>
  )
}

export default RadarStockCard
