import { Briefcase, ArrowRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

// Replaces PortfolioStatsCard on the dashboard when the user hasn't
// added any holdings yet — turns an empty card into an invitation.
export function EmptyPortfolioCTA() {
  const { t } = useTranslation()

  return (
    <section className="relative isolate overflow-hidden rounded-2xl border border-border bg-card p-8 sm:p-10 text-center">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-gradient-hero opacity-30" />
      <div className="mx-auto mb-4 inline-flex size-14 items-center justify-center rounded-2xl bg-gradient-emerald-cyan text-white shadow-md">
        <Briefcase className="size-7" />
      </div>
      <h2 className="text-xl sm:text-2xl font-bold mb-2">
        {t('home.dashboard.emptyPortfolio.title')}
      </h2>
      <p className="text-muted-foreground text-sm sm:text-base max-w-md mx-auto mb-5">
        {t('home.dashboard.emptyPortfolio.body')}
      </p>
      <Button
        asChild
        size="lg"
        className="bg-emerald-600 hover:bg-emerald-700 text-white"
      >
        <Link to="/portfolio">
          {t('home.dashboard.emptyPortfolio.cta')} <ArrowRight className="size-4" />
        </Link>
      </Button>
    </section>
  )
}

export default EmptyPortfolioCTA
