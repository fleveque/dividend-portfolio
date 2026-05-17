import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { PortfolioStats } from '../types'

interface PortfolioStatsCardProps {
  stats: PortfolioStats | null | undefined
}

// Color palette for sector segments — tailwind-friendly, dark-mode aware.
const SECTOR_COLORS = [
  'bg-emerald-500',
  'bg-blue-500',
  'bg-amber-500',
  'bg-purple-500',
  'bg-rose-500',
  'bg-cyan-500',
  'bg-indigo-500',
  'bg-orange-500',
  'bg-lime-500',
  'bg-pink-500',
  'bg-slate-400',
]

export function PortfolioStatsCard({ stats }: PortfolioStatsCardProps) {
  const { t } = useTranslation()
  if (!stats) return null

  const hasDisplay = stats.displayYoc !== null && stats.displayCurrentYield !== null

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">{t('portfolio.stats.title')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <YieldRow stats={stats} hasDisplay={hasDisplay} />
        {stats.sectors.length > 0 && <SectorBreakdown sectors={stats.sectors} />}
      </CardContent>
    </Card>
  )
}

function YieldRow({ stats, hasDisplay }: { stats: PortfolioStats; hasDisplay: boolean }) {
  const { t } = useTranslation()
  if (hasDisplay) {
    return (
      <div className="grid grid-cols-2 gap-4">
        <Metric label={t('portfolio.stats.yieldOnCost')} value={`${stats.displayYoc!.toFixed(2)}%`} />
        <Metric label={t('portfolio.stats.currentYield')} value={`${stats.displayCurrentYield!.toFixed(2)}%`} />
      </div>
    )
  }
  // FX unavailable → fall back to per-currency rows.
  const entries = Object.entries(stats.byCurrency)
  return (
    <div className="space-y-2 text-sm">
      <p className="text-xs text-muted-foreground">{t('portfolio.stats.perCurrencyFallback')}</p>
      {entries.map(([code, y]) => (
        <div key={code} className="flex items-center justify-between gap-4">
          <span className="font-mono text-xs text-muted-foreground">{code}</span>
          <div className="flex gap-4">
            <Metric inline label={t('portfolio.stats.yieldOnCost')} value={`${y.yoc.toFixed(2)}%`} />
            <Metric inline label={t('portfolio.stats.currentYield')} value={`${y.currentYield.toFixed(2)}%`} />
          </div>
        </div>
      ))}
    </div>
  )
}

function Metric({ label, value, inline }: { label: string; value: string; inline?: boolean }) {
  if (inline) {
    return (
      <span className="text-sm">
        <span className="text-muted-foreground">{label}: </span>
        <span className="font-semibold">{value}</span>
      </span>
    )
  }
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold text-foreground">{value}</p>
    </div>
  )
}

function SectorBreakdown({ sectors }: { sectors: PortfolioStats['sectors'] }) {
  const { t } = useTranslation()

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">{t('portfolio.stats.sectors')}</p>
      <div className="flex h-3 w-full overflow-hidden rounded-md">
        {sectors.map((s, i) => (
          <div
            key={s.sector}
            className={cn('h-full', SECTOR_COLORS[i % SECTOR_COLORS.length])}
            style={{ width: `${s.percent}%` }}
            title={`${s.sector}: ${s.percent.toFixed(1)}%`}
          />
        ))}
      </div>
      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
        {sectors.map((s, i) => (
          <li key={s.sector} className="flex items-center gap-2">
            <span className={cn('size-2 rounded-sm', SECTOR_COLORS[i % SECTOR_COLORS.length])} />
            <span className="text-foreground">{s.sector}</span>
            <span className="text-muted-foreground">{s.percent.toFixed(1)}%</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default PortfolioStatsCard
