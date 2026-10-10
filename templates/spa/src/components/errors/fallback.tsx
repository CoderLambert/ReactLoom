import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'

type FallbackProps = {
  error: unknown
  resetErrorBoundary?: () => void
}

export function Fallback({ error, resetErrorBoundary }: FallbackProps) {
  const { t } = useTranslation()
  const message = error instanceof Error ? error.message : t('errors.body')

  return (
    <div role="alert" className="mx-auto max-w-lg space-y-4 py-16">
      <h1 className="text-4xl">{t('errors.title')}</h1>
      <p className="text-muted">{message}</p>
      <div className="flex gap-3">
        {resetErrorBoundary ? (
          <Button onClick={resetErrorBoundary}>{t('errors.retry')}</Button>
        ) : null}
        <Link to="/" className="inline-flex items-center text-sm font-semibold text-copper">
          {t('errors.home')}
        </Link>
      </div>
    </div>
  )
}
