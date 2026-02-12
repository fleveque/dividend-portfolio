import { Stock } from '../types'
import { StockLogo } from './StockLogo'

interface CompactStockRowProps {
  stock: Stock
}

export function CompactStockRow({ stock }: CompactStockRowProps) {
  return (
    <div className="flex items-center gap-3 py-2.5 px-1">
      <StockLogo symbol={stock.symbol} name={stock.name} size="sm" />
      <div className="flex-1 min-w-0">
        <span className="font-semibold text-foreground text-sm">{stock.symbol}</span>
        <p className="text-xs text-muted-foreground truncate">{stock.name}</p>
      </div>
      <span className="text-sm font-medium text-foreground tabular-nums whitespace-nowrap">
        {stock.formattedPrice}
      </span>
    </div>
  )
}

export default CompactStockRow
