/**
 * ThemeToggle - Button to cycle through light/dark/system theme modes
 *
 * Displays an icon indicating the current mode:
 * - Sun icon for light mode
 * - Moon icon for dark mode
 * - Auto/system icon for system mode
 */

import { useTheme } from '../contexts/ThemeContext'

export function ThemeToggle() {
  const { mode, toggleMode } = useTheme()

  const getLabel = () => {
    switch (mode) {
      case 'light':
        return 'Light'
      case 'dark':
        return 'Dark'
      case 'system':
        return 'System'
    }
  }

  const getTitle = () => {
    switch (mode) {
      case 'light':
        return 'Switch to dark mode'
      case 'dark':
        return 'Switch to system mode'
      case 'system':
        return 'Switch to light mode'
    }
  }

  return (
    <button
      onClick={toggleMode}
      title={getTitle()}
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm
                 bg-gray-100 dark:bg-gray-700
                 hover:bg-gray-200 dark:hover:bg-gray-600
                 text-gray-700 dark:text-gray-200
                 transition-colors"
      aria-label={getTitle()}
    >
      {/* Sun Icon - Light Mode */}
      {mode === 'light' && (
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      )}

      {/* Moon Icon - Dark Mode */}
      {mode === 'dark' && (
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
          />
        </svg>
      )}

      {/* Auto/System Icon */}
      {mode === 'system' && (
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
      )}

      <span className="hidden sm:inline">{getLabel()}</span>
    </button>
  )
}

export default ThemeToggle
