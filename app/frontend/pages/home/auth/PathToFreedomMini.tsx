import { Compass, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useProfile } from '../../../hooks/useProfileQueries'
import { Card, CardContent } from '@/components/ui/card'
import { ProgressBar } from '../../../components/motivation/ProgressBar'
import { formatEta } from '../../../lib/motivation'
import { formatCurrency } from '../../../lib/currency'
import { useDemoMode } from '../../../contexts/DemoModeContext'

// Dashboard widget — reads the cached MotivationSummary straight from
// profile (computed server-side, invalidated on input/portfolio change),
// so there's no per-visit recomputation here. Hidden until the user has
// filled in the inputs on /freedom.
export function PathToFreedomMini() {
  const { t, i18n } = useTranslation()
  const { data: profile } = useProfile()
  const { isDemoMode } = useDemoMode()
  const summary = profile?.motivationSummary
  const objective = profile?.motivationMonthlyObjective
  if (!summary || !objective || objective <= 0) return null

  const currency = summary.currency ?? profile?.preferredCurrency ?? 'USD'

  const etaLabel = summary.reached
    ? formatEta(summary.years, summary.months, summary.days, i18n.language)
    : t('freedom.insights.outOfHorizon')

  return (
    <Card>
      <CardContent className="p-5 space-y-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500 text-white">
            <Compass className="size-4" />
          </span>
          <h3 className="text-sm font-semibold">{t('freedom.homeMini.title')}</h3>
        </div>

        <ProgressBar
          currentMonthly={summary.currentMonthlyDividend}
          objectiveMonthly={objective}
          currency={currency}
          label={t('freedom.homeMini.progressLabel')}
        />

        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">{t('freedom.homeMini.eta')}</span>
          <span className="font-semibold tabular-nums">{etaLabel}</span>
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">{t('freedom.homeMini.finalReal')}</span>
          <span className="font-semibold tabular-nums">
            {formatCurrency(summary.finalPortfolioReal, currency)}
          </span>
        </div>

        <Link
          to={isDemoMode ? '/demo/freedom' : '/freedom'}
          className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-300 hover:underline pt-1"
        >
          {t('freedom.homeMini.cta')} <ArrowRight className="size-3" />
        </Link>
      </CardContent>
    </Card>
  )
}

export default PathToFreedomMini
