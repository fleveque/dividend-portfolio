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

export function ScoreBadge({ score, label }: ScoreBadgeProps) {
  if (!label) return null

  const variant = VARIANT_MAP[label as keyof typeof VARIANT_MAP] ?? 'secondary'

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant={variant} className="text-xs cursor-default">
            {score} {label}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>Stock score: {score}/10</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
