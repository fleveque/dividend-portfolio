import { useEffect, useMemo, useState } from 'react'
import { Compass, Loader2, Check, AlertTriangle, Sparkles, TrendingUp } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useProfile, useUpdateProfile } from '../hooks/useProfileQueries'
import { useHoldings } from '../hooks/useHoldingsQueries'
import { useDividends } from '../hooks/useDividendsQueries'
import { useDemoMode } from '../contexts/DemoModeContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ProgressBar } from '../components/motivation/ProgressBar'
import { GrowthChart } from '../components/motivation/GrowthChart'
import { DividendIncomeChart } from '../components/motivation/DividendIncomeChart'
import { simulate, formatEta, type MotivationInput } from '../lib/motivation'
import { formatCurrency, currencySymbol } from '../lib/currency'

// Debounce window for PATCH-on-edit — keeps the form responsive while
// the simulation runs locally on every keystroke.
const SAVE_DEBOUNCE_MS = 600

interface FormState {
  monthlyInvest: string
  monthlyObjective: string
  inflationPct: string
  yieldOverridePct: string
  startYear: string
}

const emptyForm: FormState = {
  monthlyInvest: '',
  monthlyObjective: '',
  inflationPct: '',
  yieldOverridePct: '',
  startYear: '',
}

function parseOrNull(v: string): number | null {
  const trimmed = v.trim()
  if (!trimmed) return null
  const n = parseFloat(trimmed.replace(',', '.'))
  return Number.isFinite(n) ? n : null
}

export function PathToFreedomPage() {
  const { t, i18n } = useTranslation()
  const { data: profile, isLoading: profileLoading } = useProfile()
  const { data: holdingsData, isLoading: holdingsLoading } = useHoldings()
  const { data: dividendsData } = useDividends()
  const updateProfile = useUpdateProfile()
  const { isDemoMode } = useDemoMode()

  // Earliest dividend year, used as a placeholder for the start-year input
  // so a user with real history sees a sensible default they can accept.
  const earliestDividendYear = useMemo<number | null>(() => {
    if (!dividendsData || dividendsData.length === 0) return null
    let earliest: string | null = null
    for (const d of dividendsData) {
      if (!d.date) continue
      if (!earliest || d.date < earliest) earliest = d.date
    }
    if (!earliest) return null
    const y = Number(earliest.slice(0, 4))
    return Number.isFinite(y) ? y : null
  }, [dividendsData])

  const [form, setForm] = useState<FormState>(emptyForm)
  const [saved, setSaved] = useState(false)
  const [hydrated, setHydrated] = useState(false)

  // Hydrate form from profile once it lands.
  useEffect(() => {
    if (!profile || hydrated) return
    setForm({
      monthlyInvest: profile.motivationMonthlyInvest?.toString() ?? '',
      monthlyObjective: profile.motivationMonthlyObjective?.toString() ?? '',
      inflationPct: profile.motivationInflationPct?.toString() ?? '2.5',
      yieldOverridePct: profile.motivationYieldOverridePct?.toString() ?? '',
      startYear: profile.motivationStartYear?.toString() ?? '',
    })
    setHydrated(true)
  }, [profile, hydrated])

  // Debounced PATCH on form changes. Skipped in demo mode — the debounce
  // would otherwise pop the signup nudge on every keystroke and the form
  // can still be played with locally.
  useEffect(() => {
    if (!hydrated || isDemoMode) return
    const handle = setTimeout(() => {
      updateProfile.mutate(
        {
          motivationMonthlyInvest: parseOrNull(form.monthlyInvest),
          motivationMonthlyObjective: parseOrNull(form.monthlyObjective),
          motivationInflationPct: parseOrNull(form.inflationPct),
          motivationYieldOverridePct: parseOrNull(form.yieldOverridePct),
          motivationStartYear: parseOrNull(form.startYear),
        },
        {
          onSuccess: () => {
            setSaved(true)
            setTimeout(() => setSaved(false), 2000)
          },
        },
      )
    }, SAVE_DEBOUNCE_MS)
    return () => clearTimeout(handle)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, hydrated, isDemoMode])

  const currency = profile?.preferredCurrency ?? 'USD'
  const portfolioStats = holdingsData?.portfolioStats ?? null
  const portfolioValue = portfolioStats?.displayMarketValue ?? 0
  const autoYield = portfolioStats?.displayCurrentYield ?? null

  // Active yield = override (if user set one) else current portfolio yield.
  const yieldOverrideNum = parseOrNull(form.yieldOverridePct)
  const effectiveYieldPct = yieldOverrideNum ?? autoYield ?? 0

  const simInput: MotivationInput | null = useMemo(() => {
    const monthlyObjectiveNum = parseOrNull(form.monthlyObjective)
    if (monthlyObjectiveNum === null || monthlyObjectiveNum <= 0) return null
    // Monthly invest is optional — a user who already has a portfolio
    // and wants to see how it grows on yield alone is a valid scenario.
    const monthlyInvestNum = parseOrNull(form.monthlyInvest) ?? 0
    const inflationNum = parseOrNull(form.inflationPct) ?? 2.5
    const startYearNum = parseOrNull(form.startYear)
    const currentYear = new Date().getFullYear()
    const startYearsAgo = startYearNum !== null && startYearNum < currentYear
      ? currentYear - startYearNum
      : 0
    return {
      portfolioValue,
      yieldRate: effectiveYieldPct / 100,
      inflationRate: inflationNum / 100,
      monthlyInvestReal: monthlyInvestNum,
      monthlyObjectiveReal: monthlyObjectiveNum,
      startYearsAgo,
    }
  }, [form, portfolioValue, effectiveYieldPct])

  const result = useMemo(() => (simInput ? simulate(simInput) : null), [simInput])

  if (profileLoading || holdingsLoading) {
    return (
      <div className="container mx-auto px-4 py-12 flex justify-center">
        <Loader2 className="animate-spin text-muted-foreground" />
      </div>
    )
  }

  const objectiveToday = parseOrNull(form.monthlyObjective) ?? 0

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <header className="space-y-3 max-w-2xl">
        <div className="flex items-center gap-2">
          <span className="inline-flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 text-white">
            <Compass className="size-5" />
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold">{t('freedom.title')}</h1>
        </div>
        <p className="text-sm sm:text-base text-muted-foreground">
          {t('freedom.intro')}
        </p>
      </header>

      {/* Starting point — anchors the page on the user's real portfolio
          before they touch the form. Visible regardless of input state so
          new visitors immediately see "this is where you start". */}
      <Card className="border-emerald-200 dark:border-emerald-900/40 bg-gradient-to-br from-emerald-50/60 to-cyan-50/60 dark:from-emerald-950/30 dark:to-cyan-950/20">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500 text-white">
              <Sparkles className="size-4" />
            </span>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {t('freedom.startingPoint.title')}
            </h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <p className="text-[11px] text-muted-foreground uppercase tracking-wide">
                {t('freedom.startingPoint.portfolioValue')}
              </p>
              <p className="text-2xl font-bold tabular-nums">
                {formatCurrency(portfolioValue, currency)}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground uppercase tracking-wide">
                {t('freedom.startingPoint.yield')}
              </p>
              <p className="text-2xl font-bold tabular-nums">
                {effectiveYieldPct.toFixed(2)}%
              </p>
              {yieldOverrideNum !== null && (
                <p className="text-[10px] text-muted-foreground">
                  {t('freedom.startingPoint.yieldOverride')}
                </p>
              )}
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground uppercase tracking-wide">
                {t('freedom.startingPoint.monthlyDividend')}
              </p>
              <p className="text-2xl font-bold tabular-nums">
                {formatCurrency(portfolioValue * effectiveYieldPct / 100 / 12, currency)}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {t('freedom.startingPoint.monthlyDividendHint')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Inputs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('freedom.inputs.title')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground">{t('freedom.inputs.help')}</p>
          <div className="grid sm:grid-cols-2 gap-4">
            <NumberField
              id="monthly-invest"
              label={t('freedom.inputs.monthlyInvest')}
              hint={t('freedom.inputs.monthlyInvestHint')}
              prefix={currencySymbol(currency)}
              value={form.monthlyInvest}
              onChange={(v) => setForm((f) => ({ ...f, monthlyInvest: v }))}
            />
            <NumberField
              id="monthly-objective"
              label={t('freedom.inputs.monthlyObjective')}
              hint={t('freedom.inputs.monthlyObjectiveHint')}
              prefix={currencySymbol(currency)}
              value={form.monthlyObjective}
              onChange={(v) => setForm((f) => ({ ...f, monthlyObjective: v }))}
            />
            <NumberField
              id="inflation-pct"
              label={t('freedom.inputs.inflation')}
              hint={t('freedom.inputs.inflationHint')}
              suffix="%"
              value={form.inflationPct}
              onChange={(v) => setForm((f) => ({ ...f, inflationPct: v }))}
            />
            <NumberField
              id="yield-override"
              label={t('freedom.inputs.yield')}
              hint={
                autoYield !== null
                  ? t('freedom.inputs.yieldHintWithAuto', { value: autoYield.toFixed(2) })
                  : t('freedom.inputs.yieldHint')
              }
              suffix="%"
              value={form.yieldOverridePct}
              onChange={(v) => setForm((f) => ({ ...f, yieldOverridePct: v }))}
              placeholder={autoYield !== null ? autoYield.toFixed(2) : ''}
            />
            <NumberField
              id="start-year"
              label={t('freedom.inputs.startYear')}
              hint={
                earliestDividendYear !== null
                  ? t('freedom.inputs.startYearHintFromDividends', { value: earliestDividendYear })
                  : t('freedom.inputs.startYearHint')
              }
              value={form.startYear}
              onChange={(v) => setForm((f) => ({ ...f, startYear: v }))}
              placeholder={earliestDividendYear?.toString() ?? ''}
            />
          </div>
          {updateProfile.isError && (
            <Alert variant="destructive">
              <AlertDescription>
                {updateProfile.error instanceof Error
                  ? updateProfile.error.message
                  : t('settings.failedToUpdate')}
              </AlertDescription>
            </Alert>
          )}
          {saved && (
            <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
              <Check className="h-3.5 w-3.5" /> {t('common.saved')}
            </p>
          )}
        </CardContent>
      </Card>

      {result ? (
        <>
          {/* Insights row */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              icon={<Sparkles className="size-4" />}
              label={t('freedom.insights.eta')}
              value={
                result.reached
                  ? formatEta(result.years, result.months, result.days, i18n.language)
                  : t('freedom.insights.outOfHorizon')
              }
              tone={result.reached ? 'emerald' : 'amber'}
            />
            <StatCard
              icon={<TrendingUp className="size-4" />}
              label={t('freedom.insights.finalNominal')}
              value={formatCurrency(result.finalPortfolioNominal, currency)}
              tone="cyan"
            />
            <StatCard
              icon={<TrendingUp className="size-4" />}
              label={t('freedom.insights.finalReal')}
              value={formatCurrency(result.finalPortfolioReal, currency)}
              tone="cyan"
              hint={t('freedom.insights.finalRealHint')}
            />
            <StatCard
              icon={<Sparkles className="size-4" />}
              label={t('freedom.insights.yieldEarned')}
              value={formatCurrency(result.totalYieldEarnedNominal, currency)}
              tone="emerald"
              hint={t('freedom.insights.yieldEarnedHint', {
                value: formatCurrency(result.totalContributedNominal, currency),
              })}
            />
          </div>

          {/* Progress + Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('freedom.chart.title')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <ProgressBar
                currentMonthly={result.currentMonthlyDividend}
                objectiveMonthly={objectiveToday}
                currency={currency}
                label={t('freedom.progress.todayLabel')}
              />
              <GrowthChart
                timeline={result.timeline}
                currency={currency}
                contributionsLabel={t('freedom.chart.contributions')}
                portfolioLabel={t('freedom.chart.portfolio')}
                yearLabel={t('freedom.chart.year')}
                todayLabel={t('freedom.chart.today')}
                goalLabel={t('freedom.chart.goal')}
                reachedYear={result.reached ? result.years : null}
              />

              <div className="pt-4 border-t border-border/40 space-y-2">
                <h3 className="text-sm font-semibold">{t('freedom.dividendChart.title')}</h3>
                <p className="text-xs text-muted-foreground">{t('freedom.dividendChart.subtitle')}</p>
                <DividendIncomeChart
                  timeline={result.timeline}
                  currency={currency}
                  incomeLabel={t('freedom.dividendChart.income')}
                  objectiveLabel={t('freedom.dividendChart.objective')}
                  yearLabel={t('freedom.chart.year')}
                  todayLabel={t('freedom.chart.today')}
                  goalLabel={t('freedom.chart.goal')}
                  reachedYear={result.reached ? result.years : null}
                />
              </div>

              {!result.reached && (
                <Alert>
                  <AlertTriangle className="size-4" />
                  <AlertDescription>{t('freedom.chart.unreachable')}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Per-year table */}
          <YearTable result={result} currency={currency} />
        </>
      ) : (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            {t('freedom.emptyState')}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

interface NumberFieldProps {
  id: string
  label: string
  hint?: string
  value: string
  prefix?: string
  suffix?: string
  placeholder?: string
  onChange: (v: string) => void
}

function NumberField({ id, label, hint, value, prefix, suffix, placeholder, onChange }: NumberFieldProps) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-sm">{label}</Label>
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
            {prefix}
          </span>
        )}
        <Input
          id={id}
          type="number"
          inputMode="decimal"
          step="any"
          min="0"
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={`${prefix ? 'pl-7' : ''} ${suffix ? 'pr-8' : ''} tabular-nums`}
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
            {suffix}
          </span>
        )}
      </div>
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  )
}

interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: string
  hint?: string
  tone: 'emerald' | 'cyan' | 'amber'
}

function StatCard({ icon, label, value, hint, tone }: StatCardProps) {
  const ring = {
    emerald: 'border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/40 dark:bg-emerald-950/20',
    cyan: 'border-cyan-200 dark:border-cyan-900/40 bg-cyan-50/40 dark:bg-cyan-950/20',
    amber: 'border-amber-200 dark:border-amber-900/40 bg-amber-50/40 dark:bg-amber-950/20',
  }[tone]
  const iconTone = {
    emerald: 'text-emerald-600 dark:text-emerald-400',
    cyan: 'text-cyan-600 dark:text-cyan-400',
    amber: 'text-amber-600 dark:text-amber-400',
  }[tone]
  return (
    <Card className={ring}>
      <CardContent className="p-4 space-y-1.5">
        <div className={`flex items-center gap-1.5 text-xs uppercase tracking-wide ${iconTone}`}>
          {icon}
          <span>{label}</span>
        </div>
        <p className="text-xl font-bold tabular-nums leading-tight">{value}</p>
        {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  )
}

function YearTable({ result, currency }: { result: ReturnType<typeof simulate>; currency: string }) {
  const [open, setOpen] = useState(false)
  const { t } = useTranslation()
  return (
    <Card>
      <CardContent className="p-0">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="w-full text-left p-5 text-sm font-medium hover:bg-accent/40 transition-colors flex items-center justify-between"
        >
          <span>{t('freedom.table.title')}</span>
          <span className="text-muted-foreground">{open ? '−' : '+'}</span>
        </button>
        {open && (
          <div className="overflow-x-auto px-5 pb-5">
            <table className="w-full text-xs tabular-nums">
              <thead className="text-muted-foreground">
                <tr className="border-b border-border">
                  <th className="text-left py-2">{t('freedom.table.year')}</th>
                  <th className="text-right py-2">{t('freedom.table.contributions')}</th>
                  <th className="text-right py-2">{t('freedom.table.portfolio')}</th>
                  <th className="text-right py-2">{t('freedom.table.monthlyDividend')}</th>
                  <th className="text-right py-2">{t('freedom.table.objective')}</th>
                </tr>
              </thead>
              <tbody>
                {result.timeline.map((s) => (
                  <tr key={s.year} className="border-b border-border/40 last:border-0">
                    <td className="py-1.5">+{s.year}y</td>
                    <td className="text-right">{formatCurrency(s.contributionsCum, currency)}</td>
                    <td className="text-right font-semibold">{formatCurrency(s.portfolioValue, currency)}</td>
                    <td className="text-right">{formatCurrency(s.monthlyDividend, currency)}</td>
                    <td className="text-right text-muted-foreground">{formatCurrency(s.objectiveNominal, currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default PathToFreedomPage
