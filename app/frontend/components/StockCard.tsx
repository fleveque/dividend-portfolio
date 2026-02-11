import { StockCardProps } from '../types'
import { StockLogo } from './StockLogo'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

function StockCard({ stock }: StockCardProps) {
  return (
    <Card className="hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <StockLogo symbol={stock.symbol} name={stock.name} size="md" />
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-foreground">{stock.symbol}</h3>
            <p className="text-sm text-muted-foreground truncate" title={stock.name}>
              {stock.name}
            </p>
          </div>
        </div>

        <Separator className="my-3" />

        <p className="text-xl font-semibold text-foreground">
          {stock.formattedPrice}
        </p>
      </CardContent>
    </Card>
  )
}

export default StockCard
