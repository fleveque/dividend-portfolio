import { Globe } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'

export function LanguageToggle() {
  const { i18n, t } = useTranslation()

  const currentLang = i18n.language?.startsWith('es') ? 'es' : 'en'
  const nextLang = currentLang === 'en' ? 'es' : 'en'

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => i18n.changeLanguage(nextLang)}
      title={t('language.switchLanguage')}
      aria-label={t('language.switchLanguage')}
      className="gap-1.5"
    >
      <Globe className="size-4" />
      <span className="hidden sm:inline">{currentLang.toUpperCase()}</span>
    </Button>
  )
}

export default LanguageToggle
