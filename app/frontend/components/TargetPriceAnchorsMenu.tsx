import { useState } from 'react'
import { Wand2, Users, TrendingUp, BarChart3, Activity, Check } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { formatCurrency } from '../lib/currency'
import { useUpdateTargetPrice } from '../hooks/useRadarQueries'
import type { TargetAnchors } from '../types'

const COMMUNITY_MIN_COHORT = 3

interface Props {
  stockId: number
  currency: string
  anchors: TargetAnchors
}

// Dropdown of "suggest a target" anchors: community average, 52-week
// midpoint, 200-day MA, 50-day MA. Each entry shows its computed value.
// Click to apply directly (no edit-then-confirm). Rows with no value are
// rendered disabled with a short reason in the secondary line.
export function TargetPriceAnchorsMenu({ stockId, currency, anchors }: Props) {
  const { t } = useTranslation()
  const update = useUpdateTargetPrice()
  const [open, setOpen] = useState(false)

  const rows = [
    {
      key: 'community',
      icon: Users,
      label: t('radar.anchors.community'),
      value: anchors.community.value,
      secondary: anchors.community.value != null
        ? t('radar.anchors.communityCount', { count: anchors.community.count })
        : anchors.community.count > 0
          ? t('radar.anchors.communityBelow', { threshold: COMMUNITY_MIN_COHORT, count: anchors.community.count })
          : t('radar.anchors.unavailable'),
    },
    {
      key: 'fiftyTwoWeekMidpoint',
      icon: TrendingUp,
      label: t('radar.anchors.fiftyTwoWeekMidpoint'),
      value: anchors.fiftyTwoWeekMidpoint,
      secondary: anchors.fiftyTwoWeekMidpoint == null ? t('radar.anchors.unavailable') : null,
    },
    {
      key: 'ma200',
      icon: BarChart3,
      label: t('radar.anchors.ma200'),
      value: anchors.ma200,
      secondary: anchors.ma200 == null ? t('radar.anchors.unavailable') : null,
    },
    {
      key: 'ma50',
      icon: Activity,
      label: t('radar.anchors.ma50'),
      value: anchors.ma50,
      secondary: anchors.ma50 == null ? t('radar.anchors.unavailable') : null,
    },
  ] as const

  const enabledCount = rows.filter((r) => r.value != null).length
  const triggerDisabled = enabledCount === 0

  const handlePick = (price: number) => {
    update.mutate({ stockId, price })
    setOpen(false)
  }

  return (
    <TooltipProvider>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                disabled={triggerDisabled}
                onClick={(e) => e.stopPropagation()}
                className={cn(
                  'inline-flex items-center justify-center rounded-sm p-0.5 transition-colors',
                  triggerDisabled
                    ? 'text-muted-foreground/30 cursor-not-allowed'
                    : 'text-muted-foreground/60 hover:text-foreground cursor-pointer'
                )}
                aria-label={t('radar.suggestTarget')}
              >
                <Wand2 className="size-3" />
              </button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">{triggerDisabled ? t('radar.anchors.unavailable') : t('radar.suggestTarget')}</p>
          </TooltipContent>
        </Tooltip>

        <DropdownMenuContent
          align="start"
          className="w-72"
          // Stop the click from bubbling up and re-opening the inline editor.
          onClick={(e) => e.stopPropagation()}
        >
          <DropdownMenuLabel>{t('radar.suggestTarget')}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {rows.map((row) => {
            const Icon = row.icon
            const disabled = row.value == null
            return (
              <DropdownMenuItem
                key={row.key}
                disabled={disabled}
                onClick={() => row.value != null && handlePick(row.value)}
                className="flex items-start gap-2"
              >
                <Icon className="size-3.5 mt-0.5 shrink-0 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-sm">{row.label}</span>
                    <span className="text-sm font-mono tabular-nums">
                      {row.value != null ? formatCurrency(row.value, currency) : '—'}
                    </span>
                  </div>
                  {row.secondary && (
                    <p className="text-[11px] text-muted-foreground mt-0.5">{row.secondary}</p>
                  )}
                </div>
                {!disabled && <Check className="size-3 opacity-0 mt-1 shrink-0" />}
              </DropdownMenuItem>
            )
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </TooltipProvider>
  )
}
