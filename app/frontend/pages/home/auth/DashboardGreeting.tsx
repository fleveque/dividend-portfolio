import { useMemo } from 'react'
import { Briefcase, Eye, CalendarClock } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { LazyMotion, domAnimation, m } from 'motion/react'
import { useAuth } from '../../../contexts/AuthContext'
import { useHoldings } from '../../../hooks/useHoldingsQueries'
import { useRadar } from '../../../hooks/useRadarQueries'
import { AnimatedCounter } from '../shared/AnimatedCounter'
import { fadeUp, staggerChildren } from '../../../lib/motion'

function timeOfDayKey(): 'greetingMorning' | 'greetingAfternoon' | 'greetingEvening' {
  const h = new Date().getHours()
  if (h < 12) return 'greetingMorning'
  if (h < 18) return 'greetingAfternoon'
  return 'greetingEvening'
}

function nameFromEmail(email: string | undefined): string {
  if (!email) return ''
  const local = email.split('@')[0]
  // Reasonable casing for first.last or firstname-style locals.
  return local
    .split(/[._-]/)
    .filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(' ')
}

interface NextExDiv {
  symbol: string
  daysAway: number
}

function findNextExDiv(holdings: Array<{ stock: { symbol: string; exDividendDate: string | null } }>): NextExDiv | null {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  let best: NextExDiv | null = null
  for (const h of holdings) {
    const d = h.stock.exDividendDate
    if (!d) continue
    const date = new Date(d)
    if (Number.isNaN(date.getTime())) continue
    // Match UpcomingExDividends' rounding so both surfaces agree on
    // "in Xd" — server ships date-only strings that parse as UTC
    // midnight; comparing against local midnight gives a fractional
    // diff, so `round` is the consistent choice across components.
    const daysAway = Math.round((date.getTime() - today.getTime()) / 86_400_000)
    if (daysAway < 0) continue
    if (!best || daysAway < best.daysAway) {
      best = { symbol: h.stock.symbol, daysAway }
    }
  }
  return best
}

// Personalized header for the logged-in dashboard: greeting + three
// quick stat chips. Numeric values count up on first paint.
export function DashboardGreeting() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { data: holdingsData } = useHoldings()
  const { data: radarData } = useRadar()

  const name = nameFromEmail(user?.emailAddress)
  const holdings = holdingsData?.holdings ?? []
  const radarStocks = radarData?.stocks ?? []
  const nextExDiv = useMemo(() => findNextExDiv(holdings), [holdings])
  const greetingKey = timeOfDayKey()

  return (
    <LazyMotion features={domAnimation}>
      <m.section
        variants={staggerChildren}
        initial="hidden"
        animate="visible"
        className="mb-2"
      >
        <m.h1
          variants={fadeUp}
          className="text-2xl sm:text-4xl font-bold tracking-tight mb-4"
        >
          {t(`home.dashboard.${greetingKey}`, { name: name || t('common.investor') })}
        </m.h1>

        <m.div variants={fadeUp} className="flex flex-wrap items-center gap-2">
          <StatChip
            icon={<Briefcase className="size-3.5" />}
            label={
              <>
                <AnimatedCounter value={holdings.length} /> {t('home.dashboard.quickStats.holdingsLabel')}
              </>
            }
          />
          <StatChip
            icon={<Eye className="size-3.5" />}
            label={
              <>
                <AnimatedCounter value={radarStocks.length} /> {t('home.dashboard.quickStats.radarLabel')}
              </>
            }
          />
          <StatChip
            icon={<CalendarClock className="size-3.5" />}
            label={
              nextExDiv
                ? t('home.dashboard.quickStats.nextExDiv', { symbol: nextExDiv.symbol, daysAway: nextExDiv.daysAway })
                : t('home.dashboard.quickStats.noUpcoming')
            }
          />
        </m.div>
      </m.section>
    </LazyMotion>
  )
}

function StatChip({ icon, label }: { icon: React.ReactNode; label: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs sm:text-sm text-muted-foreground">
      <span className="text-foreground/70">{icon}</span>
      <span className="text-foreground">{label}</span>
    </span>
  )
}

export default DashboardGreeting
