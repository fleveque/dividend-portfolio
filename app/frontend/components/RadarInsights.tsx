import { useState } from 'react'
import {
  Sparkles,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  TrendingDown,
  AlertTriangle,
  ShieldCheck,
} from 'lucide-react'
import { useRadarInsights } from '../hooks/useAiInsights'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'

interface RadarInsightsProps {
  hasStocks: boolean
}

export function RadarInsights({ hasStocks }: RadarInsightsProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const { data, isLoading, error, refetch, isFetching } = useRadarInsights(isExpanded && hasStocks)

  return (
    <Card className="mt-6">
      <CardHeader
        className="cursor-pointer select-none"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl flex items-center gap-2">
            <Sparkles className="size-5 text-violet-500" />
            AI Portfolio Insights
          </CardTitle>
          <div className="flex items-center gap-2">
            {isExpanded && (
              <Button
                variant="ghost"
                size="xs"
                onClick={(e) => {
                  e.stopPropagation()
                  refetch()
                }}
                disabled={isFetching}
              >
                <RefreshCw className={`size-3.5 ${isFetching ? 'animate-spin' : ''}`} />
              </Button>
            )}
            {isExpanded ? (
              <ChevronUp className="size-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="size-5 text-muted-foreground" />
            )}
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent>
          {isLoading && <InsightsSkeleton />}

          {error && (
            <div className="text-center py-6">
              <p className="text-sm text-muted-foreground mb-3">
                {error instanceof Error ? error.message : 'Failed to load AI insights'}
              </p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                Try again
              </Button>
            </div>
          )}

          {data && !isLoading && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="rounded-lg bg-violet-50 dark:bg-violet-950/30 p-4">
                <p className="text-sm text-foreground">{data.summary}</p>
              </div>

              {/* Buying Opportunities */}
              {data.buyingOpportunities.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-foreground mb-2 flex items-center gap-1.5">
                    <TrendingDown className="size-4 text-emerald-500" />
                    Buying Opportunities
                  </h3>
                  <div className="space-y-2">
                    {data.buyingOpportunities.map((opp, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm">
                        <Badge variant="success" className="shrink-0">{opp.symbol}</Badge>
                        <span className="text-muted-foreground">{opp.reason}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Coverage Gaps */}
              {data.coverageGaps && (
                <>
                  <Separator />
                  <div>
                    <h3 className="text-sm font-medium text-foreground mb-2">
                      Dividend Coverage Gaps
                    </h3>
                    <p className="text-sm text-muted-foreground">{data.coverageGaps}</p>
                  </div>
                </>
              )}

              {/* Risk Flags */}
              {data.riskFlags.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h3 className="text-sm font-medium text-foreground mb-2 flex items-center gap-1.5">
                      <AlertTriangle className="size-4 text-amber-500" />
                      Risk Flags
                    </h3>
                    <div className="space-y-2">
                      {data.riskFlags.map((risk, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm">
                          <Badge variant="warning" className="shrink-0">{risk.symbol}</Badge>
                          <span className="text-muted-foreground">{risk.flag}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Strengths */}
              {data.strengths.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h3 className="text-sm font-medium text-foreground mb-2 flex items-center gap-1.5">
                      <ShieldCheck className="size-4 text-emerald-500" />
                      Strengths
                    </h3>
                    <ul className="space-y-1">
                      {data.strengths.map((strength, i) => (
                        <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="text-emerald-500 mt-1 shrink-0">+</span>
                          {strength}
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              )}

              {/* Disclaimer */}
              <p className="text-[11px] text-muted-foreground/60 text-right pt-2">
                Powered by AI — not financial advice
              </p>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}

function InsightsSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-4 w-48" />
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-4 w-36" />
      <Skeleton className="h-12 w-full" />
    </div>
  )
}
