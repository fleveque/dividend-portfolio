import { formatCurrency } from '../../lib/currency'

interface Props {
  currentMonthly: number
  objectiveMonthly: number
  currency: string
  label?: string
}

// Tiny non-interactive progress bar — current monthly dividend vs the
// today-money objective. Reused on /freedom and the dashboard mini.
export function ProgressBar({ currentMonthly, objectiveMonthly, currency, label }: Props) {
  const pct = objectiveMonthly > 0
    ? Math.min(100, (currentMonthly / objectiveMonthly) * 100)
    : 0
  const reached = pct >= 100

  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2 text-xs">
        <span className="font-medium text-muted-foreground">{label}</span>
        <span className="tabular-nums font-semibold">
          {formatCurrency(currentMonthly, currency)}
          <span className="text-muted-foreground"> / {formatCurrency(objectiveMonthly, currency)}</span>
        </span>
      </div>
      <div className="h-2 rounded-full bg-emerald-500/15 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            reached
              ? 'bg-gradient-to-r from-emerald-500 to-cyan-500'
              : 'bg-gradient-to-r from-emerald-500/80 to-cyan-500/80'
          }`}
          style={{ width: `${Math.max(2, pct)}%` }}
        />
      </div>
      <div className="flex items-baseline justify-between text-[11px] text-muted-foreground tabular-nums">
        <span>{pct.toFixed(1)}%</span>
        {!reached && (
          <span>{formatCurrency(objectiveMonthly - currentMonthly, currency)} to go</span>
        )}
      </div>
    </div>
  )
}

export default ProgressBar
