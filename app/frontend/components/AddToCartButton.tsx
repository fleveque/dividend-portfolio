/**
 * AddToCartButton - Quantity input with add/update controls
 *
 * Shows different states:
 * - Not in cart: quantity input + Add button
 * - In cart: quantity input + Update/Remove buttons
 */

import { useState } from 'react'
import type { RadarStock } from '../types'
import { useBuyPlanContext } from '../contexts/BuyPlanContext'

interface AddToCartButtonProps {
  stock: RadarStock
}

export function AddToCartButton({ stock }: AddToCartButtonProps) {
  const { items, addToCart, updateQuantity, removeFromCart } = useBuyPlanContext()
  const [localQuantity, setLocalQuantity] = useState(1)

  const cartItem = items.find((item) => item.stockId === stock.id)
  const isInCart = !!cartItem

  const handleAdd = () => {
    addToCart(stock, localQuantity)
    setLocalQuantity(1)
  }

  const handleIncrement = () => {
    if (cartItem) {
      updateQuantity(stock.id, cartItem.quantity + 1)
    }
  }

  const handleDecrement = () => {
    if (cartItem && cartItem.quantity > 1) {
      updateQuantity(stock.id, cartItem.quantity - 1)
    }
  }

  const handleRemove = () => {
    removeFromCart(stock.id)
  }

  if (isInCart) {
    // Already in cart - show quantity controls
    return (
      <div className="flex items-center gap-2">
        {/* Quantity stepper */}
        <div className="flex items-center border border-theme rounded-lg overflow-hidden">
          <button
            onClick={handleDecrement}
            disabled={cartItem.quantity <= 1}
            className="w-8 h-8 flex items-center justify-center
                       text-theme-primary hover:bg-theme-accent
                       disabled:text-theme-muted disabled:cursor-not-allowed
                       transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </button>
          <span className="w-10 text-center text-sm font-medium text-theme-primary">
            {cartItem.quantity}
          </span>
          <button
            onClick={handleIncrement}
            className="w-8 h-8 flex items-center justify-center
                       text-theme-primary hover:bg-theme-accent
                       transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>

        {/* Remove button */}
        <button
          onClick={handleRemove}
          className="p-2 text-red-500 hover:text-red-700 dark:hover:text-red-400
                     transition-colors cursor-pointer"
          title="Remove from cart"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    )
  }

  // Not in cart - show add controls
  return (
    <div className="flex items-center gap-2">
      {/* Quantity input */}
      <input
        type="number"
        min="1"
        value={localQuantity}
        onChange={(e) => setLocalQuantity(Math.max(1, parseInt(e.target.value) || 1))}
        className="w-16 px-2 py-1.5 text-center text-sm border border-theme rounded-lg
                   bg-theme-base text-theme-primary
                   focus:ring-2 focus:ring-primary-500 focus:border-transparent"
      />

      {/* Add button */}
      <button
        onClick={handleAdd}
        className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium
                   bg-emerald-500 text-white rounded-lg
                   hover:bg-emerald-600 dark:hover:bg-emerald-400
                   transition-colors cursor-pointer"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        <span className="hidden sm:inline">Add</span>
      </button>
    </div>
  )
}
