import { TrendingUp } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { StockLogo } from '../../../components/StockLogo'
import { useMostHeldStocks } from '../../../hooks/useStockQueries'

interface Props {
  // Anon framing pitches discovery; the dashboard framing pitches what
  // the community is doing right now.
  framing?: 'discover' | 'watching'
  limit?: number
}

// Auto-scrolling horizontal strip of the most-held stocks across the
// community. Pure CSS marquee (animate-home-marquee), paused on hover,
// honors prefers-reduced-motion via the global CSS guard.
export function CommunityStrip({ framing = 'discover', limit = 12 }: Props) {
  const { t } = useTranslation()
  const { data, isLoading, error } = useMostHeldStocks()

  if (isLoading || error || !data?.length) return null

  const items = data.slice(0, limit)
  // Duplicate the list so the marquee loops seamlessly when it
  // translates -50% — no visible jump at the wrap point.
  const doubled = [...items, ...items]

  const label =
    framing === 'watching'
      ? t('home.community.marqueeWatching')
      : t('home.community.marqueeDiscover')

  return (
    <section className="relative isolate -mx-4 sm:mx-0 sm:rounded-2xl overflow-hidden border-y sm:border border-border bg-card/50">
      <div className="flex items-center gap-3 px-4 sm:px-6 pt-4 pb-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
          <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
          {t('home.community.liveBadge')}
        </span>
        <h2 className="text-sm font-medium text-muted-foreground">{label}</h2>
      </div>

      <div className="relative overflow-hidden pb-4">
        {/* Fade out the edges so chips disappear cleanly off-screen. */}
        <div aria-hidden className="pointer-events-none absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-card to-transparent z-10" />
        <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-card to-transparent z-10" />

        <div className="flex w-max gap-3 px-4 sm:px-6 animate-home-marquee">
          {doubled.map((stock, i) => (
            <Link
              key={`${stock.id}-${i}`}
              to={`/radar`}
              className="group flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 transition-colors hover:border-emerald-500/60"
            >
              <StockLogo symbol={stock.symbol} name={stock.name} size="sm" />
              <div className="flex flex-col items-start leading-tight">
                <span className="font-mono text-xs font-semibold">{stock.symbol}</span>
                {stock.dividendScoreLabel && (
                  <span className="text-[10px] text-muted-foreground">
                    <TrendingUp className="inline size-2.5 mr-0.5" />
                    {stock.dividendScoreLabel}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

export default CommunityStrip
