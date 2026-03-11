import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface ScoreBadgeProps {
  score: number
  label: string | null
}

const VARIANT_MAP = {
  Strong: 'success',
  Fair: 'warning',
  Weak: 'destructive',
} as const

const LABEL_KEYS: Record<string, string> = {
  Strong: 'stock.strong',
  Fair: 'stock.fair',
  Weak: 'stock.weak',
}

export function ScoreBadge({ score, label }: ScoreBadgeProps) {
  const { t } = useTranslation()

  if (!label) return null

  const variant = VARIANT_MAP[label as keyof typeof VARIANT_MAP] ?? 'secondary'
  const translatedLabel = LABEL_KEYS[label] ? t(LABEL_KEYS[label]) : label

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant={variant} className="text-xs cursor-default">
            {score} {translatedLabel}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>{t('stock.scoreTooltip', { score })}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
