import { useState, useEffect } from 'react'
import { Loader2, Check, Activity, ExternalLink } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useProfile, useUpdateProfile } from '../hooks/useProfileQueries'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'

export function SettingsPage() {
  const { t } = useTranslation()

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <h1 className="text-2xl font-bold">{t('settings.title')}</h1>
      <PortfolioSharingSection />
    </div>
  )
}

function PortfolioSharingSection() {
  const { t } = useTranslation()
  const { data: profile, isLoading } = useProfile()
  const updateProfile = useUpdateProfile()
  const [slug, setSlug] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (profile?.portfolioSlug) {
      setSlug(profile.portfolioSlug)
    }
  }, [profile])

  const handleSave = () => {
    const value = slug.trim() || null
    updateProfile.mutate(value, {
      onSuccess: () => {
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      },
    })
  }

  const handleClear = () => {
    setSlug('')
    updateProfile.mutate(null, {
      onSuccess: () => {
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      },
    })
  }

  if (isLoading) {
    return <Card><CardContent className="py-8 flex justify-center"><Loader2 className="animate-spin" /></CardContent></Card>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="size-5 text-purple-600 dark:text-purple-400" />
          {t('settings.portfolioSharing')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          {t('settings.sharingDescription')}
        </p>
        <div className="space-y-2">
          <Label htmlFor="portfolio-slug">{t('settings.portfolioSlug')}</Label>
          <div className="flex gap-2">
            <Input
              id="portfolio-slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
              placeholder={t('settings.slugPlaceholder')}
              className="max-w-xs"
            />
            <Button onClick={handleSave} disabled={updateProfile.isPending}>
              {updateProfile.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : t('common.save')}
            </Button>
            {profile?.portfolioSlug && (
              <Button variant="outline" onClick={handleClear} disabled={updateProfile.isPending}>
                {t('common.clear')}
              </Button>
            )}
          </div>
          {slug && (
            <p className="text-xs text-muted-foreground">
              {t('settings.publicUrl')}{' '}
              <a
                href={`https://pulse.quantic.es/p/${slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono inline-flex items-center gap-1 text-purple-600 dark:text-purple-400 hover:underline"
              >
                pulse.quantic.es/p/{slug}
                <ExternalLink className="size-3" />
              </a>
            </p>
          )}
        </div>
        {updateProfile.isError && (
          <Alert variant="destructive">
            <AlertDescription>
              {updateProfile.error instanceof Error ? updateProfile.error.message : t('settings.failedToUpdate')}
            </AlertDescription>
          </Alert>
        )}
        {saved && (
          <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
            <Check className="h-4 w-4" /> {t('common.saved')}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

export default SettingsPage
