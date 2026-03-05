import { useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Menu } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { Logo } from './Logo'
import { ThemeToggle } from './ThemeToggle'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
    isActive
      ? 'bg-accent text-accent-foreground'
      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
  }`

const mobileNavLinkClass = ({ isActive }: { isActive: boolean }) =>
  `block px-4 py-3 rounded-lg text-base font-medium transition-colors ${
    isActive
      ? 'bg-accent text-accent-foreground'
      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
  }`

export function Layout() {
  const { user, isAuthenticated, isLoading, logout } = useAuth()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  const closeMobile = () => setMobileMenuOpen(false)

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background border-b shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center py-3">
            <Link to="/" className="flex items-center hover:opacity-80 transition-opacity shrink-0">
              <Logo size="md" showText={true} />
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-2 lg:gap-4">
              <NavLink to="/" end className={navLinkClass}>Home</NavLink>

              {isAuthenticated && (
                <>
                  <NavLink to="/radar" className={navLinkClass}>Radar</NavLink>
                  <NavLink to="/portfolio" className={navLinkClass}>Portfolio</NavLink>
                  <NavLink to="/settings" className={navLinkClass}>Settings</NavLink>
                </>
              )}

              {isAuthenticated && user?.admin && (
                <NavLink to="/admin" className={navLinkClass}>Admin</NavLink>
              )}

              <Separator orientation="vertical" className="h-6 mx-1" />
              <ThemeToggle />

              <div className="flex items-center gap-2 ml-1">
                {isLoading ? (
                  <span className="text-muted-foreground text-sm">Loading...</span>
                ) : isAuthenticated && user ? (
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground text-sm hidden lg:inline truncate max-w-48">
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

            {/* Mobile: theme toggle + hamburger */}
            <div className="flex items-center gap-2 md:hidden">
              <ThemeToggle />
              <Button variant="ghost" size="sm" onClick={() => setMobileMenuOpen(true)}>
                <Menu className="size-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Nav Sheet */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="right" className="w-72 p-0">
          <SheetHeader className="p-4 border-b">
            <SheetTitle className="text-left">Menu</SheetTitle>
            <SheetDescription className="sr-only">Navigation menu</SheetDescription>
          </SheetHeader>
          <nav className="flex flex-col gap-1 p-4">
            <NavLink to="/" end className={mobileNavLinkClass} onClick={closeMobile}>Home</NavLink>

            {isAuthenticated && (
              <>
                <NavLink to="/radar" className={mobileNavLinkClass} onClick={closeMobile}>Radar</NavLink>
                <NavLink to="/portfolio" className={mobileNavLinkClass} onClick={closeMobile}>Portfolio</NavLink>
                <NavLink to="/settings" className={mobileNavLinkClass} onClick={closeMobile}>Settings</NavLink>
              </>
            )}

            {isAuthenticated && user?.admin && (
              <NavLink to="/admin" className={mobileNavLinkClass} onClick={closeMobile}>Admin</NavLink>
            )}

            <Separator className="my-2" />

            {isLoading ? (
              <span className="text-muted-foreground text-sm px-4 py-2">Loading...</span>
            ) : isAuthenticated && user ? (
              <>
                <span className="text-muted-foreground text-sm px-4 py-2 truncate">
                  {user.emailAddress}
                </span>
                <Button
                  variant="ghost"
                  onClick={() => { handleLogout(); closeMobile() }}
                  className="justify-start hover:bg-destructive/10 hover:text-destructive"
                >
                  Logout
                </Button>
              </>
            ) : (
              <Button asChild className="mx-4">
                <Link to="/login" onClick={closeMobile}>Sign In</Link>
              </Button>
            )}
          </nav>
        </SheetContent>
      </Sheet>

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
