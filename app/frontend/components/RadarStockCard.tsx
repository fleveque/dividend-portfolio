/**
 * RadarStockCard - Component demonstrating advanced patterns
 *
 * This component shows:
 * 1. Using Context (useAuth) for auth state
 * 2. Using Custom Hooks (useInlineEdit) for editing logic
 * 3. Conditional rendering based on state
 * 4. Handling async operations with loading/error states
 */

import { useInlineEdit } from '../hooks/useInlineEdit'
import { radarApi } from '../lib/api'
import type { RadarStock } from '../types'

interface RadarStockCardProps {
  stock: RadarStock
  onRemove?: () => void
  onUpdate?: () => void
}

export function RadarStockCard({ stock, onRemove, onUpdate }: RadarStockCardProps) {
  /**
   * useInlineEdit hook manages all the editing state and logic.
   * We just need to:
   * 1. Provide the initial value
   * 2. Provide the save function
   * 3. Use the returned state/handlers in our JSX
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
      const price = newValue === '' ? null : parseFloat(newValue)
      await radarApi.updateTargetPrice(stock.id, price)
    },
    onSuccess: () => {
      // Notify parent to refresh data if needed
      onUpdate?.()
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
            className="text-red-500 hover:text-red-700 text-sm"
            title="Remove from radar"
          >
            Remove
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
