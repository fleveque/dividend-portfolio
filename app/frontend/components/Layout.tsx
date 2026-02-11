import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Logo } from './Logo'
import { ThemeToggle } from './ThemeToggle'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

export function Layout() {
  const { user, isAuthenticated, isLoading, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background border-b shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center py-3">
            <Link to="/" className="flex items-center hover:opacity-80 transition-opacity shrink-0">
              <Logo size="md" showText={true} />
            </Link>

            <nav className="flex items-center gap-1 sm:gap-2 md:gap-4">
              <NavLink
                to="/"
                className={({ isActive }) =>
                  `px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  }`
                }
              >
                Home
              </NavLink>

              {isAuthenticated && (
                <NavLink
                  to="/radar"
                  className={({ isActive }) =>
                    `px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-accent text-accent-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                    }`
                  }
                >
                  Radar
                </NavLink>
              )}

              {isAuthenticated && user?.admin && (
                <NavLink
                  to="/admin"
                  className={({ isActive }) =>
                    `px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-accent text-accent-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                    }`
                  }
                >
                  Admin
                </NavLink>
              )}

              <Separator orientation="vertical" className="h-6 mx-1 hidden sm:block" />

              <ThemeToggle />

              <div className="flex items-center gap-2 ml-1">
                {isLoading ? (
                  <span className="text-muted-foreground text-sm">Loading...</span>
                ) : isAuthenticated && user ? (
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground text-sm hidden md:inline truncate max-w-48">
                      {user.emailAddress}
                    </span>
                    <Button variant="ghost" size="sm" onClick={handleLogout} className="hover:bg-destructive/10 hover:text-destructive">
                      Logout
                    </Button>
                  </div>
                ) : (
                  <Button asChild size="sm">
                    <Link to="/login">Sign In</Link>
                  </Button>
                )}
              </div>
            </nav>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="bg-background border-t py-6 sm:py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <Logo size="sm" showText={true} />
            <div className="text-muted-foreground text-xs sm:text-sm text-center">
              <p>Built with Ruby on Rails, React, TypeScript, and Tailwind CSS</p>
              <p className="mt-1">
                &copy; {new Date().getFullYear()}{' '}
                <a
                  href="https://leveque.es"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground hover:underline"
                >
                  Francesc Leveque
                </a>
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Layout
