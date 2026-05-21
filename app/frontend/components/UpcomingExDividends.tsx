import { useMemo } from 'react'
import { CalendarClock } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { StockLogo } from './StockLogo'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { Holding } from '../types'

interface Props {
  holdings: Holding[]
  daysAhead?: number
}

interface UpcomingItem {
  holding: Holding
  daysUntil: number
  exDivDate: Date
}

// Compact card listing the user's holdings whose ex-dividend date falls within
// the next `daysAhead` days, sorted soonest-first. Hides itself when there
// are no upcoming ex-divs so the page doesn't show empty noise.
export function UpcomingExDividends({ holdings, daysAhead = 14 }: Props) {
  const { t, i18n } = useTranslation()

  const upcoming = useMemo<UpcomingItem[]>(() => {
    const startOfToday = new Date()
    startOfToday.setHours(0, 0, 0, 0)
    const horizon = new Date(startOfToday)
    horizon.setDate(horizon.getDate() + daysAhead)

    return holdings
      .map((h) => {
        if (!h.stock.exDividendDate) return null
        const exDivDate = new Date(h.stock.exDividendDate)
        if (isNaN(exDivDate.getTime())) return null
        if (exDivDate < startOfToday || exDivDate > horizon) return null
        const daysUntil = Math.round((exDivDate.getTime() - startOfToday.getTime()) / (1000 * 60 * 60 * 24))
        return { holding: h, daysUntil, exDivDate }
      })
      .filter((x): x is UpcomingItem => x !== null)
      .sort((a, b) => a.daysUntil - b.daysUntil)
  }, [holdings, daysAhead])

  if (upcoming.length === 0) return null

  const formatDate = (d: Date) =>
    d.toLocaleDateString(i18n.language, { month: 'short', day: 'numeric' })

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <CalendarClock className="size-4 text-amber-600 dark:text-amber-400" />
          <h3 className="text-sm font-semibold">
            {t('dividends.upcomingExDivs', { count: daysAhead })}
          </h3>
          <span className="text-xs text-muted-foreground tabular-nums">{upcoming.length}</span>
        </div>
        <ul className="space-y-1.5">
          {upcoming.map(({ holding, daysUntil, exDivDate }) => {
            const urgent = daysUntil <= 3
            return (
              <li
                key={holding.id}
                className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted/40"
              >
                <StockLogo symbol={holding.stock.symbol} name={holding.stock.name} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold leading-tight">{holding.stock.symbol}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{holding.stock.name}</p>
                </div>
                <span className="text-xs font-mono text-muted-foreground tabular-nums whitespace-nowrap">
                  {formatDate(exDivDate)}
                </span>
                <span
                  className={cn(
                    'text-[10px] font-medium tabular-nums whitespace-nowrap px-1.5 py-0.5 rounded',
                    urgent
                      ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400'
                      : 'bg-blue-500/15 text-blue-700 dark:text-blue-400'
                  )}
                >
                  {daysUntil === 0
                    ? t('stock.exDivToday')
                    : daysUntil === 1
                      ? t('stock.exDivTomorrow')
                      : t('stock.exDivInDays', { count: daysUntil })}
                </span>
              </li>
            )
          })}
        </ul>
      </CardContent>
    </Card>
  )
}
