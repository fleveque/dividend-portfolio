import {
  Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import type { RadarStock } from '../types'

const MONTH_HEADERS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

interface DividendCalendarProps {
  stocks: RadarStock[]
}

export function DividendCalendar({ stocks }: DividendCalendarProps) {
  const scheduledStocks = stocks.filter((s) => s.dividendScheduleAvailable)
  const unknownStocks = stocks.filter((s) => !s.dividendScheduleAvailable && s.dividend)
  const noDividendStocks = stocks.filter((s) => !s.dividend)

  if (scheduledStocks.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        No dividend schedule data available yet. Refresh stock data to populate.
      </p>
    )
  }

  // Calculate monthly totals (only primary months, not shifted)
  const monthlyTotals = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1
    return scheduledStocks.reduce((total, stock) => {
      const isPrimary = stock.paymentMonths.includes(month) && !stock.shiftedPaymentMonths.includes(month)
      if (isPrimary && stock.dividendPerPayment) {
        return total + stock.dividendPerPayment
      }
      return total
    }, 0)
  })

  return (
    <TooltipProvider>
      <div className="space-y-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="sticky left-0 bg-background z-10 min-w-24">Stock</TableHead>
              {MONTH_HEADERS.map((month) => (
                <TableHead key={month} className="text-center text-xs px-1 min-w-12">{month}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {scheduledStocks.map((stock) => (
              <TableRow key={stock.id}>
                <TableCell className="sticky left-0 bg-background z-10 font-medium">
                  {stock.symbol}
                </TableCell>
                {Array.from({ length: 12 }, (_, i) => {
                  const month = i + 1
                  const isShifted = stock.shiftedPaymentMonths.includes(month)
                  const isPrimary = stock.paymentMonths.includes(month) && !isShifted
                  return (
                    <TableCell key={month} className="text-center px-1">
                      {(isPrimary || isShifted) ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className={cn(
                              'inline-block rounded px-1.5 py-0.5 text-xs font-medium',
                              isPrimary && 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
                              isShifted && 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400'
                            )}>
                              {isShifted ? '~' : ''}${stock.dividendPerPayment?.toFixed(2)}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            {stock.symbol} · {stock.formattedPaymentFrequency}
                            {isShifted && ' · Payment sometimes shifts to this month'}
                            {!isShifted && ` · Ex-div: ${stock.formattedExDividendDate}`}
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        <span className="text-xs text-muted-foreground/40">—</span>
                      )}
                    </TableCell>
                  )
                })}
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell className="sticky left-0 bg-muted/50 z-10 font-bold">Total</TableCell>
              {monthlyTotals.map((total, i) => (
                <TableCell key={i} className="text-center px-1">
                  {total > 0 ? (
                    <span className="text-xs font-semibold text-foreground">${total.toFixed(2)}</span>
                  ) : (
                    <Badge variant="destructive" className="text-[10px] px-1 py-0">Gap</Badge>
                  )}
                </TableCell>
              ))}
            </TableRow>
          </TableFooter>
        </Table>

        {(unknownStocks.length > 0 || noDividendStocks.length > 0) && (
          <Alert>
            <AlertDescription className="text-xs space-y-1">
              {unknownStocks.length > 0 && (
                <p>
                  <span className="font-medium">Unknown schedule:</span>{' '}
                  {unknownStocks.map((s) => s.symbol).join(', ')} — refresh data to populate
                </p>
              )}
              {noDividendStocks.length > 0 && (
                <p>
                  <span className="font-medium">No dividend:</span>{' '}
                  {noDividendStocks.map((s) => s.symbol).join(', ')}
                </p>
              )}
            </AlertDescription>
          </Alert>
        )}
      </div>
    </TooltipProvider>
  )
}

export default DividendCalendar
