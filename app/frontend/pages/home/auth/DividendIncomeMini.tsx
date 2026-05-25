import { useMemo } from 'react'
import { Coins } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useDividendChartData } from '../../../hooks/useDividendsQueries'
import { useProfile } from '../../../hooks/useProfileQueries'
import { Card, CardContent } from '@/components/ui/card'
import { formatCurrency } from '../../../lib/currency'

// Last-12-months sparkline of dividend income in the user's preferred
// currency. Shows this-month total prominently + a tiny bar chart for
// recent history. Returns null when there's no data so the parent can
// collapse the row gracefully.
export function DividendIncomeMini() {
  const { t } = useTranslation()
  const { data: chartData, isLoading } = useDividendChartData()
  const { data: profile } = useProfile()

  const currency = profile?.preferredCurrency ?? 'USD'

  // Aggregate "actual" income across currencies (raw monthly buckets are
  // per-currency; for the mini view we pick the user's preferred currency
  // if it's present, otherwise fall back to the first bucket).
  const monthly = useMemo(() => {
    if (!chartData) return null
    const buckets = chartData.byCurrency[currency] ?? Object.values(chartData.byCurrency)[0]
    if (!buckets) return null
    // Last 12 months only.
    return buckets.slice(-12)
  }, [chartData, currency])

  if (isLoading) return null
  if (!monthly || monthly.length === 0) return null

  const thisMonth = monthly[monthly.length - 1]?.actual ?? 0
  const max = Math.max(...monthly.map((m) => m.actual ?? 0), 1)

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex size-8 items-center justify-center rounded-lg bg-gradient-emerald-cyan text-white">
              <Coins className="size-4" />
            </span>
            <h3 className="text-sm font-semibold">
              {t('home.dashboard.incomeMini.title')}
            </h3>
          </div>
        </div>

        <div className="mb-3">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">
            {t('home.dashboard.incomeMini.thisMonth')}
          </p>
          <p className="text-2xl font-bold tabular-nums">
            {formatCurrency(thisMonth, currency)}
          </p>
        </div>

        {/* Sparkline-ish bar chart, pure CSS. */}
        <div className="flex items-end gap-1 h-12">
          {monthly.map((m, i) => {
            const value = m.actual ?? 0
            const heightPct = Math.max(2, (value / max) * 100)
            const isCurrent = i === monthly.length - 1
            return (
              <div
                key={m.month}
                title={`${m.month}: ${formatCurrency(value, currency)}`}
                className={`flex-1 rounded-sm transition-colors ${
                  isCurrent ? 'bg-emerald-500' : 'bg-emerald-500/30'
                }`}
                style={{ height: `${heightPct}%` }}
              />
            )
          })}
        </div>
        <p className="mt-2 text-[10px] text-muted-foreground uppercase tracking-wide">
          {t('home.dashboard.incomeMini.last12m')}
        </p>
      </CardContent>
    </Card>
  )
}

export default DividendIncomeMini
