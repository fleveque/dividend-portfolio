import { useState, useEffect } from 'react'
import { Loader2, Check, Activity, ExternalLink, Coins, Send } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router-dom'
import { useProfile, useUpdateProfile } from '../hooks/useProfileQueries'
import { useTelegramLink, useStartTelegramLinking, useUnlinkTelegram, useUpdateTelegramNotifications } from '../hooks/useTelegramLink'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { CURRENCY_OPTIONS } from '@/lib/currency'
import { pulsePortfolioUrl, pulsePortfolioDisplayUrl } from '../lib/pulse'

export function SettingsPage() {
  const { t } = useTranslation()

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <h1 className="text-2xl font-bold">{t('settings.title')}</h1>
      <DisplayCurrencySection />
      <PortfolioSharingSection />
      <TelegramSection />
    </div>
  )
}

function DisplayCurrencySection() {
  const { t } = useTranslation()
  const { data: profile, isLoading } = useProfile()
  const updateProfile = useUpdateProfile()
  const [saved, setSaved] = useState(false)

  if (isLoading) {
    return <Card><CardContent className="py-8 flex justify-center"><Loader2 className="animate-spin" /></CardContent></Card>
  }

  const current = profile?.preferredCurrency ?? 'USD'

  const handleChange = (value: string) => {
    updateProfile.mutate({ preferredCurrency: value }, {
      onSuccess: () => {
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      },
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Coins className="size-5 text-amber-600 dark:text-amber-400" />
          {t('settings.displayCurrency')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          {t('settings.displayCurrencyDescription')}
        </p>
        <div className="space-y-2">
          <Label htmlFor="preferred-currency">{t('settings.displayCurrency')}</Label>
          <select
            id="preferred-currency"
            value={current}
            onChange={(e) => handleChange(e.target.value)}
            disabled={updateProfile.isPending}
            className="flex h-9 w-full max-w-xs rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
          >
            {CURRENCY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
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

function PortfolioSharingSection() {
  const { t } = useTranslation()
  const { data: profile, isLoading } = useProfile()
  const updateProfile = useUpdateProfile()
  const [slug, setSlug] = useState('')
  const [saved, setSaved] = useState(false)
  const { hash } = useLocation()

  useEffect(() => {
    if (profile?.portfolioSlug) {
      setSlug(profile.portfolioSlug)
    }
  }, [profile])

  // React Router doesn't auto-scroll on hash links — handle #portfolio-sharing
  // so the "Opt in from Settings" CTA on the home banner lands on this section.
  useEffect(() => {
    if (hash === '#portfolio-sharing') {
      document
        .getElementById('portfolio-sharing')
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [hash])

  const handleSave = () => {
    const value = slug.trim() || null
    updateProfile.mutate({ portfolioSlug: value }, {
      onSuccess: () => {
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      },
    })
  }

  const handleClear = () => {
    setSlug('')
    updateProfile.mutate({ portfolioSlug: null }, {
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
    <Card id="portfolio-sharing" className="scroll-mt-8">
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
                href={pulsePortfolioUrl(slug)}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono inline-flex items-center gap-1 text-purple-600 dark:text-purple-400 hover:underline"
              >
                {pulsePortfolioDisplayUrl(slug)}
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

function TelegramSection() {
  const { t } = useTranslation()
  const { data: status, isLoading, refetch } = useTelegramLink()
  const startLinking = useStartTelegramLinking()
  const unlink = useUnlinkTelegram()
  const updateNotifications = useUpdateTelegramNotifications()
  const [pendingUrl, setPendingUrl] = useState<string | null>(null)

  if (isLoading) {
    return <Card><CardContent className="py-8 flex justify-center"><Loader2 className="animate-spin" /></CardContent></Card>
  }

  const handleConnect = async () => {
    const result = await startLinking.mutateAsync()
    setPendingUrl(result.deepLinkUrl)
    window.open(result.deepLinkUrl, '_blank', 'noopener,noreferrer')
  }

  const handleRefresh = () => {
    setPendingUrl(null)
    refetch()
  }

  const handleUnlink = async () => {
    await unlink.mutateAsync()
    setPendingUrl(null)
  }

  return (
    <Card id="telegram" className="scroll-mt-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="size-5 text-sky-500" />
          {t('settings.telegram.title')}
          <Badge variant="secondary" className="ml-1 text-[10px] uppercase tracking-wider">
            {t('common.beta')}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">{t('settings.telegram.description')}</p>

        {status?.connected ? (
          <>
            <div className="rounded-lg border bg-sky-50 dark:bg-sky-950/20 border-sky-200 dark:border-sky-900/40 p-3 text-sm">
              <p className="flex items-center gap-2 font-medium">
                <Check className="size-4 text-sky-600 dark:text-sky-400" />
                {t('settings.telegram.connected')}
              </p>
              <p className="text-muted-foreground mt-1">
                {t('settings.telegram.linkedAt', { date: new Date(status.linkedAt ?? '').toLocaleString() })}
              </p>
            </div>

            {/* Daily-digest toggle — opt-in by default. Same column as the
                bot's `/notifications on|off` command. */}
            <label className="flex items-start gap-3 rounded-lg border p-3 cursor-pointer hover:bg-muted/40 transition-colors">
              <input
                type="checkbox"
                checked={!!status.notificationsEnabled}
                onChange={(e) => updateNotifications.mutate(e.target.checked)}
                disabled={updateNotifications.isPending}
                className="mt-0.5 size-4 cursor-pointer accent-sky-600"
              />
              <div className="flex-1 text-sm">
                <p className="font-medium text-foreground">{t('settings.telegram.notifications.label')}</p>
                <p className="text-muted-foreground mt-0.5">{t('settings.telegram.notifications.description')}</p>
              </div>
            </label>

            <Button variant="outline" size="sm" onClick={handleUnlink} disabled={unlink.isPending}>
              {t('settings.telegram.disconnect')}
            </Button>
          </>
        ) : pendingUrl ? (
          <>
            <Alert>
              <AlertDescription className="text-sm">
                {t('settings.telegram.pendingInstructions')}
              </AlertDescription>
            </Alert>
            <div className="flex flex-wrap gap-2">
              <Button asChild size="sm" className="bg-sky-600 hover:bg-sky-700 text-white">
                <a href={pendingUrl} target="_blank" rel="noopener noreferrer">
                  {t('settings.telegram.openInTelegramAgain')}
                </a>
              </Button>
              <Button variant="outline" size="sm" onClick={handleRefresh} disabled={startLinking.isPending}>
                {t('settings.telegram.refreshStatus')}
              </Button>
            </div>
          </>
        ) : (
          <Button onClick={handleConnect} disabled={startLinking.isPending} className="bg-sky-600 hover:bg-sky-700 text-white">
            {startLinking.isPending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            {t('settings.telegram.connect')}
          </Button>
        )}

        {startLinking.isError && (
          <Alert variant="destructive">
            <AlertDescription>
              {startLinking.error instanceof Error ? startLinking.error.message : t('settings.failedToUpdate')}
            </AlertDescription>
          </Alert>
        )}

        <details className="text-sm text-muted-foreground">
          <summary className="cursor-pointer font-medium text-foreground">{t('settings.telegram.howItWorks.summary')}</summary>
          <ul className="list-disc pl-5 mt-2 space-y-1.5">
            <li>{t('settings.telegram.howItWorks.askExamples')}</li>
            <li>{t('settings.telegram.howItWorks.limit')}</li>
            <li>{t('settings.telegram.howItWorks.privacy')}</li>
            <li>{t('settings.telegram.howItWorks.unlinkAnytime')}</li>
          </ul>
        </details>
      </CardContent>
    </Card>
  )
}

export default SettingsPage
