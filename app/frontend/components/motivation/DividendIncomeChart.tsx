import { useMemo } from 'react'
import { formatCurrency } from '../../lib/currency'
import type { YearSnapshot } from '../../lib/motivation'

interface Props {
  timeline: YearSnapshot[]
  currency: string
  incomeLabel: string
  objectiveLabel: string
  yearLabel: string
  todayLabel: string
  goalLabel: string
  reachedYear: number | null
}

// Dividend income over time vs the inflating monthly objective — the
// freedom-moment chart. Same shape as GrowthChart so the two stack
// cleanly on the page, but plots `monthlyDividend` and `objectiveNominal`
// instead of portfolio totals.
export function DividendIncomeChart({
  timeline,
  currency,
  incomeLabel,
  objectiveLabel,
  yearLabel,
  todayLabel,
  goalLabel,
  reachedYear,
}: Props) {
  const W = 720
  const H = 220
  const padL = 56
  const padR = 16
  const padT = 16
  const padB = 28
  const innerW = W - padL - padR
  const innerH = H - padT - padB

  const { maxY, ticks, firstYear, lastYear } = useMemo(() => {
    const raw = Math.max(
      1,
      ...timeline.map((s) => Math.max(s.monthlyDividend, s.objectiveNominal)),
    )
    const tight = tightCeil(raw * 1.05)
    return {
      maxY: tight,
      ticks: [0, tight / 4, tight / 2, (tight * 3) / 4, tight],
      firstYear: timeline[0]?.year ?? 0,
      lastYear: timeline[timeline.length - 1]?.year ?? 0,
    }
  }, [timeline])

  const yearSpan = Math.max(1, lastYear - firstYear)
  const xOf = (year: number) => padL + ((year - firstYear) / yearSpan) * innerW
  const yOf = (v: number) => padT + innerH - (v / maxY) * innerH

  const incomePath = timeline
    .map((s, i) => `${i === 0 ? 'M' : 'L'} ${xOf(s.year).toFixed(1)} ${yOf(s.monthlyDividend).toFixed(1)}`)
    .join(' ')
  const objectivePath = timeline
    .map((s, i) => `${i === 0 ? 'M' : 'L'} ${xOf(s.year).toFixed(1)} ${yOf(s.objectiveNominal).toFixed(1)}`)
    .join(' ')

  const tickEls = ticks.map((v) => (
    <g key={v}>
      <line x1={padL} x2={W - padR} y1={yOf(v)} y2={yOf(v)} className="stroke-muted-foreground/15" />
      <text
        x={padL - 8}
        y={yOf(v)}
        className="fill-muted-foreground text-[10px]"
        textAnchor="end"
        dominantBaseline="middle"
      >
        {compactCurrency(v, currency)}
      </text>
    </g>
  ))

  const xStep = Math.max(1, Math.round(yearSpan / 6))
  const xTicksSet = new Set<number>([firstYear, 0, lastYear])
  for (let y = firstYear; y <= lastYear; y += xStep) xTicksSet.add(y)
  const xTicks = Array.from(xTicksSet).sort((a, b) => a - b)

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

        {/* Objective line first (under the income curve), dashed so it
            reads as a target rather than a real trajectory. */}
        <path
          d={objectivePath}
          fill="none"
          className="stroke-amber-500"
          strokeWidth={2}
          strokeDasharray="6 4"
        />
        <path d={incomePath} fill="none" className="stroke-emerald-500" strokeWidth={2.5} />

        {timeline.map((s) => (
          <g key={s.year}>
            <circle
              cx={xOf(s.year)}
              cy={yOf(s.monthlyDividend)}
              r={6}
              className="fill-transparent"
            >
              <title>{`${yearLabel} ${s.year} — ${incomeLabel}: ${formatCurrency(s.monthlyDividend, currency)} · ${objectiveLabel}: ${formatCurrency(s.objectiveNominal, currency)}`}</title>
            </circle>
          </g>
        ))}

        {xTicks.map((y) => (
          <text
            key={y}
            x={xOf(y)}
            y={padT + innerH + 16}
            className="fill-muted-foreground text-[10px]"
            textAnchor="middle"
          >
            {y === 0 ? '0' : y > 0 ? `+${y}y` : `${y}y`}
          </text>
        ))}
      </svg>

      <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1 mt-2 text-[11px]">
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block w-3 h-[3px] bg-emerald-500 rounded-full" />
          <span className="text-muted-foreground">{incomeLabel}</span>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span
            className="inline-block w-3 h-[3px] bg-amber-500"
            style={{ background: 'repeating-linear-gradient(to right, currentColor 0 4px, transparent 4px 7px)' }}
          />
          <span className="text-muted-foreground">{objectiveLabel}</span>
        </span>
      </div>
    </div>
  )
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

export default DividendIncomeChart
