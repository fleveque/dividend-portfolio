import { Sparkles, ArrowRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { LazyMotion, domAnimation, m } from 'motion/react'
import { Button } from '@/components/ui/button'
import { fadeUp, onceInView } from '../../../lib/motion'

// Bottom-of-page conversion banner. Mirrors the hero gradient so the page
// reads as bookended.
export function FinalCTA() {
  const { t } = useTranslation()

  return (
    <LazyMotion features={domAnimation}>
      <m.section
        variants={fadeUp}
        initial="hidden"
        whileInView="visible"
        viewport={onceInView}
        className="relative isolate overflow-hidden rounded-3xl mt-12 md:mt-16 mb-4"
      >
        <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-hero opacity-90" />
        <div aria-hidden className="absolute inset-0 -z-10 bg-background/40" />

        <div className="container mx-auto px-6 py-12 sm:py-16 text-center">
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-foreground mb-3">
            {t('home.finalCta.title')}
          </h2>
          <p className="text-muted-foreground text-base sm:text-lg max-w-xl mx-auto mb-6">
            {t('home.finalCta.subtitle')}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button
              asChild
              size="lg"
              className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20"
            >
              <Link to="/demo">
                <Sparkles className="size-4" /> {t('home.finalCta.primary')}
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/signup">
                {t('home.finalCta.secondary')} <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </m.section>
    </LazyMotion>
  )
}

export default FinalCTA
