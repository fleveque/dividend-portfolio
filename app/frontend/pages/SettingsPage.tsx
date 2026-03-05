import { useState, useEffect } from 'react'
import { Loader2, Check } from 'lucide-react'
import { useProfile, useUpdateProfile } from '../hooks/useProfileQueries'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'

export function SettingsPage() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <h1 className="text-2xl font-bold">Settings</h1>
      <PortfolioSharingSection />
    </div>
  )
}

function PortfolioSharingSection() {
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
        <CardTitle>Portfolio Sharing</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Set a public slug to share your portfolio on Pulse. Leave empty to opt out.
        </p>
        <div className="space-y-2">
          <Label htmlFor="portfolio-slug">Portfolio Slug</Label>
          <div className="flex gap-2">
            <Input
              id="portfolio-slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
              placeholder="my-portfolio"
              className="max-w-xs"
            />
            <Button onClick={handleSave} disabled={updateProfile.isPending}>
              {updateProfile.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
            </Button>
            {profile?.portfolioSlug && (
              <Button variant="outline" onClick={handleClear} disabled={updateProfile.isPending}>
                Clear
              </Button>
            )}
          </div>
          {slug && (
            <p className="text-xs text-muted-foreground">
              Public URL: <span className="font-mono">pulse.quantic.es/p/{slug}</span>
            </p>
          )}
        </div>
        {updateProfile.isError && (
          <Alert variant="destructive">
            <AlertDescription>
              {updateProfile.error instanceof Error ? updateProfile.error.message : 'Failed to update'}
            </AlertDescription>
          </Alert>
        )}
        {saved && (
          <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
            <Check className="h-4 w-4" /> Saved
          </p>
        )}
      </CardContent>
    </Card>
  )
}

export default SettingsPage
