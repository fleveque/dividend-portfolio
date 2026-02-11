import { ShoppingCart, ChevronRight } from 'lucide-react'
import { useBuyPlanContext } from '../contexts/BuyPlanContext'
import { Badge } from '@/components/ui/badge'

interface CartSummaryBarProps {
  onOpenDrawer: () => void
}

export function CartSummaryBar({ onOpenDrawer }: CartSummaryBarProps) {
  const { isActive, items, totalItems, formattedTotal, isDirty } = useBuyPlanContext()

  if (!isActive || items.length === 0) {
    return null
  }

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-40 bg-background border-t
                 shadow-lg safe-area-bottom cursor-pointer"
      onClick={onOpenDrawer}
    >
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <ShoppingCart className="size-6 text-foreground" />
              <Badge className="absolute -top-2 -right-2 size-5 p-0 text-xs justify-center">
                {items.length}
              </Badge>
            </div>

            <div>
              <p className="text-sm font-medium text-foreground">
                {totalItems} share{totalItems !== 1 ? 's' : ''} in {items.length} stock
                {items.length !== 1 ? 's' : ''}
              </p>
              <p className="text-xs text-muted-foreground">
                Est. total: {formattedTotal}
                {isDirty && (
                  <span className="text-amber-500 dark:text-amber-400 ml-2">
                    (unsaved)
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-foreground font-medium">
            <span className="text-sm hidden sm:inline">View Cart</span>
            <ChevronRight className="size-5" />
          </div>
        </div>
      </div>
    </div>
  )
}
