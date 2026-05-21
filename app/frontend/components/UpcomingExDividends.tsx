import { useMemo } from 'react'
import { CalendarClock } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { StockLogo } from './StockLogo'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { Holding, RadarStock, Stock } from '../types'

interface Props {
  holdings: Holding[]
  radarStocks?: RadarStock[]
  daysAhead?: number
}

interface UpcomingItem {
  stock: Stock | RadarStock
  source: 'holding' | 'radar'
  daysUntil: number
  exDivDate: Date
  key: string
}

// Compact card listing the user's stocks (held + watching) whose ex-dividend
// date falls within the next `daysAhead` days, sorted soonest-first. Holdings
// take precedence — a stock that's both held and on radar appears once,
// untagged. Radar-only stocks get a small "Radar" tag.
export function UpcomingExDividends({ holdings, radarStocks = [], daysAhead = 14 }: Props) {
  const { t, i18n } = useTranslation()

  const upcoming = useMemo<UpcomingItem[]>(() => {
    const startOfToday = new Date()
    startOfToday.setHours(0, 0, 0, 0)
    const horizon = new Date(startOfToday)
    horizon.setDate(horizon.getDate() + daysAhead)

    const heldStockIds = new Set(holdings.map((h) => h.stock.id))
    const items: UpcomingItem[] = []

    const inWindow = (stock: Stock): { exDivDate: Date; daysUntil: number } | null => {
      if (!stock.exDividendDate) return null
      const exDivDate = new Date(stock.exDividendDate)
      if (isNaN(exDivDate.getTime())) return null
      if (exDivDate < startOfToday || exDivDate > horizon) return null
      const daysUntil = Math.round((exDivDate.getTime() - startOfToday.getTime()) / (1000 * 60 * 60 * 24))
      return { exDivDate, daysUntil }
    }

    for (const h of holdings) {
      const w = inWindow(h.stock)
      if (w) items.push({ stock: h.stock, source: 'holding', key: `h-${h.id}`, ...w })
    }
    for (const rs of radarStocks) {
      if (heldStockIds.has(rs.id)) continue // already covered by holding
      const w = inWindow(rs)
      if (w) items.push({ stock: rs, source: 'radar', key: `r-${rs.id}`, ...w })
    }

    return items.sort((a, b) => a.daysUntil - b.daysUntil)
  }, [holdings, radarStocks, daysAhead])

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
          {upcoming.map(({ stock, source, daysUntil, exDivDate, key }) => {
            const urgent = daysUntil <= 3
            return (
              <li
                key={key}
                className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted/40"
              >
                <StockLogo symbol={stock.symbol} name={stock.name} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold leading-tight flex items-center gap-1.5">
                    {stock.symbol}
                    {source === 'radar' && (
                      <Badge variant="outline" className="text-[9px] px-1 py-0 uppercase tracking-wide">
                        {t('dividends.upcomingRadarTag')}
                      </Badge>
                    )}
                  </p>
                  <p className="text-[11px] text-muted-foreground truncate">{stock.name}</p>
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
