/**
 * ViewPreferenceContext - Radar view mode management
 *
 * Features:
 * - Two view modes: 'card' (default) or 'compact'
 * - Persists user preference in localStorage
 */

import { createContext, useContext, useState, type ReactNode } from 'react'

type ViewMode = 'card' | 'compact'

interface ViewPreferenceContextType {
  viewMode: ViewMode
  setViewMode: (mode: ViewMode) => void
}

const ViewPreferenceContext = createContext<ViewPreferenceContextType | undefined>(undefined)

const STORAGE_KEY = 'dividend-portfolio-radar-view'

/**
 * Get the saved view mode from localStorage
 */
function getSavedViewMode(): ViewMode {
  if (typeof window === 'undefined') return 'card'
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved === 'card' || saved === 'compact') {
    return saved
  }
  return 'card'
}

interface ViewPreferenceProviderProps {
  children: ReactNode
}

export function ViewPreferenceProvider({ children }: ViewPreferenceProviderProps) {
  const [viewMode, setViewModeState] = useState<ViewMode>(() => getSavedViewMode())

  const setViewMode = (newMode: ViewMode) => {
    setViewModeState(newMode)
    localStorage.setItem(STORAGE_KEY, newMode)
  }

  return (
    <ViewPreferenceContext.Provider value={{ viewMode, setViewMode }}>
      {children}
    </ViewPreferenceContext.Provider>
  )
}

/**
 * Hook to access view preference context
 */
export function useViewPreference() {
  const context = useContext(ViewPreferenceContext)
  if (context === undefined) {
    throw new Error('useViewPreference must be used within a ViewPreferenceProvider')
  }
  return context
}
