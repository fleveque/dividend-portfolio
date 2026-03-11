import { useTranslation } from 'react-i18next'
import {
  Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import type { Stock, Holding } from '../types'

type DividendCalendarProps =
  | { holdings: Holding[]; stocks?: never }
  | { stocks: Stock[]; holdings?: never }

export function DividendCalendar(props: DividendCalendarProps) {
  const { t, i18n } = useTranslation()
  const hasHoldings = !!props.holdings
  const stocks = props.holdings ? props.holdings.map((h) => h.stock) : props.stocks
  const quantityByStockId = props.holdings
    ? new Map(props.holdings.map((h) => [h.stock.id, h.quantity]))
    : new Map<number, number>()

  const scheduledStocks = stocks.filter((s) => s.dividendScheduleAvailable)
  const unknownStocks = stocks.filter((s) => !s.dividendScheduleAvailable && s.dividend)
  const noDividendStocks = stocks.filter((s) => !s.dividend)

  // Generate localized month headers
  const monthHeaders = Array.from({ length: 12 }, (_, i) => {
    const date = new Date(2024, i, 1)
    return new Intl.DateTimeFormat(i18n.language, { month: 'short' }).format(date)
  })

  if (scheduledStocks.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        {t('dividendCalendar.noScheduleData')}
      </p>
    )
  }

  // Calculate monthly per-share totals (only primary months, not shifted)
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

  // Calculate monthly estimated income (per-share × quantity)
  const monthlyIncome = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1
    return scheduledStocks.reduce((total, stock) => {
      const isPrimary = stock.paymentMonths.includes(month) && !stock.shiftedPaymentMonths.includes(month)
      if (isPrimary && stock.dividendPerPayment) {
        const qty = quantityByStockId.get(stock.id) ?? 0
        return total + stock.dividendPerPayment * qty
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
              <TableHead className="sticky left-0 bg-background z-10 min-w-24">{t('dividendCalendar.stock')}</TableHead>
              {monthHeaders.map((month) => (
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
                            {isShifted && ` · ${t('dividendCalendar.paymentShifted')}`}
                            {!isShifted && ` · ${t('dividendCalendar.exDiv', { date: stock.formattedExDividendDate })}`}
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
              <TableCell className="sticky left-0 bg-muted/50 z-10 font-bold">{hasHoldings ? t('dividendCalendar.perShare') : t('dividendCalendar.total')}</TableCell>
              {monthlyTotals.map((total, i) => (
                <TableCell key={i} className="text-center px-1">
                  {total > 0 ? (
                    <span className="text-xs font-semibold text-foreground">${total.toFixed(2)}</span>
                  ) : (
                    <Badge variant="destructive" className="text-[10px] px-1 py-0">{t('dividendCalendar.gap')}</Badge>
                  )}
                </TableCell>
              ))}
            </TableRow>
            {hasHoldings && (
              <TableRow className="bg-emerald-50/50 dark:bg-emerald-950/20">
                <TableCell className="sticky left-0 bg-emerald-50/50 dark:bg-emerald-950/20 z-10 font-bold">{t('dividendCalendar.estIncome')}</TableCell>
                {monthlyIncome.map((income, i) => (
                  <TableCell key={i} className="text-center px-1">
                    {income > 0 ? (
                      <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">${income.toFixed(2)}</span>
                    ) : (
                      <span className="text-xs text-muted-foreground/40">—</span>
                    )}
                  </TableCell>
                ))}
              </TableRow>
            )}
          </TableFooter>
        </Table>

        {(unknownStocks.length > 0 || noDividendStocks.length > 0) && (
          <Alert>
            <AlertDescription className="text-xs space-y-1">
              {unknownStocks.length > 0 && (
                <p>
                  <span className="font-medium">{t('dividendCalendar.unknownSchedule')}</span>{' '}
                  {unknownStocks.map((s) => s.symbol).join(', ')} {t('dividendCalendar.refreshToPopulate')}
                </p>
              )}
              {noDividendStocks.length > 0 && (
                <p>
                  <span className="font-medium">{t('dividendCalendar.noDividend')}</span>{' '}
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
