import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Sparkles } from 'lucide-react'
import { useStockAiSummary } from '../hooks/useAiInsights'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import type { StockAiSummary as StockAiSummaryType } from '../types'

interface StockAiSummaryProps {
  stockId: number
}

const verdictVariant: Record<StockAiSummaryType['verdict'], 'success' | 'warning' | 'destructive' | 'secondary'> = {
  strong_buy: 'success',
  buy: 'success',
  hold: 'secondary',
  caution: 'warning',
  avoid: 'destructive',
}

const verdictKeys: Record<StockAiSummaryType['verdict'], string> = {
  strong_buy: 'stockAi.strongBuy',
  buy: 'stockAi.buy',
  hold: 'stockAi.hold',
  caution: 'stockAi.caution',
  avoid: 'stockAi.avoid',
}

export function StockAiSummary({ stockId }: StockAiSummaryProps) {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const { data, isLoading, error, refetch } = useStockAiSummary(isOpen ? stockId : null)

  return (
    <div>
      <Button
        variant="ghost"
        size="xs"
        onClick={() => setIsOpen(!isOpen)}
        className="text-violet-500 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-950/30"
      >
        <Sparkles className="size-3.5" />
        AI
      </Button>

      {isOpen && (
        <>
          <Separator className="my-3" />
          {isLoading && (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          )}

          {error && (
            <div className="text-xs text-muted-foreground">
              <span>{t('stockAi.failedToLoad')} </span>
              <button onClick={() => refetch()} className="underline hover:text-foreground">
                {t('stockAi.retry')}
              </button>
            </div>
          )}

          {data && !isLoading && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant={verdictVariant[data.verdict]}>
                  {t(verdictKeys[data.verdict])}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{data.summary}</p>
              {data.keyPoints.length > 0 && (
                <ul className="space-y-0.5">
                  {data.keyPoints.map((point, i) => (
                    <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                      <span className="text-violet-500 mt-0.5 shrink-0">-</span>
                      {point}
                    </li>
                  ))}
                </ul>
              )}
              <p className="text-[10px] text-muted-foreground/50">{t('stockAi.disclaimer')}</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
