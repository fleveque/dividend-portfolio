import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

// Keys identify which write action triggered the sign-up nudge — the dialog
// uses them to pick the right body copy. Keep these stable; locales reference
// them via `t('demo.nudge.bodies.<key>')`.
export type NudgeAction =
  | 'addRadarStock'
  | 'updateTargetPrice'
  | 'addHolding'
  | 'updateHolding'
  | 'deleteHolding'
  | 'addDividend'
  | 'editDividend'
  | 'deleteDividend'
  | 'importDividends'
  | 'updateProfile'

interface DemoModeContextValue {
  isDemoMode: boolean
  nudgeAction: NudgeAction | null
  triggerNudge: (action: NudgeAction) => void
  dismissNudge: () => void
}

const DemoModeContext = createContext<DemoModeContextValue>({
  isDemoMode: false,
  nudgeAction: null,
  triggerNudge: () => {},
  dismissNudge: () => {},
})

interface ProviderProps {
  children: ReactNode
  isDemoMode?: boolean
}

export function DemoModeProvider({ children, isDemoMode = false }: ProviderProps) {
  const [nudgeAction, setNudgeAction] = useState<NudgeAction | null>(null)

  const triggerNudge = useCallback((action: NudgeAction) => setNudgeAction(action), [])
  const dismissNudge = useCallback(() => setNudgeAction(null), [])

  const value = useMemo(
    () => ({ isDemoMode, nudgeAction, triggerNudge, dismissNudge }),
    [isDemoMode, nudgeAction, triggerNudge, dismissNudge]
  )

  return <DemoModeContext.Provider value={value}>{children}</DemoModeContext.Provider>
}

export function useDemoMode() {
  return useContext(DemoModeContext)
}
