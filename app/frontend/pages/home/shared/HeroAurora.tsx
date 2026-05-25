import { Sparkles, ArrowRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { LazyMotion, domAnimation, m } from 'motion/react'
import { Logo } from '../../../components/Logo'
import { AnimatedRotator } from './AnimatedRotator'
import { Button } from '@/components/ui/button'
import { fadeUp, staggerChildren } from '../../../lib/motion'

interface Props {
  // Anonymous hero is full-strength with both CTAs; the dashboard hero
  // (if reused there later) drops them.
  variant?: 'anon' | 'auth'
}

export function HeroAurora({ variant = 'anon' }: Props) {
  const { t } = useTranslation()

  // Rotator words come from a translated array, so the headline grammar
  // can be reordered per locale rather than locked to English structure.
  const rotatorWords = t('home.hero.rotatorWords', { returnObjects: true }) as string[]

  return (
    <LazyMotion features={domAnimation}>
      <section className="relative isolate overflow-hidden mb-12 md:mb-16">
        {/* Aurora blobs — soft, slow, behind everything. */}
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <div className="home-aurora-blob animate-home-aurora-1 absolute top-[-10%] left-[-5%] size-[55%] rounded-full bg-emerald-400/30 blur-[80px]" />
          <div className="home-aurora-blob animate-home-aurora-2 absolute top-[-15%] right-[-10%] size-[50%] rounded-full bg-fuchsia-400/25 blur-[80px]" />
          <div className="home-aurora-blob animate-home-aurora-3 absolute bottom-[-20%] left-[20%] size-[55%] rounded-full bg-cyan-400/25 blur-[80px]" />
        </div>

        <m.div
          variants={staggerChildren}
          initial="hidden"
          animate="visible"
          className="container mx-auto px-4 py-16 sm:py-24 text-center"
        >
          <m.div variants={fadeUp} className="flex justify-center mb-6">
            <Logo size="lg" showText={false} />
          </m.div>

          <m.h1
            variants={fadeUp}
            className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-foreground mb-4"
          >
            {t('home.hero.headlinePrefix')}{' '}
            <AnimatedRotator
              words={rotatorWords}
              className="bg-gradient-to-r from-emerald-600 to-cyan-600 dark:from-emerald-400 dark:to-cyan-400 bg-clip-text text-transparent"
            />
          </m.h1>

          <m.p
            variants={fadeUp}
            className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-8"
          >
            {t('home.hero.subtitle')}
          </m.p>

          {variant === 'anon' && (
            <m.div
              variants={fadeUp}
              className="flex flex-wrap items-center justify-center gap-3"
            >
              <Button
                asChild
                size="lg"
                className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20"
              >
                <Link to="/demo">
                  <Sparkles className="size-4" /> {t('home.tryDemo')}
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/signup">
                  {t('home.hero.signupCta')} <ArrowRight className="size-4" />
                </Link>
              </Button>
            </m.div>
          )}

          {variant === 'anon' && (
            <m.p
              variants={fadeUp}
              className="mt-5 text-xs text-muted-foreground"
            >
              {t('home.hero.tagline')}
            </m.p>
          )}
        </m.div>
      </section>
    </LazyMotion>
  )
}

export default HeroAurora
