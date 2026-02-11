import { useState } from 'react'
import { Loader2 } from 'lucide-react'
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

function UserRow({
  user,
  onDelete,
  isDeleting,
}: {
  user: AdminUser
  onDelete: (id: number) => void
  isDeleting: boolean
}) {
  const [showConfirm, setShowConfirm] = useState(false)

  return (
    <>
      <TableRow>
        <TableCell className="text-foreground">{user.emailAddress}</TableCell>
        <TableCell className="text-muted-foreground">{user.name || '-'}</TableCell>
        <TableCell>
          {user.admin ? (
            <Badge variant="default">Admin</Badge>
          ) : (
            <span className="text-xs text-muted-foreground">User</span>
          )}
        </TableCell>
        <TableCell className="text-muted-foreground">{user.provider || 'email'}</TableCell>
        <TableCell className="text-muted-foreground text-center">{user.radarStocksCount}</TableCell>
        <TableCell className="text-muted-foreground text-center">{user.transactionsCount}</TableCell>
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
            Delete
          </Button>
        </TableCell>
      </TableRow>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete user?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {user.emailAddress}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onDelete(user.id)
                setShowConfirm(false)
              }}
              disabled={isDeleting}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export function AdminDashboardPage() {
  const { data: stats, isLoading: statsLoading, error: statsError } = useAdminDashboard()
  const { data: users, isLoading: usersLoading, error: usersError } = useAdminUsers()
  const deleteUser = useDeleteUser()
  const refreshStocks = useRefreshStocks()
  const [refreshMessage, setRefreshMessage] = useState<string | null>(null)

  const handleRefresh = () => {
    refreshStocks.mutate(undefined, {
      onSuccess: () => {
        setRefreshMessage('Stock refresh job enqueued successfully.')
        setTimeout(() => setRefreshMessage(null), 5000)
      },
      onError: (err) => {
        const message = err instanceof Error ? err.message : String(err)
        setRefreshMessage(`Error: ${message}`)
        setTimeout(() => setRefreshMessage(null), 5000)
      },
    })
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-8 flex items-center gap-2">
        <span className="w-1 h-8 bg-foreground rounded-full"></span>
        Admin Dashboard
      </h1>

      {/* Stats Section */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-foreground mb-4">Overview</h2>
        {statsLoading && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Loading stats...
          </div>
        )}
        {statsError && (
          <Alert variant="destructive">
            <AlertDescription>Failed to load stats: {(statsError as Error).message}</AlertDescription>
          </Alert>
        )}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <StatCard label="Total Users" value={stats.users.total} />
            <StatCard label="Admins" value={stats.users.admins} />
            <StatCard label="Recent Signups (30d)" value={stats.users.recentSignups} />
            <StatCard label="Total Stocks" value={stats.stocks.total} />
            <StatCard label="Stocks with Price" value={stats.stocks.withPrice} />
            <StatCard label="Total Radars" value={stats.radars.total} />
            <StatCard label="Stocks Tracked" value={stats.radars.totalStocksTracked} />
            <StatCard label="Avg Stocks/Radar" value={stats.radars.avgStocksPerRadar} />
            <StatCard label="Buy Plans" value={stats.buyPlans.total} />
            <StatCard label="Transactions" value={stats.transactions.total} />
          </div>
        )}
      </section>

      {/* Stock Refresh Section */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-foreground mb-4">Stock Data</h2>
        <div className="flex items-center gap-4">
          <Button onClick={handleRefresh} disabled={refreshStocks.isPending}>
            {refreshStocks.isPending ? (
              <><Loader2 className="size-4 animate-spin" /> Refreshing...</>
            ) : (
              'Refresh All Stocks'
            )}
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
        <h2 className="text-xl font-semibold text-foreground mb-4">Users</h2>
        {usersLoading && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Loading users...
          </div>
        )}
        {usersError && (
          <Alert variant="destructive">
            <AlertDescription>Failed to load users: {(usersError as Error).message}</AlertDescription>
          </Alert>
        )}
        {users && (
          <Card>
            <CardContent className="p-0 overflow-x-auto">
              <Table className="min-w-[640px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead className="text-center">Radar Stocks</TableHead>
                    <TableHead className="text-center">Transactions</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Actions</TableHead>
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
