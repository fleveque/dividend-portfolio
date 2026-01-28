/**
 * StockCard - Displays a single stock's information in a card format
 *
 * Features:
 * - Company logo with fallback
 * - Theme-aware styling
 * - Hover effects
 */

import { StockCardProps } from '../types'
import { StockLogo } from './StockLogo'

function StockCard({ stock }: StockCardProps) {
  return (
    <div className="card-hover p-4">
      <div className="flex items-start gap-3">
        {/* Stock Logo */}
        <StockLogo symbol={stock.symbol} name={stock.name} size="md" />

        {/* Stock Info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-theme-primary">{stock.symbol}</h3>
          <p className="text-sm text-theme-secondary truncate" title={stock.name}>
            {stock.name}
          </p>
        </div>
      </div>

      {/* Price */}
      <div className="mt-3 pt-3 border-t border-theme">
        <p className="text-xl font-semibold text-brand">
          {stock.formattedPrice}
        </p>
      </div>
    </div>
  )
}

export default StockCard
