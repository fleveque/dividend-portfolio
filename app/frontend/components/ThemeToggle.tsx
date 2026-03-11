import { Sun, Moon, Monitor } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useTheme } from '../contexts/ThemeContext'
import { Button } from '@/components/ui/button'

export function ThemeToggle() {
  const { mode, toggleMode } = useTheme()
  const { t } = useTranslation()

  const getLabel = () => {
    switch (mode) {
      case 'light':
        return t('theme.light')
      case 'dark':
        return t('theme.dark')
      case 'system':
        return t('theme.system')
    }
  }

  const getTitle = () => {
    switch (mode) {
      case 'light':
        return t('theme.switchToDark')
      case 'dark':
        return t('theme.switchToSystem')
      case 'system':
        return t('theme.switchToLight')
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
