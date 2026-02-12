import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

const MONTH_LABELS = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D']
const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

interface DividendMonthGridProps {
  paymentMonths: number[]
  size?: 'sm' | 'md'
}

export function DividendMonthGrid({ paymentMonths, size = 'sm' }: DividendMonthGridProps) {
  if (paymentMonths.length === 0) {
    return <span className="text-xs text-muted-foreground">No schedule</span>
  }

  const paymentMonthNames = paymentMonths.map((m) => MONTH_NAMES[m - 1]).join(', ')

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="inline-flex items-end gap-px">
            {MONTH_LABELS.map((label, i) => {
              const month = i + 1
              const isPayment = paymentMonths.includes(month)
              return (
                <div key={month} className="flex flex-col items-center gap-0.5">
                  <div
                    className={cn(
                      'rounded-sm',
                      size === 'sm' ? 'size-2' : 'size-2.5',
                      isPayment
                        ? 'bg-emerald-500 dark:bg-emerald-400'
                        : 'bg-muted'
                    )}
                  />
                  {size === 'md' && (
                    <span className={cn(
                      'text-muted-foreground leading-none',
                      'text-[8px]',
                      isPayment && 'text-emerald-600 dark:text-emerald-400 font-medium'
                    )}>
                      {label}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </TooltipTrigger>
        <TooltipContent>Pays in {paymentMonthNames}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export default DividendMonthGrid
