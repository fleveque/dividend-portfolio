import { useState } from 'react'
import {
  useAdminDashboard,
  useAdminUsers,
  useDeleteUser,
  useRefreshStocks,
} from '../hooks/useAdminQueries'
import type { AdminUser } from '../types'

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-theme-elevated rounded-lg border border-theme p-4">
      <p className="text-theme-muted text-sm">{label}</p>
      <p className="text-2xl font-bold text-theme-primary">{value}</p>
    </div>
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
    <tr className="border-b border-theme">
      <td className="py-3 px-4 text-theme-primary">{user.emailAddress}</td>
      <td className="py-3 px-4 text-theme-secondary">{user.name || '-'}</td>
      <td className="py-3 px-4">
        {user.admin ? (
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary-100 dark:bg-primary-900 text-brand">
            Admin
          </span>
        ) : (
          <span className="text-xs text-theme-muted">User</span>
        )}
      </td>
      <td className="py-3 px-4 text-theme-secondary">{user.provider || 'email'}</td>
      <td className="py-3 px-4 text-theme-secondary text-center">{user.radarStocksCount}</td>
      <td className="py-3 px-4 text-theme-secondary text-center">{user.transactionsCount}</td>
      <td className="py-3 px-4 text-theme-secondary text-sm">
        {new Date(user.createdAt).toLocaleDateString()}
      </td>
      <td className="py-3 px-4">
        {showConfirm ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onDelete(user.id)
                setShowConfirm(false)
              }}
              disabled={isDeleting}
              className="text-xs px-2 py-1 rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 cursor-pointer"
            >
              Confirm
            </button>
            <button
              onClick={() => setShowConfirm(false)}
              className="text-xs px-2 py-1 rounded bg-theme-muted text-theme-secondary hover:bg-theme-surface cursor-pointer"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowConfirm(true)}
            className="text-xs px-2 py-1 rounded text-red-600 hover:bg-red-100 dark:hover:bg-red-900 cursor-pointer"
          >
            Delete
          </button>
        )}
      </td>
    </tr>
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
      <h1 className="text-3xl font-bold text-theme-primary mb-8 flex items-center gap-2">
        <span className="w-1 h-8 bg-brand rounded-full"></span>
        Admin Dashboard
      </h1>

      {/* Stats Section */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-theme-primary mb-4">Overview</h2>
        {statsLoading && <p className="text-theme-muted">Loading stats...</p>}
        {statsError && (
          <p className="text-red-500">Failed to load stats: {(statsError as Error).message}</p>
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
        <h2 className="text-xl font-semibold text-theme-primary mb-4">Stock Data</h2>
        <div className="flex items-center gap-4">
          <button
            onClick={handleRefresh}
            disabled={refreshStocks.isPending}
            className="btn-primary px-4 py-2 text-sm disabled:opacity-50 cursor-pointer"
          >
            {refreshStocks.isPending ? 'Refreshing...' : 'Refresh All Stocks'}
          </button>
          {refreshMessage && (
            <p
              className={`text-sm ${refreshMessage.startsWith('Error') ? 'text-red-500' : 'text-green-600 dark:text-green-400'}`}
            >
              {refreshMessage}
            </p>
          )}
        </div>
      </section>

      {/* Users Section */}
      <section>
        <h2 className="text-xl font-semibold text-theme-primary mb-4">Users</h2>
        {usersLoading && <p className="text-theme-muted">Loading users...</p>}
        {usersError && (
          <p className="text-red-500">Failed to load users: {(usersError as Error).message}</p>
        )}
        {users && (
          <div className="overflow-x-auto rounded-lg border border-theme">
            <table className="w-full text-sm">
              <thead className="bg-theme-muted">
                <tr>
                  <th className="py-3 px-4 text-left text-theme-secondary font-medium">Email</th>
                  <th className="py-3 px-4 text-left text-theme-secondary font-medium">Name</th>
                  <th className="py-3 px-4 text-left text-theme-secondary font-medium">Role</th>
                  <th className="py-3 px-4 text-left text-theme-secondary font-medium">Provider</th>
                  <th className="py-3 px-4 text-center text-theme-secondary font-medium">
                    Radar Stocks
                  </th>
                  <th className="py-3 px-4 text-center text-theme-secondary font-medium">
                    Transactions
                  </th>
                  <th className="py-3 px-4 text-left text-theme-secondary font-medium">Joined</th>
                  <th className="py-3 px-4 text-left text-theme-secondary font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <UserRow
                    key={user.id}
                    user={user}
                    onDelete={(id) => deleteUser.mutate(id)}
                    isDeleting={deleteUser.isPending}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}

export default AdminDashboardPage
