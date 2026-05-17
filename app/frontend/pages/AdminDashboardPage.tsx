import { useState } from 'react'
import { Loader2, FileText } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  useAdminDashboard,
  useAdminUsers,
  useDeleteUser,
  useRefreshStocks,
} from '../hooks/useAdminQueries'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { AdminUser } from '../types'

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-muted-foreground text-sm">{label}</p>
        <p className="text-2xl font-bold text-foreground">{value}</p>
      </CardContent>
    </Card>
  )
}

interface SessionTrendBucket {
  weekStart: string
  count: number
}

function SessionTrend({ buckets }: { buckets: SessionTrendBucket[] }) {
  const { t, i18n } = useTranslation()
  const max = Math.max(1, ...buckets.map((b) => b.count))

  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-muted-foreground text-sm mb-3">{t('admin.activity.sessionTrend')}</p>
        <div className="flex items-end gap-1 h-24">
          {buckets.map((b) => {
            const pct = Math.max(2, Math.round((b.count / max) * 100))
            const dateLabel = new Date(b.weekStart).toLocaleDateString(i18n.language, { month: 'short', day: 'numeric' })
            return (
              <div key={b.weekStart} className="flex-1 flex flex-col items-center gap-1" title={`${dateLabel}: ${b.count}`}>
                <div className="w-full bg-blue-500 rounded-sm" style={{ height: `${pct}%` }} />
                <span className="text-[10px] text-muted-foreground font-mono">{dateLabel}</span>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

function UserRow({
  user,
  onDelete,
  isDeleting,
}: {
  user: AdminUser
  onDelete: (id: number) => void
  isDeleting: boolean
}) {
  const { t } = useTranslation()
  const [showConfirm, setShowConfirm] = useState(false)

  return (
    <>
      <TableRow>
        <TableCell className="text-foreground">{user.emailAddress}</TableCell>
        <TableCell className="text-muted-foreground">{user.name || '-'}</TableCell>
        <TableCell>
          {user.admin ? (
            <Badge variant="default">{t('admin.adminBadge')}</Badge>
          ) : (
            <span className="text-xs text-muted-foreground">{t('admin.userBadge')}</span>
          )}
        </TableCell>
        <TableCell className="text-muted-foreground">{user.provider || t('admin.emailProvider')}</TableCell>
        <TableCell className="text-muted-foreground text-center">{user.radarStocksCount}</TableCell>
        <TableCell className="text-muted-foreground text-center">{user.holdingsCount}</TableCell>
        <TableCell className="text-muted-foreground text-center">{user.transactionsCount}</TableCell>
        <TableCell className="text-muted-foreground">
          {user.portfolioSlug ? (
            <Badge variant="success">{user.portfolioSlug}</Badge>
          ) : (
            <span className="text-xs text-muted-foreground">-</span>
          )}
        </TableCell>
        <TableCell className="text-muted-foreground text-sm">
          {new Date(user.createdAt).toLocaleDateString()}
        </TableCell>
        <TableCell>
          <Button
            variant="ghost"
            size="xs"
            onClick={() => setShowConfirm(true)}
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            {t('common.delete')}
          </Button>
        </TableCell>
      </TableRow>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('admin.deleteUser')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('admin.deleteUserConfirm', { email: user.emailAddress })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onDelete(user.id)
                setShowConfirm(false)
              }}
              disabled={isDeleting}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export function AdminDashboardPage() {
  const { t } = useTranslation()
  const { data: stats, isLoading: statsLoading, error: statsError } = useAdminDashboard()
  const { data: users, isLoading: usersLoading, error: usersError } = useAdminUsers()
  const deleteUser = useDeleteUser()
  const refreshStocks = useRefreshStocks()
  const [refreshMessage, setRefreshMessage] = useState<string | null>(null)

  const handleRefresh = () => {
    refreshStocks.mutate(undefined, {
      onSuccess: () => {
        setRefreshMessage(t('admin.refreshSuccess'))
        setTimeout(() => setRefreshMessage(null), 5000)
      },
      onError: (err) => {
        const message = err instanceof Error ? err.message : String(err)
        setRefreshMessage(t('admin.refreshError', { message }))
        setTimeout(() => setRefreshMessage(null), 5000)
      },
    })
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-8 flex items-center gap-2">
        <span className="w-1 h-8 bg-foreground rounded-full"></span>
        {t('admin.title')}
      </h1>

      {/* Stats Section */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-foreground mb-4">{t('admin.overview')}</h2>
        {statsLoading && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> {t('admin.loadingStats')}
          </div>
        )}
        {statsError && (
          <Alert variant="destructive">
            <AlertDescription>{t('admin.failedToLoadStats', { message: (statsError as Error).message })}</AlertDescription>
          </Alert>
        )}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <StatCard label={t('admin.totalUsers')} value={stats.users.total} />
            <StatCard label={t('admin.admins')} value={stats.users.admins} />
            <StatCard label={t('admin.recentSignups')} value={stats.users.recentSignups} />
            <StatCard label={t('admin.totalStocks')} value={stats.stocks.total} />
            <StatCard label={t('admin.stocksWithPrice')} value={stats.stocks.withPrice} />
            <StatCard label={t('admin.totalRadars')} value={stats.radars.total} />
            <StatCard label={t('admin.stocksTracked')} value={stats.radars.totalStocksTracked} />
            <StatCard label={t('admin.avgStocksPerRadar')} value={stats.radars.avgStocksPerRadar} />
            <StatCard label={t('admin.buyPlans')} value={stats.buyPlans.total} />
            <StatCard label={t('admin.transactions')} value={stats.transactions.total} />
            <StatCard label={t('admin.totalPortfolios')} value={stats.holdings.usersWithHoldings} />
            <StatCard label={t('admin.totalHoldings')} value={stats.holdings.totalHoldings} />
            <StatCard label={t('admin.avgHoldingsPerUser')} value={stats.holdings.avgHoldingsPerUser} />
            <StatCard label={t('admin.pulseUsers')} value={stats.pulse.usersWithSlug} />
            <StatCard label={t('admin.pulseAdoption')} value={`${stats.pulse.adoptionRate}%`} />
          </div>
        )}
      </section>

      {/* Activity Section */}
      {stats?.activity && (
        <section className="mb-10">
          <h2 className="text-xl font-semibold text-foreground mb-4">{t('admin.activity.title')}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-4">
            <StatCard label={t('admin.activity.activeUsers7d')} value={stats.activity.activeUsers7d} />
            <StatCard label={t('admin.activity.activeUsers30d')} value={stats.activity.activeUsers30d} />
            <StatCard label={t('admin.activity.holdingChanges7d')} value={stats.activity.holdingChanges7d} />
            <StatCard label={t('admin.activity.holdingChanges30d')} value={stats.activity.holdingChanges30d} />
            <StatCard label={t('admin.activity.usersTouchingHoldings7d')} value={stats.activity.usersTouchingHoldings7d} />
          </div>
          <SessionTrend buckets={stats.activity.sessionTrend} />
        </section>
      )}

      {/* Stock Refresh Section */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-foreground mb-4">{t('admin.tools')}</h2>
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={handleRefresh} disabled={refreshStocks.isPending}>
            {refreshStocks.isPending ? (
              <><Loader2 className="size-4 animate-spin" /> {t('common.refreshing')}</>
            ) : (
              t('admin.refreshAllStocks')
            )}
          </Button>
          <Button asChild variant="outline">
            <Link to="/admin/content-drafts">
              <FileText className="size-4 mr-1" /> {t('admin.openContentDrafts')}
            </Link>
          </Button>
          {refreshMessage && (
            <p className={`text-sm ${refreshMessage.startsWith('Error') ? 'text-destructive' : 'text-emerald-600 dark:text-emerald-400'}`}>
              {refreshMessage}
            </p>
          )}
        </div>
      </section>

      {/* Users Section */}
      <section>
        <h2 className="text-xl font-semibold text-foreground mb-4">{t('admin.users')}</h2>
        {usersLoading && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> {t('admin.loadingUsers')}
          </div>
        )}
        {usersError && (
          <Alert variant="destructive">
            <AlertDescription>{t('admin.failedToLoadUsers', { message: (usersError as Error).message })}</AlertDescription>
          </Alert>
        )}
        {users && (
          <Card>
            <CardContent className="p-0 overflow-x-auto">
              <Table className="min-w-[900px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('admin.email')}</TableHead>
                    <TableHead>{t('admin.name')}</TableHead>
                    <TableHead>{t('admin.role')}</TableHead>
                    <TableHead>{t('admin.provider')}</TableHead>
                    <TableHead className="text-center">{t('admin.radarStocks')}</TableHead>
                    <TableHead className="text-center">{t('admin.holdings')}</TableHead>
                    <TableHead className="text-center">{t('admin.transactions')}</TableHead>
                    <TableHead>{t('admin.pulseSlug')}</TableHead>
                    <TableHead>{t('admin.joined')}</TableHead>
                    <TableHead>{t('admin.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <UserRow
                      key={user.id}
                      user={user}
                      onDelete={(id) => deleteUser.mutate(id)}
                      isDeleting={deleteUser.isPending}
                    />
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  )
}

export default AdminDashboardPage
