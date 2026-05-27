/**
 * Path to Freedom — projection math.
 *
 * Three capital pools:
 *   - Dividend pool: monthly contributions flow in; yields reinvest until
 *     the goal is met, then pay out as income.
 *   - Interest pool (optional): bonds / real estate / savings. Compounds
 *     if `reinvestInterest` is true (default); otherwise interest is
 *     paid out and counts toward the goal during accumulation. Always
 *     paid out post-goal.
 *   - Growth pool (optional): index funds / growth stocks. Compounds at
 *     `growthRate`, no recurrent income; drawn down during distribution
 *     via the SWR alongside the other pools.
 *
 * Two phases:
 *   1. Accumulation — pools grow as above; goal is reached when annual
 *      passive income (dividends + paid-out interest) ≥ inflation-
 *      adjusted objective.
 *   2. Distribution (post-goal) — dividends + interest paid out as
 *      income; growth pool keeps compounding; an SWR (4% of total
 *      capital at goal year, inflated each year) is drawn proportionally
 *      across pools. Sustainability ends when capital is exhausted or
 *      annual income drops below the inflated objective.
 *
 * All amounts in nominal future dollars internally; user-facing
 * "today's money" stats are deflated at the end. The Ruby twin in
 * MotivationProjectionService must stay in sync.
 */

export interface MotivationInput {
  portfolioValue: number       // dividend pool today
  yieldRate: number            // decimal, e.g. 0.04
  inflationRate: number        // decimal, e.g. 0.025
  monthlyInvestReal: number    // today's money
  monthlyObjectiveReal: number // today's money
  interestCapital?: number     // bonds/real estate/savings today
  interestRate?: number        // decimal
  reinvestInterest?: boolean   // default true (compounds during accumulation)
  growthCapital?: number       // index funds / growth stocks today
  growthRate?: number          // decimal
  yearsToRetirement?: number   // force distribution to start no later than this many years from now
  maxYears?: number            // safety cap; default 60
  startYearsAgo?: number       // back-project past timeline by this many years
}

export type Phase = 'past' | 'accum' | 'distrib'

export interface YearSnapshot {
  year: number
  contributionsCum: number
  portfolioValue: number       // dividend pool nominal
  interestCapital: number      // interest pool nominal
  growthCapital: number        // growth pool nominal
  totalCapital: number         // sum of all three pools
  monthlyDividend: number      // monthly passive income (dividends + paid-out interest)
  monthlyIncome: number        // total monthly income: passive in accum, =goal in sustained distrib, drops to passive once capital is gone
  objectiveNominal: number     // inflated objective at this year
  phase: Phase
}

export interface MotivationResult {
  reached: boolean
  years: number
  months: number
  days: number
  totalDays: number
  finalPortfolioNominal: number       // total capital at goal year
  finalPortfolioReal: number
  totalContributedNominal: number
  totalYieldEarnedNominal: number
  currentMonthlyDividend: number
  progressPct: number
  timeline: YearSnapshot[]
  yearsSustainedPostGoal: number | null   // years fully meeting the inflation-adjusted goal
  yearsUntilCapitalGone: number | null    // years until total capital reaches zero
  acquisitivePowerLossYear: number | null // chart-relative year where income first drops below the inflated goal
}

// 80-year horizon: enough room for both a long accumulation (~40y) and a
// long distribution (~40y) so the capital-depletion chart actually reaches
// zero in realistic scenarios. 60 was too tight.
const DEFAULT_MAX_YEARS = 80

export function simulate(input: MotivationInput): MotivationResult {
  const {
    portfolioValue,
    yieldRate,
    inflationRate,
    monthlyInvestReal,
    monthlyObjectiveReal,
    interestCapital = 0,
    interestRate = 0,
    reinvestInterest = true,
    growthCapital = 0,
    growthRate = 0,
    yearsToRetirement,
    maxYears = DEFAULT_MAX_YEARS,
    startYearsAgo = 0,
  } = input

  const safe = (n: number, fallback = 0) => (Number.isFinite(n) ? n : fallback)
  const yDiv = Math.max(0, safe(yieldRate))
  const yInt = Math.max(0, safe(interestRate))
  const g = safe(growthRate)
  const infl = safe(inflationRate)
  const mReal = Math.max(0, safe(monthlyInvestReal))
  const objReal = Math.max(0, safe(monthlyObjectiveReal))

  let pDiv = Math.max(0, safe(portfolioValue))
  let pInt = Math.max(0, safe(interestCapital))
  let pGrowth = Math.max(0, safe(growthCapital))

  // Current passive income: dividends + (interest if it's being paid out,
  // not reinvested). This is what counts toward the goal.
  const currentPassiveAnnual = pDiv * yDiv + (reinvestInterest ? 0 : pInt * yInt)
  const currentMonthlyDividend = currentPassiveAnnual / 12
  const progressPct = objReal > 0
    ? Math.min(100, (currentMonthlyDividend / objReal) * 100)
    : 0

  const initialTotalCapital = pDiv + pInt + pGrowth

  // Past portion — annuity back-projection for the dividend pool only.
  // Interest and growth pools are held flat at their current values
  // (we don't know when the user added them).
  const nBack = startYearsAgo > 0 ? Math.min(Math.floor(startYearsAgo), maxYears) : 0
  const annualPastContrib = nBack > 0
    ? (yDiv > 1e-9
        ? portfolioValue * yDiv / (Math.pow(1 + yDiv, nBack) - 1)
        : portfolioValue / nBack)
    : 0
  const totalPastContributions = annualPastContrib * nBack

  const past: YearSnapshot[] = []
  for (let k = nBack; k >= 1; k--) {
    const yearsElapsed = nBack - k
    const pDivPast = yDiv > 1e-9
      ? annualPastContrib * (Math.pow(1 + yDiv, yearsElapsed) - 1) / yDiv
      : annualPastContrib * yearsElapsed
    past.push({
      year: -k,
      contributionsCum: annualPastContrib * yearsElapsed,
      portfolioValue: pDivPast,
      interestCapital: pInt,
      growthCapital: pGrowth,
      totalCapital: pDivPast + pInt + pGrowth,
      monthlyDividend: (pDivPast * yDiv + (reinvestInterest ? 0 : pInt * yInt)) / 12,
      monthlyIncome: (pDivPast * yDiv + (reinvestInterest ? 0 : pInt * yInt)) / 12,
      objectiveNominal: objReal * Math.pow(1 + infl, -k),
      phase: 'past',
    })
  }

  const timeline: YearSnapshot[] = [
    ...past,
    {
      year: 0,
      contributionsCum: totalPastContributions,
      portfolioValue: pDiv,
      interestCapital: pInt,
      growthCapital: pGrowth,
      totalCapital: pDiv + pInt + pGrowth,
      monthlyDividend: currentMonthlyDividend,
      monthlyIncome: currentMonthlyDividend,
      objectiveNominal: objReal,
      phase: 'accum',
    },
  ]

  const goalMetNow = objReal > 0 && currentMonthlyDividend >= objReal
  const retirementNow = yearsToRetirement !== undefined && yearsToRetirement <= 0

  // Goal already met OR user already at/past retirement age at t=0.
  if (goalMetNow || retirementNow) {
    const outcome = runDistribution({
      timeline,
      goalYearOffset: 0,
      pDiv, pInt, pGrowth,
      yDiv, yInt, g, infl, objReal,
      contributionsBaseline: totalPastContributions,
      maxYears,
    })
    return {
      reached: true,
      years: 0, months: 0, days: 0, totalDays: 0,
      finalPortfolioNominal: initialTotalCapital,
      finalPortfolioReal: initialTotalCapital,
      totalContributedNominal: 0,
      totalYieldEarnedNominal: 0,
      currentMonthlyDividend,
      progressPct,
      timeline,
      yearsSustainedPostGoal: outcome.yearsSustained,
      yearsUntilCapitalGone: outcome.yearsUntilCapitalGone,
      acquisitivePowerLossYear: outcome.acquisitivePowerLossYear,
    }
  }

  // Accumulation phase forward loop.
  let contributionsCum = 0
  let prevMonthlyPassive = currentMonthlyDividend

  for (let t = 0; t < maxYears; t++) {
    const mNom = mReal * Math.pow(1 + infl, t)
    contributionsCum += 12 * mNom

    const divIncomeYear = pDiv * yDiv
    const intIncomeYear = pInt * yInt

    pDiv = pDiv + 12 * mNom + divIncomeYear
    pInt = pInt + (reinvestInterest ? intIncomeYear : 0)
    pGrowth = pGrowth * (1 + g)

    const passiveAnnual = pDiv * yDiv + (reinvestInterest ? 0 : pInt * yInt)
    const monthlyPassive = passiveAnnual / 12
    const objNominalNext = objReal * Math.pow(1 + infl, t + 1)

    timeline.push({
      year: t + 1,
      contributionsCum: totalPastContributions + contributionsCum,
      portfolioValue: pDiv,
      interestCapital: pInt,
      growthCapital: pGrowth,
      totalCapital: pDiv + pInt + pGrowth,
      monthlyDividend: monthlyPassive,
      monthlyIncome: monthlyPassive,
      objectiveNominal: objNominalNext,
      phase: 'accum',
    })

    const goalMet = objReal > 0 && monthlyPassive >= objNominalNext
    const retirementReached = yearsToRetirement !== undefined && (t + 1) >= yearsToRetirement

    if (goalMet || retirementReached) {
      // Interpolate when the goal triggers (sub-year precision). For
      // retirement-age triggers, the user "retires on their birthday"
      // — clean full-year boundary, no interpolation.
      let totalYears: number
      if (goalMet) {
        const objNominalThis = objReal * Math.pow(1 + infl, t)
        const denom = (monthlyPassive - prevMonthlyPassive) || 1
        const fraction = Math.min(1, Math.max(0, (objNominalThis - prevMonthlyPassive) / denom))
        totalYears = t + fraction
      } else {
        totalYears = t + 1
      }
      const totalDays = Math.round(totalYears * 360)
      const years = Math.floor(totalDays / 360)
      const months = Math.floor((totalDays % 360) / 30)
      const days = totalDays % 30

      const totalCapital = pDiv + pInt + pGrowth
      const finalReal = totalCapital / Math.pow(1 + infl, t + 1)

      const outcome = runDistribution({
        timeline,
        goalYearOffset: t + 1,
        pDiv, pInt, pGrowth,
        yDiv, yInt, g, infl, objReal,
        contributionsBaseline: totalPastContributions + contributionsCum,
        maxYears,
      })

      return {
        reached: true,
        years, months, days, totalDays,
        finalPortfolioNominal: totalCapital,
        finalPortfolioReal: finalReal,
        totalContributedNominal: contributionsCum,
        totalYieldEarnedNominal: totalCapital - initialTotalCapital - contributionsCum,
        currentMonthlyDividend,
        progressPct,
        timeline,
        yearsSustainedPostGoal: outcome.yearsSustained,
        yearsUntilCapitalGone: outcome.yearsUntilCapitalGone,
        acquisitivePowerLossYear: outcome.acquisitivePowerLossYear,
      }
    }

    prevMonthlyPassive = monthlyPassive
  }

  // Out of safety horizon — never reached.
  const totalCapital = pDiv + pInt + pGrowth
  const finalReal = totalCapital / Math.pow(1 + infl, maxYears)
  return {
    reached: false,
    years: maxYears, months: 0, days: 0, totalDays: maxYears * 360,
    finalPortfolioNominal: totalCapital,
    finalPortfolioReal: finalReal,
    totalContributedNominal: contributionsCum,
    totalYieldEarnedNominal: totalCapital - initialTotalCapital - contributionsCum,
    currentMonthlyDividend,
    progressPct,
    timeline,
    yearsSustainedPostGoal: null,
    yearsUntilCapitalGone: null,
    acquisitivePowerLossYear: null,
  }
}

// Post-goal distribution — capped adaptive withdrawal. Each year we
// sell up to the inflation-adjusted gap between passive income
// (dividends + interest) and the goal, but never more than 4% of
// the capital at distribution start (inflated each year — the SWR
// ceiling). This means:
//   - When the goal can be comfortably covered: income == goal
//     (sale exactly closes the gap, no over-draw).
//   - When the goal exceeds passive + the 4% cap (typically because
//     of early retirement): sale is capped at the SWR rate and
//     income falls below the goal — acquisitive power is lost from
//     that year.
// Sales come from the growth pool first; only when growth is gone do
// we eat the dividend/interest pools. The loop continues past the
// "income drops below goal" point until total capital is zero.
interface DistributionInput {
  timeline: YearSnapshot[]
  goalYearOffset: number
  pDiv: number
  pInt: number
  pGrowth: number
  yDiv: number
  yInt: number
  g: number
  infl: number
  objReal: number
  contributionsBaseline: number
  maxYears: number
}

interface DistributionOutcome {
  yearsSustained: number | null
  yearsUntilCapitalGone: number | null
  acquisitivePowerLossYear: number | null  // absolute chart year (firstYear-relative)
}

function runDistribution(input: DistributionInput): DistributionOutcome {
  let { pDiv, pInt, pGrowth } = input
  const {
    timeline, goalYearOffset,
    yDiv, yInt, g, infl, objReal, contributionsBaseline, maxYears,
  } = input

  if (objReal <= 0) return { yearsSustained: null, yearsUntilCapitalGone: null, acquisitivePowerLossYear: null }
  if (pDiv + pInt + pGrowth <= 0) {
    return { yearsSustained: 0, yearsUntilCapitalGone: 0, acquisitivePowerLossYear: goalYearOffset }
  }

  const SWR_RATE = 0.04
  const swrBase = SWR_RATE * (pDiv + pInt + pGrowth)
  const horizon = Math.max(0, maxYears - goalYearOffset)
  let yearsSustained = horizon
  let yearsUntilCapitalGone: number | null = null
  let acquisitivePowerLossYear: number | null = null

  for (let k = 0; k < horizon; k++) {
    pGrowth = pGrowth * (1 + g)

    const requiredAnnual = objReal * 12 * Math.pow(1 + infl, goalYearOffset + k + 1)
    const currentPassive = pDiv * yDiv + pInt * yInt
    const shortfall = requiredAnnual - currentPassive
    const available = pGrowth + pDiv + pInt
    const swrCap = swrBase * Math.pow(1 + infl, k)  // SWR ceiling, inflated

    let sale = 0
    if (shortfall > 0) {
      // Sell up to whichever of the three is smallest: the gap we need
      // to close, the 4% SWR cap for this year, or the capital we
      // actually have left.
      sale = Math.min(shortfall, swrCap, available)
    }

    if (sale < shortfall && acquisitivePowerLossYear === null) {
      // Either the SWR cap or running out of capital prevented us
      // from fully meeting the inflation-adjusted goal this year.
      yearsSustained = k
      acquisitivePowerLossYear = goalYearOffset + k + 1
    }

    if (sale > 0) {
      if (pGrowth >= sale) {
        pGrowth -= sale
      } else {
        const remaining = sale - pGrowth
        pGrowth = 0
        const totOther = pDiv + pInt
        if (totOther > 0) {
          const ratio = Math.min(1, remaining / totOther)
          pDiv *= 1 - ratio
          pInt *= 1 - ratio
        }
      }
    }

    const totalCapital = pDiv + pInt + pGrowth
    const income = currentPassive + sale

    if (totalCapital <= 1e-6 && yearsUntilCapitalGone === null) {
      yearsUntilCapitalGone = k + 1
    }

    timeline.push({
      year: goalYearOffset + k + 1,
      contributionsCum: contributionsBaseline,
      portfolioValue: pDiv,
      interestCapital: pInt,
      growthCapital: pGrowth,
      totalCapital: Math.max(0, totalCapital),
      monthlyDividend: currentPassive / 12,
      monthlyIncome: income / 12,
      objectiveNominal: requiredAnnual,
      phase: 'distrib',
    })

    if (yearsUntilCapitalGone !== null && currentPassive <= 1e-6) {
      // Nothing left to draw on. Stop the chart here.
      break
    }
  }

  return { yearsSustained, yearsUntilCapitalGone, acquisitivePowerLossYear }
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
