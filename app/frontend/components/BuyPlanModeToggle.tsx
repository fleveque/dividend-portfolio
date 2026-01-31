/**
 * BuyPlanModeToggle - Button to enter/exit buy plan mode
 *
 * Shows different states:
 * - Inactive: "Plan Purchases" button
 * - Active: "Exit Plan Mode" button with different styling
 */

import { useBuyPlanContext } from '../contexts/BuyPlanContext'

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
      <button
        onClick={handleClick}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium
                   bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200
                   rounded-lg hover:bg-amber-200 dark:hover:bg-amber-800
                   transition-colors cursor-pointer"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
        <span className="hidden sm:inline">Exit Plan Mode</span>
        <span className="sm:hidden">Exit</span>
      </button>
    )
  }

  return (
    <button
      onClick={handleClick}
      className="flex items-center gap-2 px-4 py-2 text-sm font-medium
                 bg-emerald-600 text-white rounded-lg
                 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400
                 transition-colors cursor-pointer"
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
      <span className="hidden sm:inline">Plan Purchases</span>
      <span className="sm:hidden">Plan</span>
    </button>
  )
}
