/**
 * CartDrawer - Full cart view with Save/Reset/Done buttons
 *
 * Features:
 * - Slide-up drawer on mobile
 * - Full cart item list with quantity controls
 * - Save Cart / Reset Cart buttons
 * - Done Planning button to exit mode
 * - Unsaved changes indicator
 */

import { useBuyPlanContext } from '../contexts/BuyPlanContext'
import { StockLogo } from './StockLogo'

interface CartDrawerProps {
  isOpen: boolean
  onClose: () => void
}

export function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const {
    items,
    totalItems,
    formattedTotal,
    isDirty,
    isSaving,
    updateQuantity,
    removeFromCart,
    saveCart,
    resetCart,
    exitBuyPlanMode,
  } = useBuyPlanContext()

  const handleSave = async () => {
    await saveCart()
  }

  const handleReset = async () => {
    const confirmed = window.confirm(
      'This will clear your entire buy plan. Are you sure?'
    )
    if (confirmed) {
      await resetCart()
    }
  }

  const handleDone = () => {
    if (isDirty) {
      const confirmed = window.confirm(
        'You have unsaved changes. Save before exiting?'
      )
      if (confirmed) {
        saveCart().then(() => {
          exitBuyPlanMode()
          onClose()
        })
        return
      }
    }
    exitBuyPlanMode()
    onClose()
  }

  const handleIncrement = (stockId: number, currentQty: number) => {
    updateQuantity(stockId, currentQty + 1)
  }

  const handleDecrement = (stockId: number, currentQty: number) => {
    if (currentQty > 1) {
      updateQuantity(stockId, currentQty - 1)
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/50 transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 bg-theme-base rounded-t-2xl
                   shadow-2xl max-h-[85vh] flex flex-col animate-slide-up
                   safe-area-bottom"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-theme">
          <h2 className="text-lg font-bold text-theme-primary">Your Buy Plan</h2>
          <button
            onClick={onClose}
            className="p-2 text-theme-muted hover:text-theme-primary transition-colors cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {items.length === 0 ? (
            <div className="text-center py-8 text-theme-muted">
              <svg
                className="w-12 h-12 mx-auto mb-3 text-theme-muted"
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
              <p>Your cart is empty</p>
              <p className="text-sm mt-1">Add stocks from your radar to plan purchases</p>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.stockId}
                className="card p-3 overflow-hidden"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  {/* Logo */}
                  <div className="shrink-0">
                    <StockLogo symbol={item.symbol} name={item.name} size="sm" />
                  </div>

                  {/* Stock info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-theme-primary text-sm">{item.symbol}</p>
                    <p className="text-xs text-theme-muted truncate" title={item.name}>{item.name}</p>
                    <p className="text-xs text-theme-secondary mt-1">
                      {item.formattedPrice} × {item.quantity} = {item.formattedSubtotal}
                    </p>
                  </div>

                  {/* Quantity controls */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleDecrement(item.stockId, item.quantity)}
                      disabled={item.quantity <= 1}
                      className="w-8 h-8 flex items-center justify-center rounded-lg
                                 border border-theme text-theme-primary
                                 hover:bg-theme-accent disabled:text-theme-muted
                                 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                      </svg>
                    </button>
                    <span className="w-8 text-center text-sm font-medium text-theme-primary">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => handleIncrement(item.stockId, item.quantity)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg
                                 border border-theme text-theme-primary
                                 hover:bg-theme-accent transition-colors cursor-pointer"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                    <button
                      onClick={() => removeFromCart(item.stockId)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg
                                 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30
                                 transition-colors ml-1 cursor-pointer"
                      title="Remove"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-theme space-y-3">
          {/* Totals */}
          {items.length > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-theme-muted">
                Total: {totalItems} share{totalItems !== 1 ? 's' : ''}
              </span>
              <span className="font-bold text-theme-primary text-lg">
                {formattedTotal}
              </span>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={!isDirty || isSaving}
              className="flex-1 py-2.5 px-4 text-sm font-medium rounded-lg
                         bg-emerald-500 text-white
                         hover:bg-emerald-600 dark:hover:bg-emerald-400
                         disabled:bg-gray-300 dark:disabled:bg-gray-700
                         disabled:text-gray-500 dark:disabled:text-gray-400
                         disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              {isSaving ? 'Saving...' : isDirty ? 'Save Cart' : 'Saved'}
            </button>
            <button
              onClick={handleReset}
              disabled={items.length === 0 || isSaving}
              className="py-2.5 px-4 text-sm font-medium rounded-lg
                         border border-red-300 dark:border-red-700
                         text-red-600 dark:text-red-400
                         hover:bg-red-50 dark:hover:bg-red-900/30
                         disabled:border-gray-200 dark:disabled:border-gray-700
                         disabled:text-gray-400 dark:disabled:text-gray-500
                         disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              Reset
            </button>
          </div>

          {/* Done button */}
          <button
            onClick={handleDone}
            className="w-full py-2.5 px-4 text-sm font-medium rounded-lg
                       border border-theme text-theme-primary
                       hover:bg-theme-accent transition-colors cursor-pointer"
          >
            Done Planning
          </button>
        </div>
      </div>
    </>
  )
}
