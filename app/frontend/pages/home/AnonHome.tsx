import { Loader2, Activity, ExternalLink, Settings, Sparkles } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Logo } from '../../components/Logo'
import { FeatureShowcase } from '../../components/FeatureShowcase'
import { TopScoredShowcase } from '../../components/TopScoredShowcase'
import { CompactStockRow } from '../../components/CompactStockRow'
import { useLastAddedStocks, useMostAddedStocks, useMostHeldStocks } from '../../hooks/useStockQueries'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import pulsePreviewImg from '@/assets/screenshots/pulse-portfolio.webp'
import { PULSE_URL } from '../../lib/pulse'

export function AnonHome() {
  const { t } = useTranslation()

  const {
    data: lastAdded,
    isLoading: lastAddedLoading,
    error: lastAddedError,
  } = useLastAddedStocks()

  const {
    data: mostAdded,
    isLoading: mostAddedLoading,
    error: mostAddedError,
  } = useMostAddedStocks()

  const {
    data: mostHeld,
    isLoading: mostHeldLoading,
    error: mostHeldError,
  } = useMostHeldStocks()

  const topMostAdded = mostAdded?.slice(0, 5)
  const topLastAdded = lastAdded?.slice(0, 5)
  const topMostHeld = mostHeld?.slice(0, 5)

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <Logo size="lg" showText={false} />
        </div>
        <h1 className="text-2xl sm:text-4xl font-bold text-foreground mb-2">
          {t('home.heroTitle')}
        </h1>
        <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto">
          {t('home.heroSubtitle')}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 mt-5">
          <Button asChild size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white">
            <Link to="/demo">
              <Sparkles className="size-4" /> {t('home.tryDemo')}
            </Link>
          </Button>
        </div>
      </div>

      {/* Feature Showcase + Top Scored Stocks */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-8">
        <Card className="lg:col-span-3">
          <CardContent className="px-6 pt-4 pb-5">
            <FeatureShowcase />
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardContent className="px-6 pt-4 pb-5">
            <TopScoredShowcase />
          </CardContent>
        </Card>
      </div>

      {/* Pulse Banner — community-first reframe with preview */}
      <Card className="mb-8 border-purple-200 dark:border-purple-800 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30 overflow-hidden">
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
        {/* Most Added to Radar */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <span className="w-1 h-5 bg-foreground rounded-full"></span>
              {t('home.mostAddedToRadar')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {mostAddedLoading && (
              <div className="flex items-center justify-center p-6">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
                <span className="ml-3 text-muted-foreground text-sm">{t('common.loading')}</span>
              </div>
            )}

            {mostAddedError && (
              <Alert variant="destructive">
                <AlertDescription>
                  {mostAddedError instanceof Error ? mostAddedError.message : t('common.failedToLoad')}
                </AlertDescription>
              </Alert>
            )}

            {!mostAddedLoading && !mostAddedError && (!topMostAdded || topMostAdded.length === 0) && (
              <p className="text-muted-foreground text-center py-6 text-sm">{t('common.noStocksFound')}</p>
            )}

            {!mostAddedLoading && !mostAddedError && topMostAdded && topMostAdded.length > 0 && (
              <div className="divide-y">
                {topMostAdded.map((stock) => (
                  <CompactStockRow key={stock.id} stock={stock} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Most Held in Portfolios */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <span className="w-1 h-5 bg-foreground rounded-full"></span>
              {t('home.mostHeldInPortfolios')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {mostHeldLoading && (
              <div className="flex items-center justify-center p-6">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
                <span className="ml-3 text-muted-foreground text-sm">{t('common.loading')}</span>
              </div>
            )}

            {mostHeldError && (
              <Alert variant="destructive">
                <AlertDescription>
                  {mostHeldError instanceof Error ? mostHeldError.message : t('common.failedToLoad')}
                </AlertDescription>
              </Alert>
            )}

            {!mostHeldLoading && !mostHeldError && (!topMostHeld || topMostHeld.length === 0) && (
              <p className="text-muted-foreground text-center py-6 text-sm">{t('common.noStocksFound')}</p>
            )}

            {!mostHeldLoading && !mostHeldError && topMostHeld && topMostHeld.length > 0 && (
              <div className="divide-y">
                {topMostHeld.map((stock) => (
                  <CompactStockRow key={stock.id} stock={stock} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recently Updated */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <span className="w-1 h-5 bg-foreground rounded-full"></span>
              {t('home.recentlyUpdated')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {lastAddedLoading && (
              <div className="flex items-center justify-center p-6">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
                <span className="ml-3 text-muted-foreground text-sm">{t('common.loading')}</span>
              </div>
            )}

            {lastAddedError && (
              <Alert variant="destructive">
                <AlertDescription>
                  {lastAddedError instanceof Error ? lastAddedError.message : t('common.failedToLoad')}
                </AlertDescription>
              </Alert>
            )}

            {!lastAddedLoading && !lastAddedError && (!topLastAdded || topLastAdded.length === 0) && (
              <p className="text-muted-foreground text-center py-6 text-sm">{t('common.noStocksFound')}</p>
            )}

            {!lastAddedLoading && !lastAddedError && topLastAdded && topLastAdded.length > 0 && (
              <div className="divide-y">
                {topLastAdded.map((stock) => (
                  <CompactStockRow key={stock.id} stock={stock} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default AnonHome
