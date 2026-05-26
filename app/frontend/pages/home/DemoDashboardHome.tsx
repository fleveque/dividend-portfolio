import { useMemo } from 'react'
import { Eye, Briefcase, Compass, ArrowRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useHoldings } from '../../hooks/useHoldingsQueries'
import { useRadar } from '../../hooks/useRadarQueries'
import { useDividendChartData } from '../../hooks/useDividendsQueries'
import { useProfile } from '../../hooks/useProfileQueries'
import { useLastAddedStocks, useMostAddedStocks, useMostHeldStocks } from '../../hooks/useStockQueries'
import { PortfolioStatsCard } from '../../components/PortfolioStatsCard'
import { UpcomingExDividends } from '../../components/UpcomingExDividends'
import { Card, CardContent } from '@/components/ui/card'
import { StockListCard } from './shared/StockListCard'
import { CommunityStrip } from './shared/CommunityStrip'
import { DividendIncomeMini } from './auth/DividendIncomeMini'
import { PathToFreedomMini } from './auth/PathToFreedomMini'

// /demo landing — same shape as DashboardHome but with auth-only widgets
// (BuyPlanTeaser, Telegram CTA, personalised greeting) stripped out. Data
// is prefilled into React Query by DemoPage, so the regular hooks return
// curated demo data without 401s.
export function DemoDashboardHome() {
  const { t } = useTranslation()
  const { data: holdingsData } = useHoldings()
  const { data: radarData } = useRadar()
  const { data: chartData } = useDividendChartData()
  const { data: profile } = useProfile()
  const lastAddedQuery = useLastAddedStocks()
  const mostAddedQuery = useMostAddedStocks()
  const mostHeldQuery = useMostHeldStocks()

  const holdings = holdingsData?.holdings ?? []
  const radarStocks = radarData?.stocks ?? []

  const hasUpcomingExDivs = useMemo(() => {
    const startOfToday = new Date()
    startOfToday.setHours(0, 0, 0, 0)
    const horizon = new Date(startOfToday)
    horizon.setDate(horizon.getDate() + 14)
    const inWindow = (d: string | null) => {
      if (!d) return false
      const x = new Date(d)
      return !Number.isNaN(x.getTime()) && x >= startOfToday && x <= horizon
    }
    return (
      holdings.some((h) => inWindow(h.stock.exDividendDate)) ||
      radarStocks.some((r) => inWindow(r.exDividendDate))
    )
  }, [holdings, radarStocks])

  const hasDividendIncome = useMemo(() => {
    if (!chartData) return false
    for (const buckets of Object.values(chartData.byCurrency)) {
      if (buckets.some((b) => (b.actual ?? 0) > 0)) return true
    }
    return false
  }, [chartData])

  return (
    <div className="container mx-auto px-4 py-8 space-y-8 md:space-y-10">
      {/* Demo-flavoured header — no personal greeting, just a tour
          framing that nudges visitors toward signing up. */}
      <header className="space-y-3 max-w-2xl">
        <h1 className="text-2xl sm:text-4xl font-bold tracking-tight">
          {t('demo.home.title')}
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          {t('demo.home.intro')}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
            <Briefcase className="size-3.5" /> {holdings.length} {t('home.dashboard.quickStats.holdingsLabel')}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
            <Eye className="size-3.5" /> {radarStocks.length} {t('home.dashboard.quickStats.radarLabel')}
          </span>
        </div>
      </header>

      {holdingsData?.portfolioStats && <PortfolioStatsCard stats={holdingsData.portfolioStats} />}

      {(hasUpcomingExDivs || hasDividendIncome) && (
        <div className={`grid gap-4 ${hasUpcomingExDivs && hasDividendIncome ? 'lg:grid-cols-2' : ''}`}>
          {hasDividendIncome && <DividendIncomeMini />}
          {hasUpcomingExDivs && (
            <UpcomingExDividends holdings={holdings} radarStocks={radarStocks} />
          )}
        </div>
      )}

      {/* Path to Freedom — the centerpiece of the demo dashboard. The
          summary in profile is precomputed server-side, so the mini
          renders straight from the prefilled cache. */}
      {profile?.motivationSummary && (
        <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
          <PathToFreedomMini />
          <Card className="border-emerald-200 dark:border-emerald-900/40 bg-gradient-to-br from-emerald-50 to-cyan-50 dark:from-emerald-950/30 dark:to-cyan-950/20">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center gap-2">
                <span className="inline-flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500 text-white">
                  <Compass className="size-4" />
                </span>
                <h3 className="text-sm font-semibold">{t('demo.home.freedomPitchTitle')}</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {t('demo.home.freedomPitchBody')}
              </p>
              <Link
                to="/signup"
                className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 text-xs font-medium transition-colors"
              >
                {t('demo.home.freedomPitchCta')} <ArrowRight className="size-3.5" />
              </Link>
            </CardContent>
          </Card>
        </div>
      )}

      <CommunityStrip framing="watching" />

      <div className="grid lg:grid-cols-3 gap-4">
        <StockListCard
          title={t('home.mostAddedToRadar')}
          data={mostAddedQuery.data}
          isLoading={mostAddedQuery.isLoading}
          error={mostAddedQuery.error}
        />
        <StockListCard
          title={t('home.mostHeldInPortfolios')}
          data={mostHeldQuery.data}
          isLoading={mostHeldQuery.isLoading}
          error={mostHeldQuery.error}
        />
        <StockListCard
          title={t('home.recentlyUpdated')}
          data={lastAddedQuery.data}
          isLoading={lastAddedQuery.isLoading}
          error={lastAddedQuery.error}
        />
      </div>
    </div>
  )
}

export default DemoDashboardHome
