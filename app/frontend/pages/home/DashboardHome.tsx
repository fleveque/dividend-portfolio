import { Send } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useLastAddedStocks, useMostAddedStocks, useMostHeldStocks } from '../../hooks/useStockQueries'
import { useHoldings } from '../../hooks/useHoldingsQueries'
import { useRadar } from '../../hooks/useRadarQueries'
import { Card, CardContent } from '@/components/ui/card'
import { PortfolioStatsCard } from '../../components/PortfolioStatsCard'
import { UpcomingExDividends } from '../../components/UpcomingExDividends'
import { PortfolioInsights } from '../../components/PortfolioInsights'
import { RadarInsights } from '../../components/RadarInsights'
import { StockListCard } from './shared/StockListCard'
import { CommunityStrip } from './shared/CommunityStrip'
import { DashboardGreeting } from './auth/DashboardGreeting'
import { EmptyPortfolioCTA } from './auth/EmptyPortfolioCTA'
import { DividendIncomeMini } from './auth/DividendIncomeMini'
import { BuyPlanTeaser } from './auth/BuyPlanTeaser'

export function DashboardHome() {
  const { t } = useTranslation()

  const { data: holdingsData } = useHoldings()
  const { data: radarData } = useRadar()
  const lastAddedQuery = useLastAddedStocks()
  const mostAddedQuery = useMostAddedStocks()
  const mostHeldQuery = useMostHeldStocks()

  const holdings = holdingsData?.holdings ?? []
  const radarStocks = radarData?.stocks ?? []
  const hasHoldings = holdings.length > 0
  const hasRadarStocks = radarStocks.length > 0

  return (
    <div className="container mx-auto px-4 py-8 space-y-8 md:space-y-10">
      <DashboardGreeting />

      {/* Portfolio snapshot — stats card when populated, empty CTA otherwise. */}
      {hasHoldings && holdingsData?.portfolioStats ? (
        <PortfolioStatsCard stats={holdingsData.portfolioStats} />
      ) : (
        <EmptyPortfolioCTA />
      )}

      {/* Today's actions + dividend income — two-col on lg, single col
          below. Each side can render null and the layout collapses. */}
      <div className="grid gap-4 lg:grid-cols-2">
        {(hasHoldings || hasRadarStocks) && (
          <UpcomingExDividends holdings={holdings} radarStocks={radarStocks} />
        )}
        <DividendIncomeMini />
      </div>

      {/* Buy plan teaser — hidden when the cart is empty. */}
      <BuyPlanTeaser />

      {/* AI insights pair — both lazy-fetch on expand. */}
      <div className="grid gap-4 lg:grid-cols-2">
        <PortfolioInsights hasStocks={hasHoldings} />
        <RadarInsights hasStocks={hasRadarStocks} />
      </div>

      {/* Community signals below personal data. */}
      <CommunityStrip framing="watching" />

      {/* Three community stock lists. */}
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

      {/* Telegram bot — already auth-only. */}
      <Card className="border-sky-200 dark:border-sky-900/40 bg-gradient-to-r from-sky-50 to-cyan-50 dark:from-sky-950/30 dark:to-cyan-950/20 overflow-hidden">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Send className="size-5 text-sky-600 dark:text-sky-400" />
                <h2 className="text-xl sm:text-2xl font-bold text-foreground leading-tight">
                  {t('home.telegramTitle')}
                </h2>
              </div>
              <p className="text-sm sm:text-base text-muted-foreground max-w-2xl">
                {t('home.telegramDescription')}
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground italic">
                {t('home.telegramExamples')}
              </p>
            </div>
            <Link
              to="/settings#telegram"
              className="inline-flex items-center gap-1.5 rounded-md bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 text-sm font-medium transition-colors shrink-0"
            >
              <Send className="size-3.5" /> {t('home.telegramConnect')}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default DashboardHome
