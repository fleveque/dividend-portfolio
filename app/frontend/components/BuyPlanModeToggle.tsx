import { ShoppingCart, X } from 'lucide-react'
import { useBuyPlanContext } from '../contexts/BuyPlanContext'
import { Button } from '@/components/ui/button'

export function BuyPlanModeToggle() {
  const { isActive, enterBuyPlanMode, exitBuyPlanMode, isDirty } = useBuyPlanContext()

  const handleClick = () => {
    if (isActive) {
      if (isDirty) {
        const confirmed = window.confirm(
          'You have unsaved changes. Are you sure you want to exit?'
        )
        if (!confirmed) return
      }
      exitBuyPlanMode()
    } else {
      enterBuyPlanMode()
    }
  }

  if (isActive) {
    return (
      <Button variant="outline" size="sm" onClick={handleClick} className="bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-200 hover:text-amber-900 dark:bg-amber-900/50 dark:text-amber-200 dark:border-amber-800 dark:hover:bg-amber-800">
        <X className="size-4" />
        <span className="hidden sm:inline">Exit Plan Mode</span>
        <span className="sm:hidden">Exit</span>
      </Button>
    )
  }

  return (
    <Button size="sm" onClick={handleClick}>
      <ShoppingCart className="size-4" />
      <span className="hidden sm:inline">Plan Purchases</span>
      <span className="sm:hidden">Plan</span>
    </Button>
  )
}
