import { Compass, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Card, CardContent } from '@/components/ui/card'

// Anon-home announcement for Path to Freedom. Same gradient-bordered Card
// pattern as the Pulse banner above it — keeps the landing page visually
// consistent and the CTA points at signup.
export function PathToFreedomShowcase() {
  const { t } = useTranslation()
  return (
    <Card className="border-emerald-200 dark:border-emerald-900/40 bg-gradient-to-r from-emerald-50 to-cyan-50 dark:from-emerald-950/30 dark:to-cyan-950/20 overflow-hidden">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between">
          <div className="space-y-3 max-w-2xl">
            <div className="flex items-center gap-2">
              <Compass className="size-5 text-emerald-600 dark:text-emerald-400" />
              <h2 className="text-xl sm:text-2xl font-bold text-foreground leading-tight">
                {t('freedom.anonShowcase.title')}
              </h2>
            </div>
            <p className="text-sm sm:text-base text-muted-foreground">
              {t('freedom.anonShowcase.description')}
            </p>
            <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-1 text-xs sm:text-sm text-muted-foreground">
              <li>• {t('freedom.anonShowcase.bullet1')}</li>
              <li>• {t('freedom.anonShowcase.bullet2')}</li>
              <li>• {t('freedom.anonShowcase.bullet3')}</li>
              <li>• {t('freedom.anonShowcase.bullet4')}</li>
            </ul>
          </div>
          <Link
            to="/signup"
            className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 text-sm font-medium transition-colors shrink-0"
          >
            {t('freedom.anonShowcase.cta')} <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

export default PathToFreedomShowcase
