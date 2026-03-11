import { useTranslation } from 'react-i18next'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

interface DividendMonthGridProps {
  paymentMonths: number[]
  shiftedPaymentMonths?: number[]
  size?: 'sm' | 'md'
}

export function DividendMonthGrid({ paymentMonths, shiftedPaymentMonths = [], size = 'sm' }: DividendMonthGridProps) {
  const { t, i18n } = useTranslation()

  if (paymentMonths.length === 0) {
    return <span className="text-xs text-muted-foreground">{t('stock.noSchedule')}</span>
  }

  const monthFormatter = new Intl.DateTimeFormat(i18n.language, { month: 'short' })
  const monthLabelFormatter = new Intl.DateTimeFormat(i18n.language, { month: 'narrow' })

  const getMonthName = (m: number) => {
    const date = new Date(2024, m - 1, 1)
    return monthFormatter.format(date)
  }

  const getMonthLabel = (m: number) => {
    const date = new Date(2024, m - 1, 1)
    return monthLabelFormatter.format(date)
  }

  const primaryMonths = paymentMonths.filter((m) => !shiftedPaymentMonths.includes(m))
  const primaryNames = primaryMonths.map(getMonthName).join(', ')
  const shiftedNames = shiftedPaymentMonths.map(getMonthName).join(', ')

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="inline-flex items-end gap-px">
            {Array.from({ length: 12 }, (_, i) => {
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
                      {getMonthLabel(month)}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{t('stock.paysIn', { months: primaryNames })}</p>
          {shiftedNames && (
            <p className="text-amber-400">{t('stock.sometimesIn', { months: shiftedNames })}</p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export default DividendMonthGrid
