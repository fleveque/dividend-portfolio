import { Sun, Moon, Monitor } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'
import { Button } from '@/components/ui/button'

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
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleMode}
      title={getTitle()}
      aria-label={getTitle()}
      className="gap-1.5"
    >
      {mode === 'light' && <Sun className="size-4" />}
      {mode === 'dark' && <Moon className="size-4" />}
      {mode === 'system' && <Monitor className="size-4" />}
      <span className="hidden sm:inline">{getLabel()}</span>
    </Button>
  )
}

export default ThemeToggle
