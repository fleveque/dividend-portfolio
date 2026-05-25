import { useMemo } from 'react'
import { Coins } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useDividendChartData } from '../../../hooks/useDividendsQueries'
import { Card, CardContent } from '@/components/ui/card'
import { formatCurrency } from '../../../lib/currency'
import type { DividendChartBucket } from '../../../lib/api'

interface CurrencyRow {
  currency: string
  monthly: DividendChartBucket[]
  thisMonth: number
  total: number
}

const MAX_ROWS = 3

// Last-12-months dividend income on the dashboard. Renders one row per
// currency the user has actual income in (sorted by 12m total, capped
// at MAX_ROWS), so multi-currency portfolios don't lose data to a
// preferred-currency-only view. Each row shows the current-month total
// and a tiny 12-bar sparkline. Returns null when there's no actual
// income across any currency — empty $0 cards are just noise.
export function DividendIncomeMini() {
  const { t } = useTranslation()
  const { data: chartData, isLoading } = useDividendChartData()

  const rows = useMemo<CurrencyRow[]>(() => {
    if (!chartData) return []
    const result: CurrencyRow[] = []

    for (const [currency, buckets] of Object.entries(chartData.byCurrency)) {
      // Past-only entries (`actual` is null on future months) — robust to
      // wider server windows like range=full.
      const past = buckets.filter((b) => b.actual !== null).slice(-12)
      if (past.length === 0) continue
      const total = past.reduce((acc, b) => acc + (b.actual ?? 0), 0)
      if (total === 0) continue
      const thisMonth = past[past.length - 1]?.actual ?? 0
      result.push({ currency, monthly: past, thisMonth, total })
    }

    return result.sort((a, b) => b.total - a.total)
  }, [chartData])

  if (isLoading) return null
  if (rows.length === 0) return null

  const visible = rows.slice(0, MAX_ROWS)
  const overflow = rows.length - visible.length

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="inline-flex size-8 items-center justify-center rounded-lg bg-gradient-emerald-cyan text-white">
            <Coins className="size-4" />
          </span>
          <h3 className="text-sm font-semibold">
            {t('home.dashboard.incomeMini.title')}
          </h3>
        </div>

        <ul className="space-y-4">
          {visible.map(({ currency, monthly, thisMonth, total }) => {
            const max = Math.max(...monthly.map((m) => m.actual ?? 0), 1)
            return (
              <li key={currency} className="space-y-1.5">
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <span className="font-mono text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                    {currency}
                  </span>
                  <div className="flex items-baseline gap-4">
                    <span>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wide mr-1">
                        {t('home.dashboard.incomeMini.thisMonth')}
                      </span>
                      <span className="text-sm font-bold tabular-nums">
                        {formatCurrency(thisMonth, currency)}
                      </span>
                    </span>
                    <span>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wide mr-1">
                        {t('home.dashboard.incomeMini.last12m')}
                      </span>
                      <span className="text-sm font-bold tabular-nums">
                        {formatCurrency(total, currency)}
                      </span>
                    </span>
                  </div>
                </div>

                {/* Sparkline — current month highlighted. */}
                <div className="flex items-end gap-0.5 h-7">
                  {monthly.map((m, i) => {
                    const value = m.actual ?? 0
                    const heightPct = Math.max(2, (value / max) * 100)
                    const isCurrent = i === monthly.length - 1
                    return (
                      <div
                        key={m.month}
                        title={`${m.month}: ${formatCurrency(value, currency)}`}
                        className={`flex-1 rounded-sm ${
                          isCurrent ? 'bg-emerald-500' : 'bg-emerald-500/30'
                        }`}
                        style={{ height: `${heightPct}%` }}
                      />
                    )
                  })}
                </div>
              </li>
            )
          })}
        </ul>

        {overflow > 0 && (
          <p className="mt-3 text-[10px] text-muted-foreground uppercase tracking-wide">
            {t('home.dashboard.incomeMini.moreCurrencies', { count: overflow })}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

export default DividendIncomeMini
