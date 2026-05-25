import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useProfile } from './useProfileQueries'

// When a user's profile loads, switch the i18n language to their stored
// locale so it survives across devices and matches the Telegram daily
// digest. Anonymous users keep the localStorage-cached preference.
export function useLocaleSync() {
  const { i18n } = useTranslation()
  const { data: profile } = useProfile()

  useEffect(() => {
    if (!profile?.locale) return
    const current = i18n.language?.split('-')[0]
    if (current !== profile.locale) i18n.changeLanguage(profile.locale)
  }, [profile?.locale, i18n])
}
