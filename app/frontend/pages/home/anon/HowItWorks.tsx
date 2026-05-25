import { Eye, BarChart3, Sparkles } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { LazyMotion, domAnimation, m } from 'motion/react'
import { fadeUp, staggerChildren, onceInView } from '../../../lib/motion'

// Three-step product explainer. Replaces the old carousel-based
// `FeatureShowcase` with something that reads in 5s. Each step is a
// gradient-tinted icon disc + one-line copy. Stagger-fades into view.
export function HowItWorks() {
  const { t } = useTranslation()

  const steps = [
    {
      icon: Eye,
      gradient: 'from-emerald-500 to-cyan-500',
      title: t('home.howItWorks.step1Title'),
      body: t('home.howItWorks.step1Body'),
    },
    {
      icon: BarChart3,
      gradient: 'from-cyan-500 to-blue-500',
      title: t('home.howItWorks.step2Title'),
      body: t('home.howItWorks.step2Body'),
    },
    {
      icon: Sparkles,
      gradient: 'from-violet-500 to-fuchsia-500',
      title: t('home.howItWorks.step3Title'),
      body: t('home.howItWorks.step3Body'),
    },
  ] as const

  return (
    <LazyMotion features={domAnimation}>
      <section className="text-center">
        <m.h2
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={onceInView}
          transition={{ duration: 0.4 }}
          className="text-2xl sm:text-3xl font-bold tracking-tight mb-10"
        >
          {t('home.howItWorks.title')}
        </m.h2>

        <m.div
          variants={staggerChildren}
          initial="hidden"
          whileInView="visible"
          viewport={onceInView}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {steps.map((step, i) => {
            const Icon = step.icon
            return (
              <m.div
                key={i}
                variants={fadeUp}
                className="relative rounded-2xl border border-border bg-card p-6 text-left transition-transform hover:-translate-y-0.5"
              >
                <div
                  className={`mb-4 inline-flex size-12 items-center justify-center rounded-xl bg-gradient-to-br ${step.gradient} text-white shadow-md`}
                >
                  <Icon className="size-6" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.body}</p>
              </m.div>
            )
          })}
        </m.div>
      </section>
    </LazyMotion>
  )
}

export default HowItWorks
