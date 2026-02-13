import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface FiftyTwoWeekRangeProps {
  low: string
  high: string
  position: number | null
}

export function FiftyTwoWeekRange({ low, high, position }: FiftyTwoWeekRangeProps) {
  if (position === null) return null

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1.5 flex-1 min-w-0 cursor-default">
            <span className="text-[10px] text-muted-foreground shrink-0">{low}</span>
            <div className="relative flex-1 h-1.5 bg-muted rounded-full min-w-[60px]">
              <div
                className="absolute top-1/2 -translate-y-1/2 size-2.5 bg-foreground rounded-full"
                style={{ left: `calc(${position}% - 5px)` }}
              />
            </div>
            <span className="text-[10px] text-muted-foreground shrink-0">{high}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>52-week range: {low} – {high}</p>
          <p>Current position: {position.toFixed(1)}%</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
