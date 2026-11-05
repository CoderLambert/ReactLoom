import { Link, Outlet, useNavigate, useRouterState } from '@tanstack/react-router'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { SkipLink } from '@/components/layout/skip-link'
import { Button } from '@/components/ui/button'
import { useLogout } from '@/features/auth/hooks'
import { getActiveSession, useAuthStore } from '@/features/auth/store'
import { useMatchMedia } from '@/hooks/use-match-media'
import { i18n } from '@/lib/i18n'
import { useTheme } from '@/lib/theme'

export function Shell() {
  const { t } = useTranslation()
  const session = useAuthStore((state) => state.session)
  const theme = useTheme((state) => state.theme)
  const toggleTheme = useTheme((state) => state.toggle)
  const logout = useLogout()
  const navigate = useNavigate()
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const compact = useMatchMedia('(max-width: 640px)')

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  // A mounted protected route must not retain a private task screen indefinitely
  // after its token expires without another navigation or API request.
  useEffect(() => {
    if (!session) return

    let timer: ReturnType<typeof setTimeout> | undefined
    const checkExpiry = () => {
      // An old timer must not clear or redirect a replacement session.
      if (useAuthStore.getState().session !== session) return
      // Foreground checks can run before a throttled background timer fires.
      clearTimeout(timer)
      const remaining = session.expiresAt - Date.now()
      if (remaining <= 0) {
        getActiveSession()
        if (pathname === '/tasks') void navigate({ to: '/login' })
        return
      }
      // Browser timers cannot represent delays beyond a signed 32-bit integer.
      timer = setTimeout(checkExpiry, Math.min(remaining, 2_147_483_647))
    }
    const checkWhenVisible = () => {
      if (document.visibilityState === 'visible') checkExpiry()
    }

    checkExpiry()
    window.addEventListener('focus', checkExpiry)
    document.addEventListener('visibilitychange', checkWhenVisible)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('focus', checkExpiry)
      document.removeEventListener('visibilitychange', checkWhenVisible)
    }
  }, [session, pathname, navigate])

  return (
    <div className="min-h-screen">
      <SkipLink />
      <header className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-5">
        <Link to="/" className="font-serif text-xl">
          {compact ? 'RL' : t('appName')}
        </Link>
        <nav aria-label="Primary" className="flex items-center gap-2">
          <Link
            to="/"
            aria-current={pathname === '/' ? 'page' : undefined}
            className="px-2 text-sm"
          >
            {t('nav.home')}
          </Link>
          <Link to="/tasks" search={{ status: 'all' }} className="px-2 text-sm">
            {t('nav.tasks')}
          </Link>
          {session ? (
            <Button variant="ghost" onClick={() => logout.mutate()}>
              {t('nav.signOut')}
            </Button>
          ) : (
            <Button variant="secondary" onClick={() => navigate({ to: '/login' })}>
              {t('nav.signIn')}
            </Button>
          )}
          <label className="sr-only" htmlFor="language">
            {t('language.label')}
          </label>
          <select
            id="language"
            className="rounded-full bg-transparent px-2 py-1 text-sm ring-1 ring-line"
            value={i18n.language}
            onChange={(event) => {
              void i18n.changeLanguage(event.target.value)
            }}
          >
            <option value="en">{t('language.en')}</option>
            <option value="es">{t('language.es')}</option>
          </select>
          <Button variant="ghost" onClick={toggleTheme}>
            {theme === 'dark' ? t('theme.toLight') : t('theme.toDark')}
          </Button>
        </nav>
      </header>
      <main id="content" className="mx-auto max-w-5xl px-5 pt-6 pb-20">
        <Outlet />
      </main>
    </div>
  )
}
