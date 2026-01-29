/**
 * ViewToggle - Toggle between card and compact view modes
 *
 * Features:
 * - Grid icon for card view
 * - List icon for compact view
 * - Active state styling
 * - Theme-aware
 */

import { useViewPreference } from '../contexts/ViewPreferenceContext'

export function ViewToggle() {
  const { viewMode, setViewMode } = useViewPreference()

  const baseClasses = 'p-2 rounded-lg transition-colors cursor-pointer'
  const activeClasses = 'bg-brand text-white'
  const inactiveClasses = 'text-theme-secondary hover:text-theme-primary hover:bg-theme-muted'

  return (
    <div className="inline-flex items-center gap-1 bg-theme-elevated rounded-lg p-1">
      {/* Card/Grid View */}
      <button
        onClick={() => setViewMode('card')}
        className={`${baseClasses} ${viewMode === 'card' ? activeClasses : inactiveClasses}`}
        title="Card view"
        aria-label="Switch to card view"
        aria-pressed={viewMode === 'card'}
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
          />
        </svg>
      </button>

      {/* Compact/List View */}
      <button
        onClick={() => setViewMode('compact')}
        className={`${baseClasses} ${viewMode === 'compact' ? activeClasses : inactiveClasses}`}
        title="Compact view"
        aria-label="Switch to compact view"
        aria-pressed={viewMode === 'compact'}
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>
    </div>
  )
}

export default ViewToggle
