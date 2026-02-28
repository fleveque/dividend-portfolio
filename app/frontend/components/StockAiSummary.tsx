import { useState } from 'react'
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

const verdictConfig: Record<StockAiSummaryType['verdict'], { label: string; variant: 'success' | 'warning' | 'destructive' | 'secondary' }> = {
  strong_buy: { label: 'Strong Buy', variant: 'success' },
  buy: { label: 'Buy', variant: 'success' },
  hold: { label: 'Hold', variant: 'secondary' },
  caution: { label: 'Caution', variant: 'warning' },
  avoid: { label: 'Avoid', variant: 'destructive' },
}

export function StockAiSummary({ stockId }: StockAiSummaryProps) {
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
              <span>Failed to load AI summary. </span>
              <button onClick={() => refetch()} className="underline hover:text-foreground">
                Retry
              </button>
            </div>
          )}

          {data && !isLoading && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant={verdictConfig[data.verdict].variant}>
                  {verdictConfig[data.verdict].label}
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
              <p className="text-[10px] text-muted-foreground/50">AI-generated — not financial advice</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
