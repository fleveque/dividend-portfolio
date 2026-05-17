import { useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Menu } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import { Logo } from './Logo'
import { ThemeToggle } from './ThemeToggle'
import { LanguageToggle } from './LanguageToggle'
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
  const { t } = useTranslation()

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
              <NavLink to="/" end className={navLinkClass}>{t('nav.home')}</NavLink>

              {isAuthenticated && (
                <>
                  <NavLink to="/radar" className={navLinkClass}>{t('nav.radar')}</NavLink>
                  <NavLink to="/portfolio" className={navLinkClass}>{t('nav.portfolio')}</NavLink>
                  <NavLink to="/settings" className={navLinkClass}>{t('nav.settings')}</NavLink>
                </>
              )}

              {isAuthenticated && user?.admin && (
                <NavLink to="/admin" className={navLinkClass}>{t('nav.admin')}</NavLink>
              )}

              <Separator orientation="vertical" className="h-6 mx-1" />
              <LanguageToggle />
              <ThemeToggle />

              <div className="flex items-center gap-2 ml-1">
                {isLoading ? (
                  <span className="text-muted-foreground text-sm">{t('common.loading')}</span>
                ) : isAuthenticated && user ? (
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground text-sm hidden lg:inline truncate max-w-48">
                      {user.emailAddress}
                    </span>
                    <Button variant="ghost" size="sm" onClick={handleLogout} className="hover:bg-destructive/10 hover:text-destructive">
                      {t('nav.logout')}
                    </Button>
                  </div>
                ) : (
                  <Button asChild size="sm">
                    <Link to="/login">{t('nav.signIn')}</Link>
                  </Button>
                )}
              </div>
            </nav>

            {/* Mobile: language + theme toggle + hamburger */}
            <div className="flex items-center gap-2 md:hidden">
              <LanguageToggle />
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
            <SheetTitle className="text-left">{t('nav.menu')}</SheetTitle>
            <SheetDescription className="sr-only">{t('nav.navigationMenu')}</SheetDescription>
          </SheetHeader>
          <nav className="flex flex-col gap-1 p-4">
            <NavLink to="/" end className={mobileNavLinkClass} onClick={closeMobile}>{t('nav.home')}</NavLink>

            {isAuthenticated && (
              <>
                <NavLink to="/radar" className={mobileNavLinkClass} onClick={closeMobile}>{t('nav.radar')}</NavLink>
                <NavLink to="/portfolio" className={mobileNavLinkClass} onClick={closeMobile}>{t('nav.portfolio')}</NavLink>
                <NavLink to="/settings" className={mobileNavLinkClass} onClick={closeMobile}>{t('nav.settings')}</NavLink>
              </>
            )}

            {isAuthenticated && user?.admin && (
              <NavLink to="/admin" className={mobileNavLinkClass} onClick={closeMobile}>{t('nav.admin')}</NavLink>
            )}

            <Separator className="my-2" />

            {isLoading ? (
              <span className="text-muted-foreground text-sm px-4 py-2">{t('common.loading')}</span>
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
                  {t('nav.logout')}
                </Button>
              </>
            ) : (
              <Button asChild className="mx-4">
                <Link to="/login" onClick={closeMobile}>{t('nav.signIn')}</Link>
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
              <p>{t('footer.builtWith')}</p>
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
