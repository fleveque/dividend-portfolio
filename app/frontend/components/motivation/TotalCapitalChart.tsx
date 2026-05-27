import { useMemo } from 'react'
import { formatCurrency } from '../../lib/currency'
import type { YearSnapshot } from '../../lib/motivation'

interface Props {
  timeline: YearSnapshot[]
  currency: string
  totalLabel: string
  distributionLabel: string
  incomeLabel: string
  yearLabel: string
  todayLabel: string
  goalLabel: string
  reachedYear: number | null
  acquisitivePowerLossYear: number | null
  acquisitivePowerLossLabel: string
  currentAge: number | null
  ageAxisLabel: string
}

// Total capital across all three pools over the full projection — past
// + accumulation + distribution. The accumulation→distribution
// inflection (capital peak at goal year) is the "freedom moment" in
// this view; capital then declines as the SWR draws it down.
export function TotalCapitalChart({
  timeline,
  currency,
  totalLabel,
  distributionLabel,
  incomeLabel,
  yearLabel,
  todayLabel,
  goalLabel,
  reachedYear,
  acquisitivePowerLossYear,
  acquisitivePowerLossLabel,
  currentAge,
  ageAxisLabel,
}: Props) {
  const W = 720
  const showAgeRow = currentAge !== null
  const H = showAgeRow ? 232 : 220
  // Bigger right padding to leave room for the income axis labels.
  const padL = 56
  const padR = 56
  const padT = 16
  const padB = showAgeRow ? 40 : 28
  const innerW = W - padL - padR
  const innerH = H - padT - padB

  const { maxCapital, maxIncome, capitalTicks, incomeTicks, firstYear, lastYear } = useMemo(() => {
    const rawCap = Math.max(1, ...timeline.map((s) => s.totalCapital))
    const rawInc = Math.max(1, ...timeline.map((s) => s.monthlyIncome))
    const tightCap = tightCeil(rawCap * 1.05)
    const tightInc = tightCeil(rawInc * 1.1)
    return {
      maxCapital: tightCap,
      maxIncome: tightInc,
      capitalTicks: [0, tightCap / 4, tightCap / 2, (tightCap * 3) / 4, tightCap],
      incomeTicks: [0, tightInc / 4, tightInc / 2, (tightInc * 3) / 4, tightInc],
      firstYear: timeline[0]?.year ?? 0,
      lastYear: timeline[timeline.length - 1]?.year ?? 0,
    }
  }, [timeline])

  const yearSpan = Math.max(1, lastYear - firstYear)
  const xOf = (year: number) => padL + ((year - firstYear) / yearSpan) * innerW
  const yOfCapital = (v: number) => padT + innerH - (v / maxCapital) * innerH
  const yOfIncome = (v: number) => padT + innerH - (v / maxIncome) * innerH

  // Split path by phase so we can colour accum vs distrib differently.
  const accumPoints = timeline.filter((s) => s.phase !== 'distrib')
  const distribPoints = timeline.filter((s) => s.phase === 'distrib')
  // Distribution path starts from the last accumulation point so the
  // two segments visually connect without a gap.
  const distribWithAnchor = distribPoints.length > 0 && accumPoints.length > 0
    ? [accumPoints[accumPoints.length - 1], ...distribPoints]
    : distribPoints

  const capitalPathFrom = (pts: YearSnapshot[]) =>
    pts
      .map((s, i) => `${i === 0 ? 'M' : 'L'} ${xOf(s.year).toFixed(1)} ${yOfCapital(s.totalCapital).toFixed(1)}`)
      .join(' ')
  const incomePath = timeline
    .map((s, i) => `${i === 0 ? 'M' : 'L'} ${xOf(s.year).toFixed(1)} ${yOfIncome(s.monthlyIncome).toFixed(1)}`)
    .join(' ')

  // Left axis (capital) ticks + grid lines.
  const tickEls = capitalTicks.map((v) => (
    <g key={`cap-${v}`}>
      <line x1={padL} x2={W - padR} y1={yOfCapital(v)} y2={yOfCapital(v)} className="stroke-muted-foreground/15" />
      <text
        x={padL - 8}
        y={yOfCapital(v)}
        className="fill-muted-foreground text-[10px]"
        textAnchor="end"
        dominantBaseline="middle"
      >
        {compactCurrency(v, currency)}
      </text>
    </g>
  ))
  // Right axis (monthly income) — labels only; grid lines stay on the
  // capital axis to avoid visual clutter from two grid sets.
  const incomeTickEls = incomeTicks.map((v) => (
    <text
      key={`inc-${v}`}
      x={W - padR + 8}
      y={yOfIncome(v)}
      className="fill-sky-600 dark:fill-sky-400 text-[10px]"
      textAnchor="start"
      dominantBaseline="middle"
    >
      {compactCurrency(v, currency)}
    </text>
  ))

  const xTicks = computeXTicks(firstYear, lastYear, reachedYear, innerW)

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto min-w-[600px]" role="img">
        {tickEls}

        <line
          x1={padL}
          x2={W - padR}
          y1={padT + innerH}
          y2={padT + innerH}
          className="stroke-muted-foreground/30"
        />

        <line
          x1={xOf(0)}
          x2={xOf(0)}
          y1={padT}
          y2={padT + innerH}
          className="stroke-emerald-500/40"
          strokeDasharray="3 3"
        />
        <text
          x={xOf(0) + 4}
          y={padT + 12}
          className="fill-emerald-600 dark:fill-emerald-400 text-[10px] font-semibold"
        >
          {todayLabel}
        </text>

        {reachedYear !== null && reachedYear > 0 && (
          <>
            <line
              x1={xOf(reachedYear)}
              x2={xOf(reachedYear)}
              y1={padT}
              y2={padT + innerH}
              className="stroke-amber-500/60"
              strokeDasharray="3 3"
            />
            <text
              x={xOf(reachedYear) - 4}
              y={padT + 12}
              className="fill-amber-600 dark:fill-amber-400 text-[10px] font-semibold"
              textAnchor="end"
            >
              {goalLabel}
            </text>
          </>
        )}

        {acquisitivePowerLossYear !== null && acquisitivePowerLossYear > firstYear && acquisitivePowerLossYear <= lastYear && (
          <>
            <line
              x1={xOf(acquisitivePowerLossYear)}
              x2={xOf(acquisitivePowerLossYear)}
              y1={padT}
              y2={padT + innerH}
              className="stroke-rose-500/70"
              strokeDasharray="4 3"
            />
            <text
              x={xOf(acquisitivePowerLossYear) + 4}
              y={padT + 24}
              className="fill-rose-600 dark:fill-rose-400 text-[10px] font-semibold"
            >
              {acquisitivePowerLossLabel}
            </text>
          </>
        )}

        <path d={capitalPathFrom(accumPoints)} fill="none" className="stroke-emerald-500" strokeWidth={2.5} />
        {distribWithAnchor.length > 1 && (
          <path
            d={capitalPathFrom(distribWithAnchor)}
            fill="none"
            className="stroke-rose-500"
            strokeWidth={2.5}
          />
        )}

        <path d={incomePath} fill="none" className="stroke-sky-500" strokeWidth={2} strokeDasharray="4 3" />

        {incomeTickEls}

        {timeline.map((s) => (
          <g key={s.year}>
            <circle
              cx={xOf(s.year)}
              cy={yOfCapital(s.totalCapital)}
              r={6}
              className="fill-transparent"
            >
              <title>{`${yearLabel} ${s.year} — ${totalLabel}: ${formatCurrency(s.totalCapital, currency)} · ${incomeLabel}: ${formatCurrency(s.monthlyIncome, currency)}`}</title>
            </circle>
          </g>
        ))}

        {xTicks.map((y) => (
          <g key={y}>
            <text
              x={xOf(y)}
              y={padT + innerH + 16}
              className="fill-muted-foreground text-[10px]"
              textAnchor="middle"
            >
              {y === 0 ? '0' : y > 0 ? `+${y}y` : `${y}y`}
            </text>
            {showAgeRow && currentAge !== null && (
              <text
                x={xOf(y)}
                y={padT + innerH + 30}
                className="fill-muted-foreground/70 text-[10px]"
                textAnchor="middle"
              >
                {currentAge + y}
              </text>
            )}
          </g>
        ))}
        {showAgeRow && currentAge !== null && (
          <text
            x={padL - 8}
            y={padT + innerH + 30}
            className="fill-muted-foreground/70 text-[9px] italic"
            textAnchor="end"
            dominantBaseline="middle"
          >
            {ageAxisLabel}
          </text>
        )}
      </svg>

      <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1 mt-2 text-[11px]">
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block w-3 h-[3px] bg-emerald-500 rounded-full" />
          <span className="text-muted-foreground">{totalLabel}</span>
        </span>
        {distribWithAnchor.length > 1 && (
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block w-3 h-[3px] bg-rose-500 rounded-full" />
            <span className="text-muted-foreground">{distributionLabel}</span>
          </span>
        )}
        <span className="inline-flex items-center gap-1.5">
          <span
            className="inline-block w-3 h-[3px]"
            style={{ background: 'repeating-linear-gradient(to right, currentColor 0 3px, transparent 3px 6px)', color: '#0ea5e9' }}
          />
          <span className="text-muted-foreground">{incomeLabel}</span>
        </span>
      </div>
    </div>
  )
}

const LABEL_MIN_PX = 56
function computeXTicks(
  firstYear: number,
  lastYear: number,
  reachedYear: number | null,
  innerWidthPx: number,
): number[] {
  const span = Math.max(1, lastYear - firstYear)
  const minDistYears = (LABEL_MIN_PX / innerWidthPx) * span
  const ticks: number[] = []
  const tryAdd = (t: number) => {
    if (t < firstYear || t > lastYear) return
    if (ticks.some((existing) => Math.abs(existing - t) < minDistYears)) return
    ticks.push(t)
  }
  tryAdd(0)
  if (reachedYear !== null) tryAdd(reachedYear)
  tryAdd(lastYear)
  tryAdd(firstYear)
  const step = Math.max(1, Math.round(span / 6))
  for (let y = firstYear; y <= lastYear; y += step) tryAdd(y)
  return ticks.sort((a, b) => a - b)
}

function tightCeil(value: number): number {
  if (value <= 0) return 1
  const pow = Math.pow(10, Math.floor(Math.log10(value)))
  const norm = value / pow
  const steps = [1, 1.25, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]
  const ceil = steps.find((s) => norm <= s) ?? 10
  return ceil * pow
}

function compactCurrency(value: number, currency: string): string {
  if (value >= 1_000_000) return trimDecimalZeros(formatCurrency(value / 1_000_000, currency)) + 'M'
  if (value >= 1_000) return trimDecimalZeros(formatCurrency(value / 1_000, currency)) + 'k'
  return trimDecimalZeros(formatCurrency(value, currency))
}

function trimDecimalZeros(s: string): string {
  return s.replace(/\.?0+$/, '')
}

export default TotalCapitalChart
