import { Activity, ExternalLink, Settings } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { TopScoredShowcase } from '../../components/TopScoredShowcase'
import { useLastAddedStocks, useMostAddedStocks, useMostHeldStocks } from '../../hooks/useStockQueries'
import { Card, CardContent } from '@/components/ui/card'
import pulsePreviewImg from '@/assets/screenshots/pulse-portfolio.webp'
import { PULSE_URL } from '../../lib/pulse'
import { StockListCard } from './shared/StockListCard'
import { HeroAurora } from './shared/HeroAurora'
import { CommunityStrip } from './shared/CommunityStrip'
import { HowItWorks } from './anon/HowItWorks'
import { FinalCTA } from './anon/FinalCTA'

export function AnonHome() {
  const { t } = useTranslation()

  const lastAddedQuery = useLastAddedStocks()
  const mostAddedQuery = useMostAddedStocks()
  const mostHeldQuery = useMostHeldStocks()

  return (
    <div>
      <HeroAurora variant="anon" />

      <div className="container mx-auto px-4 pb-8 space-y-12 md:space-y-16">
        <CommunityStrip framing="discover" />

        <HowItWorks />

        {/* Top-Scored leaderboard — real product output, gradient-bordered. */}
        <Card className="relative overflow-hidden border-transparent bg-gradient-to-br from-emerald-500/40 via-cyan-500/30 to-blue-500/30 p-[1px]">
          <div className="rounded-[calc(var(--radius-lg)-1px)] bg-card">
            <CardContent className="px-6 pt-4 pb-5">
              <TopScoredShowcase />
            </CardContent>
          </div>
        </Card>

        {/* Pulse Banner — community-first reframe with preview */}
        <Card className="border-purple-200 dark:border-purple-800 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30 overflow-hidden">
          <CardContent className="p-6">
            <div className="grid md:grid-cols-2 gap-6 items-center">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Activity className="size-5 text-purple-600 dark:text-purple-400" />
                  <h2 className="text-xl sm:text-2xl font-bold text-foreground leading-tight">
                    {t('home.pulseTitle')}
                  </h2>
                </div>
                <p className="text-sm sm:text-base text-muted-foreground">
                  {t('home.pulseDescription')}
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <Link
                    to="/settings#portfolio-sharing"
                    className="inline-flex items-center gap-1.5 rounded-md bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 text-sm font-medium transition-colors"
                  >
                    <Settings className="size-3.5" /> {t('home.pulseOpenSettings')}
                  </Link>
                  <a
                    href={PULSE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm font-medium text-purple-700 dark:text-purple-300 hover:underline"
                  >
                    {t('home.pulseSeeCommunity')} <ExternalLink className="size-3.5" />
                  </a>
                </div>
              </div>
              <div className="flex justify-center md:justify-end">
                <a
                  href={PULSE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full max-w-[240px] rounded-lg overflow-hidden shadow-lg ring-1 ring-purple-200 dark:ring-purple-800 transition-transform hover:scale-[1.02]"
                  aria-label={t('home.pulsePreviewAlt')}
                >
                  <img
                    src={pulsePreviewImg}
                    alt={t('home.pulsePreviewAlt')}
                    loading="lazy"
                    width="800"
                    height="981"
                    className="block w-full h-auto"
                  />
                </a>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stock Lists — three columns on large screens */}
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

        <FinalCTA />
      </div>
    </div>
  )
}

export default AnonHome
