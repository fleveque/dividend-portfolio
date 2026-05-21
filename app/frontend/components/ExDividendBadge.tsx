import { Calendar } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface Props {
  exDividendDate: string | null
  // How many days ahead we should announce the upcoming ex-div. Past or beyond
  // the threshold → component renders nothing.
  daysThreshold?: number
}

// Compact "Ex-div in Nd" badge. Color tightens (amber) when it's within 3
// days. Rendered inline next to the stock symbol / score badge so the
// upcoming ex-div is visible at a glance from the radar and portfolio cards.
export function ExDividendBadge({ exDividendDate, daysThreshold = 14 }: Props) {
  const { t } = useTranslation()
  if (!exDividendDate) return null

  const target = new Date(exDividendDate)
  if (isNaN(target.getTime())) return null

  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)
  const days = Math.round((target.getTime() - startOfToday.getTime()) / (1000 * 60 * 60 * 24))

  if (days < 0 || days > daysThreshold) return null

  const urgent = days <= 3

  return (
    <Badge
      variant="outline"
      className={cn(
        'text-[10px] gap-1 px-1.5',
        urgent
          ? 'border-amber-500/40 text-amber-700 dark:text-amber-400'
          : 'border-blue-500/40 text-blue-700 dark:text-blue-400'
      )}
      title={target.toLocaleDateString()}
    >
      <Calendar className="size-3" />
      {days === 0
        ? t('stock.exDivToday')
        : days === 1
          ? t('stock.exDivTomorrow')
          : t('stock.exDivInDays', { count: days })}
    </Badge>
  )
}
