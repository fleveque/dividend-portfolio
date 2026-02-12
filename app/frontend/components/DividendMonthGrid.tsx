import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

const MONTH_LABELS = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D']
const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

interface DividendMonthGridProps {
  paymentMonths: number[]
  shiftedPaymentMonths?: number[]
  size?: 'sm' | 'md'
}

export function DividendMonthGrid({ paymentMonths, shiftedPaymentMonths = [], size = 'sm' }: DividendMonthGridProps) {
  if (paymentMonths.length === 0) {
    return <span className="text-xs text-muted-foreground">No schedule</span>
  }

  const primaryMonths = paymentMonths.filter((m) => !shiftedPaymentMonths.includes(m))
  const primaryNames = primaryMonths.map((m) => MONTH_NAMES[m - 1]).join(', ')
  const shiftedNames = shiftedPaymentMonths.map((m) => MONTH_NAMES[m - 1]).join(', ')

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="inline-flex items-end gap-px">
            {MONTH_LABELS.map((label, i) => {
              const month = i + 1
              const isShifted = shiftedPaymentMonths.includes(month)
              const isPrimary = paymentMonths.includes(month) && !isShifted
              return (
                <div key={month} className="flex flex-col items-center gap-0.5">
                  <div
                    className={cn(
                      'rounded-sm',
                      size === 'sm' ? 'size-2' : 'size-2.5',
                      isPrimary && 'bg-emerald-500 dark:bg-emerald-400',
                      isShifted && 'bg-amber-400 dark:bg-amber-500',
                      !isPrimary && !isShifted && 'bg-muted'
                    )}
                  />
                  {size === 'md' && (
                    <span className={cn(
                      'text-muted-foreground leading-none',
                      'text-[8px]',
                      isPrimary && 'text-emerald-600 dark:text-emerald-400 font-medium',
                      isShifted && 'text-amber-600 dark:text-amber-400 font-medium'
                    )}>
                      {label}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>Pays in {primaryNames}</p>
          {shiftedNames && (
            <p className="text-amber-400">Sometimes in {shiftedNames}</p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export default DividendMonthGrid
