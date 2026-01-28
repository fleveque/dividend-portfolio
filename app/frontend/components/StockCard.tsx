/**
 * StockCard - A typed React component
 *
 * TypeScript Key Concepts Demonstrated:
 * =====================================
 *
 * 1. IMPORTS FROM TYPE FILE
 *    import { Stock, StockCardProps } from '../types'
 *    - Centralizes type definitions
 *    - Reusable across components
 *
 * 2. TYPED FUNCTION PARAMETERS
 *    function StockCard({ stock }: StockCardProps)
 *    - TypeScript knows `stock` has `symbol`, `name`, `price` properties
 *    - IDE autocomplete works inside the function
 *    - Errors if you access non-existent properties
 *
 * 3. FILE EXTENSION
 *    .tsx = TypeScript + JSX
 *    .ts  = TypeScript only (no JSX)
 *    .jsx = JavaScript + JSX
 *    .js  = JavaScript only
 */

import { StockCardProps } from '../types'

/**
 * StockCard Component
 *
 * Displays a single stock's information in a card format.
 *
 * @param props.stock - The stock data to display
 *
 * TypeScript validates:
 * - `stock` must have `symbol: string`, `name: string`, `price: number | null`
 * - If you pass { ticker: 'AAPL' } instead of { symbol: 'AAPL' }, you get an error
 */
function StockCard({ stock }: StockCardProps) {
  return (
    <div className="bg-white border-2 border-gray-200 p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow">
      {/* TypeScript knows stock.symbol is a string */}
      <h3 className="text-lg font-bold text-gray-800">{stock.symbol}</h3>

      {/* TypeScript knows stock.name is a string */}
      <p className="text-sm text-gray-600 truncate" title={stock.name}>
        {stock.name}
      </p>

      {/* TypeScript knows stock.price is number | null */}
      {/* The ternary handles the null case */}
      <p className="text-xl font-semibold mt-2 text-green-600">
        {stock.price !== null ? `$${stock.price.toFixed(2)}` : 'N/A'}
      </p>
    </div>
  )
}

export default StockCard

/**
 * TypeScript Benefits in This File:
 *
 * 1. If you typo `stock.symbl`, you get an immediate error
 * 2. If you call <StockCard /> without the stock prop, you get an error
 * 3. If you pass <StockCard stock="AAPL" />, you get an error (wrong type)
 * 4. IDE shows autocomplete when you type `stock.`
 *
 * Try it: In your editor, type `stock.` and see the autocomplete!
 */
