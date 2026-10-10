import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function HomePage() {
  const { t } = useTranslation()

  return (
    <div className="grid items-end gap-10 lg:grid-cols-[1.3fr_0.7fr]">
      <div className="space-y-6">
        <p className="text-xs font-semibold tracking-[0.22em] text-copper uppercase">
          {t('home.eyebrow')}
        </p>
        <h1 className="max-w-xl text-5xl leading-tight sm:text-6xl">{t('home.title')}</h1>
        <p className="max-w-xl text-lg text-muted">{t('home.body')}</p>
        <Link
          to="/login"
          className="inline-flex rounded-full bg-ink px-5 py-3 text-sm font-semibold text-linen"
        >
          {t('home.enter')}
        </Link>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">ReactLoom</CardTitle>
          <CardDescription>SPA</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3 text-sm">
            <li>{t('home.api')}</li>
            <li>{t('home.query')}</li>
            <li>{t('home.a11y')}</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
