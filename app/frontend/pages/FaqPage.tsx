import { useState } from 'react'
import { ChevronDown, ExternalLink, HelpCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { LazyMotion, domAnimation, m } from 'motion/react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { fadeUp, staggerChildren, onceInView } from '../lib/motion'

interface SectionDef {
  key: string
  items: string[]
}

// FAQ data — sections + items. Each item maps to two i18n keys:
// `faq.<section>.<item>.q` (question) and `faq.<section>.<item>.a` (answer).
// Keeping the structure declarative lets translators add/reorder items
// without touching the page component.
const SECTIONS: SectionDef[] = [
  { key: 'gettingStarted', items: ['free', 'broker', 'tryWithoutSignup', 'portfolioVsRadar'] },
  { key: 'portfolioRadar', items: ['addHolding', 'multiCurrency', 'yoc', 'targetPrice', 'communityTarget', 'score'] },
  { key: 'dividends', items: ['upcoming', 'import', 'brokerSupport', 'unsupportedBroker'] },
  { key: 'ai', items: ['model', 'limit', 'privacy'] },
  { key: 'pulse', items: ['what', 'whoSees', 'optOut'] },
  { key: 'telegram', items: ['connect', 'what'] },
  { key: 'dataPrivacy', items: ['stockData', 'accuracy', 'sell'] },
]

const ISSUES_URL = 'https://github.com/fleveque/dividend-portfolio/issues'

export function FaqPage() {
  const { t } = useTranslation()

  return (
    <LazyMotion features={domAnimation}>
      <div className="container mx-auto px-4 py-8 max-w-3xl space-y-10">
        {/* Hero */}
        <m.header
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center"
        >
          <div className="mx-auto mb-4 inline-flex size-12 items-center justify-center rounded-2xl bg-gradient-emerald-cyan text-white shadow-md">
            <HelpCircle className="size-6" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2">
            {t('faq.title')}
          </h1>
          <p className="text-muted-foreground text-base sm:text-lg max-w-xl mx-auto">
            {t('faq.subtitle')}
          </p>
        </m.header>

        {/* Sections */}
        {SECTIONS.map((section) => (
          <m.section
            key={section.key}
            variants={staggerChildren}
            initial="hidden"
            whileInView="visible"
            viewport={onceInView}
            className="space-y-3"
          >
            <m.h2
              variants={fadeUp}
              className="text-lg sm:text-xl font-bold tracking-tight flex items-center gap-2"
            >
              <span className="w-1 h-5 bg-foreground rounded-full" />
              {t(`faq.sections.${section.key}`)}
            </m.h2>

            <m.ul variants={staggerChildren} className="space-y-2">
              {section.items.map((item) => (
                <m.li key={item} variants={fadeUp}>
                  <FaqItem
                    qKey={`faq.${section.key}.${item}.q`}
                    aKey={`faq.${section.key}.${item}.a`}
                  />
                </m.li>
              ))}
            </m.ul>
          </m.section>
        ))}

        {/* Not-found footer */}
        <m.section
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={onceInView}
          transition={{ duration: 0.4 }}
          className="rounded-2xl border border-border bg-card p-6 text-center"
        >
          <p className="text-sm sm:text-base text-muted-foreground mb-3">
            {t('faq.notFound.body')}
          </p>
          <a
            href={ISSUES_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700 dark:text-emerald-300 hover:underline"
          >
            {t('faq.notFound.cta')} <ExternalLink className="size-3.5" />
          </a>
        </m.section>
      </div>
    </LazyMotion>
  )
}

interface FaqItemProps {
  qKey: string
  aKey: string
}

function FaqItem({ qKey, aKey }: FaqItemProps) {
  const { t } = useTranslation()
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <Card className={cn('transition-colors', isExpanded && 'border-emerald-500/30')}>
      <button
        type="button"
        onClick={() => setIsExpanded((v) => !v)}
        className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left cursor-pointer"
        aria-expanded={isExpanded}
      >
        <span className="text-sm sm:text-base font-medium leading-snug">{t(qKey)}</span>
        <ChevronDown
          className={cn(
            'size-4 shrink-0 text-muted-foreground transition-transform duration-200',
            isExpanded && 'rotate-180'
          )}
        />
      </button>
      {isExpanded && (
        <CardContent className="pt-0 pb-5 px-5">
          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
            {t(aKey)}
          </p>
        </CardContent>
      )}
    </Card>
  )
}

export default FaqPage
