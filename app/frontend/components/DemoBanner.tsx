import { Sparkles } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export function DemoBanner() {
  const { t } = useTranslation()
  return (
    <div className="bg-gradient-to-r from-emerald-500/10 via-emerald-500/15 to-teal-500/10 border-b border-emerald-500/20">
      <div className="container mx-auto px-4 py-2.5 flex items-center justify-between gap-3 flex-wrap">
        <p className="flex items-center gap-2 text-sm">
          <Sparkles className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{t('demo.banner.message')}</span>
        </p>
        <Button asChild size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white">
          <Link to="/signup">{t('demo.banner.cta')}</Link>
        </Button>
      </div>
    </div>
  )
}
