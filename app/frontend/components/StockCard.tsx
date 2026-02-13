import { StockCardProps } from '../types'
import { StockLogo } from './StockLogo'
import { DividendMonthGrid } from './DividendMonthGrid'
import { FiftyTwoWeekRange } from './FiftyTwoWeekRange'
import { ScoreBadge } from './ScoreBadge'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

function StockCard({ stock }: StockCardProps) {
  return (
    <Card className="hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer">
      <CardContent className="p-4">
        {/* Stock Header */}
        <div className="flex items-start gap-3">
          <StockLogo symbol={stock.symbol} name={stock.name} size="md" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-foreground">{stock.symbol}</h3>
              <ScoreBadge score={stock.dividendScore} label={stock.dividendScoreLabel} />
            </div>
            <p className="text-sm text-muted-foreground truncate" title={stock.name}>
              {stock.name}
            </p>
          </div>
        </div>

        {/* Price */}
        <Separator className="my-3" />
        <p className="text-xl font-semibold text-foreground">
          {stock.formattedPrice}
        </p>

        {/* Financial Metrics */}
        <Separator className="my-3" />
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">PER:</span>
            <span className="text-foreground font-medium">{stock.formattedPeRatio}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">EPS:</span>
            <span className="text-foreground font-medium">{stock.formattedEps}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Div:</span>
            <span className="text-foreground font-medium">{stock.formattedDividend}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Yield:</span>
            <span className="text-foreground font-medium">{stock.formattedDividendYield}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Payout:</span>
            <span className="text-foreground font-medium">{stock.formattedPayoutRatio}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">MA50:</span>
            <span className="text-foreground font-medium">{stock.formattedMa50}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">MA200:</span>
            <span className="text-foreground font-medium">{stock.formattedMa200}</span>
          </div>
        </div>

        {/* Dividend Schedule */}
        {stock.dividendScheduleAvailable && (
          <>
            <Separator className="my-3" />
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground uppercase tracking-wide">Dividends</span>
              <DividendMonthGrid paymentMonths={stock.paymentMonths} shiftedPaymentMonths={stock.shiftedPaymentMonths} size="md" />
            </div>
          </>
        )}

        {/* 52-Week Range */}
        {stock.fiftyTwoWeekDataAvailable && (
          <>
            <Separator className="my-3" />
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground uppercase tracking-wide shrink-0">52W</span>
              <FiftyTwoWeekRange
                low={stock.formattedFiftyTwoWeekLow}
                high={stock.formattedFiftyTwoWeekHigh}
                position={stock.fiftyTwoWeekRangePosition}
              />
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

export default StockCard
