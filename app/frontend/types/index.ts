/**
 * Shared TypeScript Types
 *
 * These interfaces define the "shape" of data in our application.
 * They mirror the Ruby models and decorators, ensuring type safety
 * when passing data between Rails API and React components.
 *
 * Key TypeScript Concepts:
 * - interface: Defines the structure of an object
 * - extends: Inherit properties from another interface
 * - | (union): Value can be one of multiple types
 * - ? (optional): Property may be undefined
 */

/**
 * Base Stock interface
 * Mirrors: Stock model + StockDecorator basic methods
 */
export interface Stock {
  id: number
  symbol: string
  name: string
  price: number | null  // null when price unavailable
  formattedPrice: string  // "$123.45" or "N/A"
  // Financial metrics
  eps: number | null
  peRatio: number | null
  dividend: number | null
  dividendYield: number | null
  payoutRatio: number | null
  ma50: number | null
  ma200: number | null
  // Formatted versions
  formattedEps: string
  formattedPeRatio: string
  formattedDividend: string
  formattedDividendYield: string
  formattedPayoutRatio: string
  formattedMa50: string
  formattedMa200: string
}

/**
 * Stock with radar-specific data
 * Mirrors: RadarStock join model + StockDecorator with target_price
 *
 * `extends Stock` means RadarStock has ALL Stock properties
 * plus the additional ones defined here
 */
export interface RadarStock extends Stock {
  targetPrice: number | null
  formattedTargetPrice: string
  priceStatusClass: string  // Tailwind classes for visual status
  percentageDifference: string | null  // "5.25%" or null
  aboveTarget: boolean
  belowTarget: boolean
  atTarget: boolean
}

/**
 * User interface
 * Mirrors: User model
 */
export interface User {
  id: number
  emailAddress: string
}

/**
 * API Response wrapper
 * All API responses follow this structure
 *
 * Generic type <T> means the `data` field can be any type
 * Usage: ApiResponse<Stock[]> or ApiResponse<User>
 */
export interface ApiResponse<T> {
  success: boolean
  data: T
  error?: string  // Only present when success is false
}

/**
 * Radar data from API
 */
export interface Radar {
  id: number
  stocks: RadarStock[]
}

/**
 * Props interfaces for components
 *
 * Convention: ComponentNameProps
 * These define what props a component accepts
 */
export interface StockCardProps {
  stock: Stock
}

export interface RadarStockCardProps {
  stock: RadarStock
  onRemove?: () => void
  onUpdateTargetPrice?: (price: number) => void
  isLoading?: boolean
}

/**
 * Buy Plan Item
 * Represents a stock in the buy plan cart with quantity
 */
export interface BuyPlanItem {
  stockId: number
  symbol: string
  name: string
  quantity: number
  currentPrice: number | null
  formattedPrice: string
  subtotal: number | null
  formattedSubtotal: string
}

/**
 * Buy Plan Response from API
 */
export interface BuyPlanResponse {
  id: number | null
  items: BuyPlanItem[]
  totalItems: number
  totalEstimatedCost: number
  formattedTotal: string
}
