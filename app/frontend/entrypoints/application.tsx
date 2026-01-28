/**
 * Application Entry Point (TypeScript)
 *
 * TypeScript in Entry Points:
 * ==========================
 * - Type safety for DOM operations
 * - Explicit types for sample data
 * - Better error messages during development
 */

import { createRoot } from 'react-dom/client'
import StockCard from '../components/StockCard'
import { Stock } from '../types'

/**
 * Sample data with explicit type annotation
 *
 * `const sampleStock: Stock` tells TypeScript:
 * - This object must match the Stock interface
 * - If you forget a required property, you get an error
 * - If you add an unknown property, you get an error
 *
 * Try removing `price` - you'll see a type error!
 */
const sampleStock: Stock = {
  id: 1,
  symbol: 'AAPL',
  name: 'Apple Inc.',
  price: 178.50,
  formattedPrice: '$178.50'
}

/**
 * DOM element with type narrowing
 *
 * `document.getElementById()` returns `HTMLElement | null`
 * The `if (container)` check "narrows" the type to just `HTMLElement`
 * This is called a "type guard"
 */
const container = document.getElementById('react-root')

if (container) {
  // Inside this block, TypeScript knows container is HTMLElement (not null)
  const root = createRoot(container)
  root.render(<StockCard stock={sampleStock} />)
  console.log('React mounted successfully with TypeScript!')
}
