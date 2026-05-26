import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Navigate, Outlet } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { demoApi } from '../lib/api'
import { useAuth } from '../contexts/AuthContext'
import { DemoModeProvider } from '../contexts/DemoModeContext'
import { SignupNudgeDialog } from '../components/SignupNudgeDialog'

// Outlet wrapper that powers all /demo/* routes. Fetches the curated bundle
// once, primes React Query under the keys the regular hooks read from
// (['radar'], ['holdings'], ['dividends'], ['dividends', 'chart', ...]), then
// renders the same Radar / Portfolio / Dividends pages — they read from the
// prefilled cache and never know they're in a demo.
export function DemoPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Demo is for anonymous visitors only. Skip the fetch when the user is
  // signed in (or while auth is still resolving) — the early-return below
  // will redirect them.
  const skipFetch = authLoading || isAuthenticated

  useEffect(() => {
    if (skipFetch) return
    let cancelled = false
    demoApi
      .get()
      .then((bundle) => {
        if (cancelled) return
        queryClient.setQueryData(['profile'], bundle.profile)
        queryClient.setQueryData(['radar'], bundle.radar)
        queryClient.setQueryData(['holdings'], bundle.holdings)
        queryClient.setQueryData(['dividends'], bundle.dividends)
        queryClient.setQueryData(['dividends', 'chart', 'default'], bundle.chart)
        queryClient.setQueryData(['dividends', 'chart', 'full'], bundle.chartFull)
        setReady(true)
      })
      .catch((err) => {
        if (cancelled) return
        setError(err instanceof Error ? err.message : String(err))
      })
    return () => {
      cancelled = true
    }
  }, [queryClient, skipFetch])

  // Wipe demo prefill on unmount so a subsequent sign-up + navigation gets
  // the real (empty) user data — not demo data leaking into the account.
  useEffect(() => {
    return () => {
      queryClient.removeQueries({ queryKey: ['profile'] })
      queryClient.removeQueries({ queryKey: ['radar'] })
      queryClient.removeQueries({ queryKey: ['holdings'] })
      queryClient.removeQueries({ queryKey: ['dividends'] })
    }
  }, [queryClient])

  if (authLoading) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground mx-auto" />
      </div>
    )
  }
  if (isAuthenticated) {
    return <Navigate to="/portfolio" replace />
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p className="text-destructive">{t('demo.loadError', { message: error })}</p>
      </div>
    )
  }

  if (!ready) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground mx-auto" />
      </div>
    )
  }

  return (
    <DemoModeProvider isDemoMode>
      <Outlet />
      <SignupNudgeDialog />
    </DemoModeProvider>
  )
}

export default DemoPage
