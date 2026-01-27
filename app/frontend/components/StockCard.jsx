/**
 * StockCard - A React component that displays stock information
 *
 * React Component Fundamentals:
 * ----------------------------
 * 1. Components are JavaScript functions that return JSX
 * 2. Props are read-only inputs passed from parent components
 * 3. Components should be pure: same props = same output
 *
 * This is a "presentational" component - it only displays data,
 * no state management or side effects.
 */

// Props destructuring: { stock } extracts the 'stock' property from props
// This is equivalent to: function StockCard(props) { const stock = props.stock; ... }
function StockCard({ stock }) {
  return (
    // JSX looks like HTML but has key differences:
    // - className instead of class
    // - All tags must be closed (even <img />, <br />)
    // - JavaScript expressions go in {curly braces}
    <div className="bg-white border-2 border-gray-200 p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow">
      {/* Stock symbol - the ticker like AAPL, GOOGL */}
      <h3 className="text-lg font-bold text-gray-800">{stock.symbol}</h3>

      {/* Company name */}
      <p className="text-sm text-gray-600 truncate" title={stock.name}>
        {stock.name}
      </p>

      {/* Price display with conditional rendering */}
      <p className="text-xl font-semibold mt-2">
        {/*
          Conditional rendering: if stock.price exists, format it
          Otherwise show 'N/A'

          The ternary operator (condition ? ifTrue : ifFalse) is common in JSX
        */}
        {stock.price ? `$${stock.price.toFixed(2)}` : 'N/A'}
      </p>
    </div>
  )
}

// Default export: allows importing as `import StockCard from './StockCard'`
// Named export would be: export { StockCard }
// and imported as: import { StockCard } from './StockCard'
export default StockCard
