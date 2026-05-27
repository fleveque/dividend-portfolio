import { useMemo } from 'react'
import { formatCurrency } from '../../lib/currency'
import type { YearSnapshot } from '../../lib/motivation'

interface Props {
  timeline: YearSnapshot[]
  currency: string
  contributionsLabel: string
  portfolioLabel: string
  yearLabel: string
  todayLabel: string
  goalLabel: string
  reachedYear: number | null
  currentAge: number | null
  ageAxisLabel: string
}

// Custom SVG, no chart lib — matches the codebase's DividendChart style.
// Two polylines: cumulative contributions vs total portfolio value. The
// gap between them is the compounded yield. Axes are bare on purpose;
// hover tooltips via <title> on the polyline points carry the numbers.
export function GrowthChart({
  timeline,
  currency,
  contributionsLabel,
  portfolioLabel,
  yearLabel,
  todayLabel,
  goalLabel,
  reachedYear,
  currentAge,
  ageAxisLabel,
}: Props) {
  const W = 720
  // Extra bottom padding when the optional "age" row is rendered so the
  // year labels and age labels don't overlap.
  const showAgeRow = currentAge !== null
  const H = showAgeRow ? 252 : 240
  const padL = 56
  const padR = 16
  const padT = 16
  const padB = showAgeRow ? 40 : 28
  const innerW = W - padL - padR
  const innerH = H - padT - padB

  const { maxY, ticks, firstYear, lastYear } = useMemo(() => {
    const raw = Math.max(
      1,
      ...timeline.map((s) => Math.max(s.portfolioValue, s.contributionsCum)),
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

  const contribPath = timeline
    .map((s, i) => `${i === 0 ? 'M' : 'L'} ${xOf(s.year).toFixed(1)} ${yOf(s.contributionsCum).toFixed(1)}`)
    .join(' ')
  const portfolioPath = timeline
    .map((s, i) => `${i === 0 ? 'M' : 'L'} ${xOf(s.year).toFixed(1)} ${yOf(s.portfolioValue).toFixed(1)}`)
    .join(' ')

  // Y-axis grid + labels
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

  const xTicks = computeXTicks(firstYear, lastYear, reachedYear, innerW)

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto min-w-[600px]" role="img">
        {tickEls}

        {/* Axis line */}
        <line
          x1={padL}
          x2={W - padR}
          y1={padT + innerH}
          y2={padT + innerH}
          className="stroke-muted-foreground/30"
        />

        {/* "Today" marker */}
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

        {/* Goal marker (if reached) */}
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

        {/* Polylines */}
        <path d={contribPath} fill="none" className="stroke-cyan-500" strokeWidth={2} />
        <path d={portfolioPath} fill="none" className="stroke-emerald-500" strokeWidth={2.5} />

        {/* Hover dots — tiny invisible circles per year carrying <title> */}
        {timeline.map((s) => (
          <g key={s.year}>
            <circle
              cx={xOf(s.year)}
              cy={yOf(s.portfolioValue)}
              r={6}
              className="fill-transparent"
            >
              <title>{`${yearLabel} ${s.year} — ${portfolioLabel}: ${formatCurrency(s.portfolioValue, currency)} · ${contributionsLabel}: ${formatCurrency(s.contributionsCum, currency)}`}</title>
            </circle>
          </g>
        ))}

        {/* X-axis labels */}
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
          <span className="text-muted-foreground">{portfolioLabel}</span>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block w-3 h-[3px] bg-cyan-500 rounded-full" />
          <span className="text-muted-foreground">{contributionsLabel}</span>
        </span>
      </div>
    </div>
  )
}

// X-axis tick selector. Today (0) and the goal year are non-negotiable
// anchors; firstYear/lastYear come next; step ticks fill the gaps. The
// collision threshold is pixel-based (`LABEL_MIN_PX`) so it works for
// any span — a 5-year zoom and an 80-year horizon both keep their
// labels readable. Without this the chart used to render "-2y 0" or
// "+37y +38y" as overlapping pairs.
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

// Finer-grained alternative to "1/2/5/10" — keeps the Y axis tight to
// the line max so the chart isn't half empty.
function tightCeil(value: number): number {
  if (value <= 0) return 1
  const pow = Math.pow(10, Math.floor(Math.log10(value)))
  const norm = value / pow
  const steps = [1, 1.25, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]
  const ceil = steps.find((s) => norm <= s) ?? 10
  return ceil * pow
}


// Strip trailing zeros but keep meaningful decimals — `$1.00M` collapses
// to `$1M`, `$2.50M` to `$2.5M`, `$1.25M` stays put. The old regex stripped
// the entire decimal portion which caused duplicate labels (`$1.25M` and
// `$1.88M` both rendering as `$1M`).
function compactCurrency(value: number, currency: string): string {
  if (value >= 1_000_000) return trimDecimalZeros(formatCurrency(value / 1_000_000, currency)) + 'M'
  if (value >= 1_000) return trimDecimalZeros(formatCurrency(value / 1_000, currency)) + 'k'
  return trimDecimalZeros(formatCurrency(value, currency))
}

function trimDecimalZeros(s: string): string {
  return s.replace(/\.?0+$/, '')
}

export default GrowthChart
