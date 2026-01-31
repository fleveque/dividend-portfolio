/**
 * CartSummaryBar - Fixed bottom bar showing cart summary
 *
 * Features:
 * - Shows total items and cost
 * - Click to open CartDrawer
 * - Indicates unsaved changes
 * - Mobile-friendly with safe area padding
 */

import { useBuyPlanContext } from '../contexts/BuyPlanContext'

interface CartSummaryBarProps {
  onOpenDrawer: () => void
}

export function CartSummaryBar({ onOpenDrawer }: CartSummaryBarProps) {
  const { isActive, items, totalItems, formattedTotal, isDirty } = useBuyPlanContext()

  // Don't show if not in buy plan mode or cart is empty
  if (!isActive || items.length === 0) {
    return null
  }

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-40 bg-theme-base border-t border-theme
                 shadow-lg safe-area-bottom cursor-pointer"
      onClick={onOpenDrawer}
    >
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Cart info */}
          <div className="flex items-center gap-3">
            {/* Cart icon with badge */}
            <div className="relative">
              <svg
                className="w-6 h-6 text-theme-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              <span
                className="absolute -top-2 -right-2 w-5 h-5 bg-brand text-white text-xs
                           font-bold rounded-full flex items-center justify-center"
              >
                {items.length}
              </span>
            </div>

            {/* Summary text */}
            <div>
              <p className="text-sm font-medium text-theme-primary">
                {totalItems} share{totalItems !== 1 ? 's' : ''} in {items.length} stock
                {items.length !== 1 ? 's' : ''}
              </p>
              <p className="text-xs text-theme-muted">
                Est. total: {formattedTotal}
                {isDirty && (
                  <span className="text-amber-500 dark:text-amber-400 ml-2">
                    (unsaved)
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* View cart button */}
          <div className="flex items-center gap-2 text-brand font-medium">
            <span className="text-sm hidden sm:inline">View Cart</span>
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  )
}
