import { useTranslation } from 'react-i18next'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { formatCurrency } from '../lib/currency'
import type { DividendChartData } from '../lib/api'

interface Props {
  data: DividendChartData
  title?: string
}

// Stable color slots per currency. Past = solid, projected = same hue with
// reduced opacity to keep the "future is estimated" cue obvious.
const CURRENCY_COLOR_SLOTS = [
  { actual: 'bg-emerald-500', projected: 'bg-emerald-500/40' },
  { actual: 'bg-blue-500', projected: 'bg-blue-500/40' },
  { actual: 'bg-purple-500', projected: 'bg-purple-500/40' },
  { actual: 'bg-amber-500', projected: 'bg-amber-500/40' },
  { actual: 'bg-pink-500', projected: 'bg-pink-500/40' },
] as const

// Per-currency grouped bars. Each currency renders its own row of bars at its
// own scale so different-magnitude currencies (e.g. $500/mo vs €10/mo) both
// stay readable. Stays compact (matches a single totals card height).
export function DividendChart({ data, title }: Props) {
  const { t, i18n } = useTranslation()
  const currencies = Object.keys(data.byCurrency)

  if (currencies.length === 0) return null

  const formatLabel = (yyyyMm: string) => {
    const [y, m] = yyyyMm.split('-').map(Number)
    return new Date(y, m - 1, 1).toLocaleDateString(i18n.language, { month: 'short' })
  }

  return (
    <Card>
      <CardContent className="p-3">
        <div className="flex items-baseline justify-between mb-2">
          <p className="text-xs font-medium">{title || t('dividends.chartTitle')}</p>
        </div>

        <div className="space-y-1.5">
          {currencies.map((ccy, idx) => {
            const buckets = data.byCurrency[ccy]
            const colors = CURRENCY_COLOR_SLOTS[idx % CURRENCY_COLOR_SLOTS.length]
            const max = Math.max(1, ...buckets.map((b) => Math.max(b.actual ?? 0, b.projected ?? 0)))
            const totalActual = buckets.reduce((s, b) => s + (b.actual ?? 0), 0)
            const totalProjected = buckets.reduce((s, b) => s + (b.projected ?? 0), 0)

            return (
              <div key={ccy} className="space-y-0.5">
                <div className="flex items-end gap-px h-10">
                  {buckets.map((b) => {
                    const value = b.actual ?? b.projected ?? 0
                    const pct = value > 0 ? Math.max(4, Math.round((value / max) * 100)) : 0
                    const isProjected = b.projected != null
                    return (
                      <div
                        key={b.month}
                        className={cn(
                          'flex-1 rounded-sm',
                          isProjected ? colors.projected : colors.actual
                        )}
                        style={{ height: `${pct}%` }}
                        title={`${formatLabel(b.month)}: ${formatCurrency(value, ccy)}${isProjected ? ` · ${t('dividends.chartProjected')}` : ''}`}
                      />
                    )
                  })}
                </div>
                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <span className={cn('size-2 rounded-sm', colors.actual)} />
                    <span className="font-mono font-semibold">{ccy}</span>
                  </span>
                  <span className="tabular-nums">
                    {formatCurrency(totalActual, ccy)}
                    {totalProjected > 0 && (
                      <span className="opacity-60"> · +{formatCurrency(totalProjected, ccy)}</span>
                    )}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
