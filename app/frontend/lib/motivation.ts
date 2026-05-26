/**
 * Path to Freedom — projection math.
 *
 * Inputs are in "today's money" (real terms): both the monthly contribution
 * and the dividend objective inflate every year so the user's goal is honest
 * across decades. The simulation itself runs in nominal terms (literal future
 * money); we deflate at the end to report the final value in today's terms.
 *
 * Yearly step:
 *   m_nom[t] = m_real * (1+infl)^t
 *   P[t+1]   = P[t] + 12*m_nom[t] + P[t]*y
 *   stop when  P[t+1] * y / 12  >=  obj_real * (1+infl)^(t+1)
 *
 * Kept as pure functions so the same logic can be unit-tested without React.
 * The Ruby twin in MotivationProjectionService must match.
 */

export interface MotivationInput {
  portfolioValue: number      // today, preferred currency
  yieldRate: number           // decimal, e.g. 0.04
  inflationRate: number       // decimal, e.g. 0.025
  monthlyInvestReal: number   // today's money
  monthlyObjectiveReal: number // today's money
  maxYears?: number           // safety cap; default 60
  startYearsAgo?: number      // back-project past timeline by this many years
}

export interface YearSnapshot {
  year: number                // 0..t
  contributionsCum: number    // nominal cumulative contributions
  portfolioValue: number      // nominal portfolio value (end of year)
  monthlyDividend: number     // nominal: portfolio * yield / 12
  objectiveNominal: number    // objective inflated to this year
}

export interface MotivationResult {
  reached: boolean
  years: number               // integer years to goal
  months: number              // 0..11
  days: number                // 0..30 (approx, 30/year)
  totalDays: number           // years*365 + months*30 + days (for progress bars)
  finalPortfolioNominal: number
  finalPortfolioReal: number
  totalContributedNominal: number
  totalYieldEarnedNominal: number
  // Progress *today* — how close we already are to the (today-money) objective.
  currentMonthlyDividend: number
  progressPct: number          // 0..100, current vs objective today
  timeline: YearSnapshot[]     // includes year 0 (today)
}

const DEFAULT_MAX_YEARS = 60

export function simulate(input: MotivationInput): MotivationResult {
  const {
    portfolioValue,
    yieldRate,
    inflationRate,
    monthlyInvestReal,
    monthlyObjectiveReal,
    maxYears = DEFAULT_MAX_YEARS,
    startYearsAgo = 0,
  } = input

  const safe = (n: number, fallback = 0) => (Number.isFinite(n) ? n : fallback)
  const y = Math.max(0, safe(yieldRate))
  const infl = safe(inflationRate)
  const mReal = Math.max(0, safe(monthlyInvestReal))
  const objReal = Math.max(0, safe(monthlyObjectiveReal))

  const currentMonthlyDividend = portfolioValue * y / 12
  const progressPct = objReal > 0
    ? Math.min(100, (currentMonthlyDividend / objReal) * 100)
    : 0

  // Past portion: annuity model. We back-solve the constant annual
  // contribution c that grows $0 → portfolioValue over nBack years at
  // the current yield y, then plot the resulting compounding curve.
  // Both lines meet at $0 at year=-nBack and at (totalPastContributions,
  // portfolioValue) today, with portfolio strictly above contributions
  // whenever y > 0 (because compounding > linear). Honours the user's
  // start year and tells the right story: "this is what your journey
  // looked like to reach today's value at today's yield".
  const nBack = startYearsAgo > 0
    ? Math.min(Math.floor(startYearsAgo), maxYears)
    : 0
  const annualPastContrib = nBack > 0
    ? (y > 1e-9
        ? portfolioValue * y / (Math.pow(1 + y, nBack) - 1)
        : portfolioValue / nBack)
    : 0
  const totalPastContributions = annualPastContrib * nBack

  const past: YearSnapshot[] = []
  for (let k = nBack; k >= 1; k--) {
    const yearsElapsed = nBack - k  // 0 at start year, approaches nBack today
    const contribAtK = annualPastContrib * yearsElapsed
    const portfolioAtK = y > 1e-9
      ? annualPastContrib * (Math.pow(1 + y, yearsElapsed) - 1) / y
      : annualPastContrib * yearsElapsed
    past.push({
      year: -k,
      contributionsCum: contribAtK,
      portfolioValue: portfolioAtK,
      monthlyDividend: portfolioAtK * y / 12,
      objectiveNominal: objReal * Math.pow(1 + infl, -k),
    })
  }

  const timeline: YearSnapshot[] = [
    ...past,
    {
      year: 0,
      contributionsCum: totalPastContributions,
      portfolioValue,
      monthlyDividend: currentMonthlyDividend,
      objectiveNominal: objReal,
    },
  ]

  // Already there at t=0 — short-circuit.
  if (objReal > 0 && currentMonthlyDividend >= objReal) {
    return {
      reached: true,
      years: 0, months: 0, days: 0, totalDays: 0,
      finalPortfolioNominal: portfolioValue,
      finalPortfolioReal: portfolioValue,
      totalContributedNominal: 0,
      totalYieldEarnedNominal: 0,
      currentMonthlyDividend,
      progressPct,
      timeline,
    }
  }

  let portfolio = portfolioValue
  let contributionsCum = 0
  let prevPortfolio = portfolioValue

  for (let t = 0; t < maxYears; t++) {
    const mNom = mReal * Math.pow(1 + infl, t)
    const contribYear = 12 * mNom
    const yieldYear = portfolio * y
    prevPortfolio = portfolio
    portfolio = portfolio + contribYear + yieldYear
    contributionsCum += contribYear

    const objNominalNext = objReal * Math.pow(1 + infl, t + 1)
    const monthlyDivNominal = portfolio * y / 12

    timeline.push({
      year: t + 1,
      contributionsCum: totalPastContributions + contributionsCum,
      portfolioValue: portfolio,
      monthlyDividend: monthlyDivNominal,
      objectiveNominal: objNominalNext,
    })

    if (objReal > 0 && y > 0 && monthlyDivNominal >= objNominalNext) {
      // Linear interpolation across the year we just simulated to pin down
      // a more honest months/days estimate. Good enough for a motivation
      // tool; nobody is timing the freedom date to the calendar day.
      const prevMonthlyDiv = prevPortfolio * y / 12
      const objNominalThis = objReal * Math.pow(1 + infl, t)
      const denom = (monthlyDivNominal - prevMonthlyDiv) || 1
      const fractionRaw = (objNominalThis - prevMonthlyDiv) / denom
      const fraction = Math.min(1, Math.max(0, fractionRaw))
      const totalYears = t + fraction
      const totalDays = Math.round(totalYears * 360)
      const years = Math.floor(totalDays / 360)
      const months = Math.floor((totalDays % 360) / 30)
      const days = totalDays % 30

      const finalReal = portfolio / Math.pow(1 + infl, t + 1)
      return {
        reached: true,
        years, months, days, totalDays,
        finalPortfolioNominal: portfolio,
        finalPortfolioReal: finalReal,
        totalContributedNominal: contributionsCum,
        totalYieldEarnedNominal: portfolio - portfolioValue - contributionsCum,
        currentMonthlyDividend,
        progressPct,
        timeline,
      }
    }
  }

  // Out of safety horizon.
  const finalReal = portfolio / Math.pow(1 + infl, maxYears)
  return {
    reached: false,
    years: maxYears, months: 0, days: 0, totalDays: maxYears * 360,
    finalPortfolioNominal: portfolio,
    finalPortfolioReal: finalReal,
    totalContributedNominal: contributionsCum,
    totalYieldEarnedNominal: portfolio - portfolioValue - contributionsCum,
    currentMonthlyDividend,
    progressPct,
    timeline,
  }
}

// Locale-aware compact ETA renderer. Avoids Spanish ambiguity — "8 a 4 m"
// would read as "8 *to* 4 m" since "a" is a preposition; we use full words
// with proper plurals.
export function formatEta(
  years: number,
  months: number,
  days: number,
  locale: string,
): string {
  const isEs = locale.startsWith('es')
  const parts: string[] = []
  if (years > 0) {
    parts.push(isEs ? `${years} ${years === 1 ? 'año' : 'años'}` : `${years}y`)
  }
  if (months > 0) {
    parts.push(isEs ? `${months} ${months === 1 ? 'mes' : 'meses'}` : `${months}mo`)
  }
  if (years === 0 && months === 0 && days > 0) {
    parts.push(isEs ? `${days} ${days === 1 ? 'día' : 'días'}` : `${days}d`)
  }
  if (parts.length === 0) return isEs ? 'Ya' : 'Now'
  return parts.join(' ')
}
