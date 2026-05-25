import { lazy, Suspense } from 'react'
import { Loader2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { AnonHome } from './home/AnonHome'

// Lazy-load the logged-in dashboard so anonymous visitors don't pay for
// dashboard-only widget and hook imports.
const DashboardHome = lazy(() => import('./home/DashboardHome'))

export function HomePage() {
  const { isAuthenticated } = useAuth()

  if (!isAuthenticated) return <AnonHome />

  return (
    <Suspense
      fallback={
        <div className="container mx-auto flex items-center justify-center p-12">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <DashboardHome />
    </Suspense>
  )
}

export default HomePage
