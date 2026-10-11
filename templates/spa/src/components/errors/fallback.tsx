import { devInspectorPath, parseDevStack } from '@reactloom/devtools/stack'
import { Link } from '@tanstack/react-router'
import { createElement } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'

type FallbackProps = {
  error: unknown
  resetErrorBoundary?: () => void
}

export function Fallback({ error, resetErrorBoundary }: FallbackProps) {
  const { t } = useTranslation()
  const message = error instanceof Error ? error.message : t('errors.body')
  const stack = import.meta.env.DEV && error instanceof Error ? error.stack : undefined

  return (
    <div role="alert" className="mx-auto max-w-lg space-y-4 py-16">
      <h1 className="text-4xl">{t('errors.title')}</h1>
      <p className="text-muted">{message}</p>
      {stack ? <DevFrames stack={stack} /> : null}
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

function DevFrames({ stack }: { stack: string }) {
  const frames = parseDevStack(stack)
  return (
    <div className="space-y-2">
      <p className="text-sm text-muted">
        Click a project frame to open it. Control+Shift+Option (Ctrl+Shift+Alt) uses the same
        inspector as the rest of the page. Compile errors stay in the Vite overlay.
      </p>
      <pre className="overflow-auto rounded-2xl bg-ink/5 p-4 text-xs leading-5">
        {frames.map((frame, index) => {
          if (!frame.file || frame.line === undefined || frame.column === undefined) {
            return createElement('span', { key: index, className: 'block text-muted' }, frame.text)
          }
          const path = devInspectorPath({
            file: frame.file,
            line: frame.line,
            column: frame.column,
          })
          return createElement(
            'button',
            {
              key: index,
              type: 'button',
              className: 'block w-full text-left text-copper hover:underline',
              'data-insp-path': path,
              onClick: () => openInspectorFrame(frame.file, frame.line, frame.column),
            },
            frame.text.trim() || path,
          )
        })}
      </pre>
    </div>
  )
}

function openInspectorFrame(
  file: string | undefined,
  line: number | undefined,
  column: number | undefined,
) {
  if (!file || line === undefined || column === undefined) return
  const url = `http://127.0.0.1:5678/?file=${encodeURIComponent(file)}&line=${line}&column=${column}`
  void fetch(url).catch(() => undefined)
}
