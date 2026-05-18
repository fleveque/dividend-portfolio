import { useTranslation } from 'react-i18next'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { formatCurrency } from '../lib/currency'
import type { DividendChartData } from '../lib/api'

interface Props {
  data: DividendChartData
  title?: string
}

// Stable per-currency colors. Slot 0 (USD usually) is emerald to match the
// existing portfolio accent; subsequent currencies get distinct hues.
const SERIES_COLORS = [
  'text-emerald-500',
  'text-blue-500',
  'text-purple-500',
  'text-amber-500',
  'text-pink-500',
] as const

const FILL_COLORS = [
  'fill-emerald-500',
  'fill-blue-500',
  'fill-purple-500',
  'fill-amber-500',
  'fill-pink-500',
] as const

// Catmull-Rom-to-Bezier smoothing of a polyline. Keeps tail/head anchored.
function smoothPath(points: Array<{ x: number; y: number }>): string {
  if (points.length === 0) return ''
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`

  let d = `M ${points[0].x} ${points[0].y}`
  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[i - 1] ?? points[i]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[i + 2] ?? points[i + 1]
    const cp1x = p1.x + (p2.x - p0.x) / 6
    const cp1y = p1.y + (p2.y - p0.y) / 6
    const cp2x = p2.x - (p3.x - p1.x) / 6
    const cp2y = p2.y - (p3.y - p1.y) / 6
    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`
  }
  return d
}

// SVG line chart with one smoothed line per currency. Past = solid, projected
// continuation = dashed. Each line auto-scales to its own peak so trends are
// visible regardless of magnitude across currencies.
export function DividendLineChart({ data, title }: Props) {
  const { t, i18n } = useTranslation()
  const currencies = Object.keys(data.byCurrency)
  const months = data.months

  if (currencies.length === 0 || months.length === 0) return null

  const W = 600
  const H = 80
  const PAD_TOP = 4
  const PAD_BOTTOM = 4

  const formatLabel = (yyyyMm: string) => {
    const [y, m] = yyyyMm.split('-').map(Number)
    return new Date(y, m - 1, 1).toLocaleDateString(i18n.language, { month: 'short', year: '2-digit' })
  }

  const xFor = (i: number) =>
    months.length === 1 ? W / 2 : (i / (months.length - 1)) * W

  return (
    <Card>
      <CardContent className="p-3">
        <div className="flex items-baseline justify-between mb-2">
          <p className="text-xs font-medium">{title || t('dividends.chartTitleFull')}</p>
        </div>

        <svg
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          className="w-full h-16"
          aria-hidden="true"
        >
          {currencies.map((ccy, idx) => {
            const buckets = data.byCurrency[ccy]
            const peak = Math.max(1, ...buckets.map((b) => Math.max(b.actual ?? 0, b.projected ?? 0)))
            const colorClass = SERIES_COLORS[idx % SERIES_COLORS.length]
            const fillClass = FILL_COLORS[idx % FILL_COLORS.length]

            // Map each bucket to an (x, y) point. Use the active value
            // (actual or projected) for y. Past and projected segments share
            // the join point so the line is continuous.
            const points = buckets.map((b, i) => {
              const value = b.actual ?? b.projected ?? 0
              const y = H - PAD_BOTTOM - ((value / peak) * (H - PAD_TOP - PAD_BOTTOM))
              return { x: xFor(i), y, value, isProjected: b.projected != null }
            })

            // Split into actual + projected segments so we can style them differently.
            let lastActualIdx = -1
            for (let i = points.length - 1; i >= 0; i -= 1) {
              if (!points[i].isProjected) { lastActualIdx = i; break }
            }
            const actualPoints = lastActualIdx >= 0 ? points.slice(0, lastActualIdx + 1) : []
            // Include the bridging point so the dashed line connects continuously.
            const projectedPoints = lastActualIdx >= 0 ? points.slice(lastActualIdx) : points

            return (
              <g key={ccy} className={cn(colorClass, 'stroke-current')}>
                {actualPoints.length > 0 && (
                  <path d={smoothPath(actualPoints)} fill="none" strokeWidth="1.5" />
                )}
                {projectedPoints.length > 0 && (
                  <path d={smoothPath(projectedPoints)} fill="none" strokeWidth="1.5" strokeDasharray="3 2" opacity="0.6" />
                )}
                {/* dot for the most recent actual value */}
                {actualPoints.length > 0 && (
                  <circle cx={actualPoints[actualPoints.length - 1].x} cy={actualPoints[actualPoints.length - 1].y} r="2" className={fillClass} />
                )}
              </g>
            )
          })}
        </svg>

        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-0.5 mt-1 text-[10px]">
          <div className="flex flex-wrap items-center gap-3">
            {currencies.map((ccy, idx) => {
              const buckets = data.byCurrency[ccy]
              const totalActual = buckets.reduce((s, b) => s + (b.actual ?? 0), 0)
              const fillClass = FILL_COLORS[idx % FILL_COLORS.length]
              return (
                <span key={ccy} className="flex items-center gap-1.5">
                  <span className={cn('size-2 rounded-full', fillClass.replace('fill-', 'bg-'))} />
                  <span className="font-mono font-semibold">{ccy}</span>
                  <span className="text-muted-foreground tabular-nums">{formatCurrency(totalActual, ccy)}</span>
                </span>
              )
            })}
          </div>
          <span className="text-muted-foreground font-mono">
            {formatLabel(months[0])} — {formatLabel(months[months.length - 1])}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
