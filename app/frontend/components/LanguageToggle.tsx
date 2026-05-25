import { Globe } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { useProfile, useUpdateProfile } from '../hooks/useProfileQueries'

export function LanguageToggle() {
  const { i18n, t } = useTranslation()
  const { data: profile } = useProfile()
  const updateProfile = useUpdateProfile()

  const currentLang = i18n.language?.startsWith('es') ? 'es' : 'en'
  const nextLang = currentLang === 'en' ? 'es' : 'en'

  const handleClick = () => {
    i18n.changeLanguage(nextLang)
    // Persist to the user's profile so other devices and the Telegram
    // daily digest pick it up. Anonymous (logged-out) users still get
    // the localStorage-cached preference from i18next; we only call the
    // API when there's a profile to update.
    if (profile) updateProfile.mutate({ locale: nextLang })
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleClick}
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
