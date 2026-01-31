/**
 * Buy Plan Context
 *
 * Manages the buy plan mode state and cart operations.
 * This context handles:
 * - Buy plan mode toggle (active/inactive)
 * - Local cart state for real-time updates
 * - Syncing with the server via save/reset operations
 * - Tracking dirty state for unsaved changes
 */

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react'
import type { BuyPlanItem, RadarStock } from '../types'
import { useBuyPlan, useSaveBuyPlan, useResetBuyPlan } from '../hooks/useBuyPlanQueries'

interface BuyPlanContextType {
  // Mode state
  isActive: boolean
  enterBuyPlanMode: () => void
  exitBuyPlanMode: () => void

  // Cart items (local state)
  items: BuyPlanItem[]

  // Loading/saving states
  isLoading: boolean
  isSaving: boolean

  // Whether local changes haven't been saved
  isDirty: boolean

  // Cart operations
  addToCart: (stock: RadarStock, quantity: number) => void
  updateQuantity: (stockId: number, quantity: number) => void
  removeFromCart: (stockId: number) => void

  // Persist operations
  saveCart: () => Promise<void>
  resetCart: () => Promise<void>

  // Computed values
  totalItems: number
  totalEstimatedCost: number
  formattedTotal: string
}

const BuyPlanContext = createContext<BuyPlanContextType | undefined>(undefined)

export function BuyPlanProvider({ children }: { children: ReactNode }) {
  // Mode state
  const [isActive, setIsActive] = useState(false)

  // Local cart items (editable without saving)
  const [items, setItems] = useState<BuyPlanItem[]>([])

  // Track if we have unsaved changes
  const [isDirty, setIsDirty] = useState(false)

  // React Query hooks
  const { isLoading: isLoadingFromServer, refetch } = useBuyPlan()
  const saveMutation = useSaveBuyPlan()
  const resetMutation = useResetBuyPlan()

  // Sync local items with server data when entering buy plan mode
  const enterBuyPlanMode = useCallback(async () => {
    setIsActive(true)
    // Refetch from server to ensure we have latest data
    const result = await refetch()
    if (result.data) {
      setItems(result.data.items)
      setIsDirty(false)
    }
  }, [refetch])

  const exitBuyPlanMode = useCallback(() => {
    setIsActive(false)
  }, [])

  // Add a stock to the cart
  const addToCart = useCallback((stock: RadarStock, quantity: number) => {
    setItems((current) => {
      // Check if already in cart
      const existing = current.find((item) => item.stockId === stock.id)
      if (existing) {
        // Update quantity
        return current.map((item) =>
          item.stockId === stock.id
            ? {
                ...item,
                quantity: item.quantity + quantity,
                subtotal: stock.price ? stock.price * (item.quantity + quantity) : null,
                formattedSubtotal: stock.price
                  ? formatCurrency(stock.price * (item.quantity + quantity))
                  : 'N/A',
              }
            : item
        )
      }

      // Add new item
      const subtotal = stock.price ? stock.price * quantity : null
      return [
        ...current,
        {
          stockId: stock.id,
          symbol: stock.symbol,
          name: stock.name,
          quantity,
          currentPrice: stock.price,
          formattedPrice: stock.formattedPrice,
          subtotal,
          formattedSubtotal: subtotal ? formatCurrency(subtotal) : 'N/A',
        },
      ]
    })
    setIsDirty(true)
  }, [])

  // Update quantity for an existing item
  const updateQuantity = useCallback(
    (stockId: number, quantity: number) => {
      if (quantity < 1) {
        removeFromCart(stockId)
        return
      }

      setItems((current) =>
        current.map((item) => {
          if (item.stockId !== stockId) return item

          const subtotal = item.currentPrice ? item.currentPrice * quantity : null
          return {
            ...item,
            quantity,
            subtotal,
            formattedSubtotal: subtotal ? formatCurrency(subtotal) : 'N/A',
          }
        })
      )
      setIsDirty(true)
    },
    []
  )

  // Remove an item from the cart
  const removeFromCart = useCallback((stockId: number) => {
    setItems((current) => current.filter((item) => item.stockId !== stockId))
    setIsDirty(true)
  }, [])

  // Save cart to server
  const saveCart = useCallback(async () => {
    const itemsToSave = items.map((item) => ({
      stockId: item.stockId,
      quantity: item.quantity,
    }))
    await saveMutation.mutateAsync(itemsToSave)
    setIsDirty(false)
  }, [items, saveMutation])

  // Reset cart (clear all items on server)
  const resetCart = useCallback(async () => {
    await resetMutation.mutateAsync()
    setItems([])
    setIsDirty(false)
  }, [resetMutation])

  // Computed values
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
  const totalEstimatedCost = items.reduce((sum, item) => sum + (item.subtotal || 0), 0)
  const formattedTotal = formatCurrency(totalEstimatedCost)

  const value: BuyPlanContextType = {
    isActive,
    enterBuyPlanMode,
    exitBuyPlanMode,
    items,
    isLoading: isLoadingFromServer,
    isSaving: saveMutation.isPending || resetMutation.isPending,
    isDirty,
    addToCart,
    updateQuantity,
    removeFromCart,
    saveCart,
    resetCart,
    totalItems,
    totalEstimatedCost,
    formattedTotal,
  }

  return <BuyPlanContext.Provider value={value}>{children}</BuyPlanContext.Provider>
}

export function useBuyPlanContext(): BuyPlanContextType {
  const context = useContext(BuyPlanContext)

  if (context === undefined) {
    throw new Error('useBuyPlanContext must be used within a BuyPlanProvider')
  }

  return context
}

// Helper function to format currency
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value)
}
