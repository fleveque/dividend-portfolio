/**
 * StockLogo - Component to display stock logos with colored initials
 *
 * Shows colored initials based on the stock symbol with consistent
 * colors determined by a hash of the symbol.
 */

interface StockLogoProps {
  symbol: string
  name?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeClasses = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
}

/**
 * Generate a consistent color based on the stock symbol
 * Uses a simple hash to pick from a set of colors
 */
function getSymbolColor(symbol: string): string {
  const colors = [
    'bg-emerald-500',
    'bg-blue-500',
    'bg-purple-500',
    'bg-orange-500',
    'bg-pink-500',
    'bg-cyan-500',
    'bg-indigo-500',
    'bg-teal-500',
    'bg-rose-500',
    'bg-amber-500',
  ]

  let hash = 0
  for (let i = 0; i < symbol.length; i++) {
    hash = symbol.charCodeAt(i) + ((hash << 5) - hash)
  }

  return colors[Math.abs(hash) % colors.length]
}

/**
 * Get initials from symbol (first 2 characters)
 */
function getInitials(symbol: string): string {
  return symbol.slice(0, 2).toUpperCase()
}

export function StockLogo({ symbol, name, size = 'md', className = '' }: StockLogoProps) {
  const colorClass = getSymbolColor(symbol)
  const initials = getInitials(symbol)

  return (
    <div
      className={`${sizeClasses[size]} rounded-lg overflow-hidden flex-shrink-0 ${className}`}
      title={name || symbol}
    >
      <div
        className={`w-full h-full ${colorClass} flex items-center justify-center text-white font-bold rounded-lg shadow-sm`}
      >
        {initials}
      </div>
    </div>
  )
}

export default StockLogo
