'use client'

import { devInspectorPath, parseDevStack } from '@reactloom/devtools/stack'
import { createElement } from 'react'
import { errorMessageForDisplay } from '@/lib/error-display'

export default function RouteError({ error, reset }: { error: unknown; reset: () => void }) {
  const stack =
    process.env.NODE_ENV !== 'production' && error instanceof Error ? error.stack : undefined

  return (
    <div role="alert" className="space-y-4 py-16">
      <h1 className="text-4xl">This view hit a snag.</h1>
      <p className="text-muted">{errorMessageForDisplay(error, process.env.NODE_ENV)}</p>
      {stack ? <DevFrames stack={stack} /> : null}
      <button
        type="button"
        className="rounded-full bg-ink px-4 py-2 text-sm text-linen"
        onClick={reset}
      >
        Try again
      </button>
    </div>
  )
}

function DevFrames({ stack }: { stack: string }) {
  const frames = parseDevStack(stack)
  return (
    <div className="space-y-2">
      <p className="text-sm text-muted">
        Click a project frame to open it. Control+Shift+Option (Ctrl+Shift+Alt) uses the same
        inspector as the rest of the page. Compile errors stay in the Next.js overlay.
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
              onClick: () => openNextFrame(frame.file, frame.line, frame.column),
            },
            frame.text.trim() || path,
          )
        })}
      </pre>
    </div>
  )
}

function openNextFrame(
  file: string | undefined,
  line: number | undefined,
  column: number | undefined,
) {
  if (!file || line === undefined || column === undefined) return
  const params = new URLSearchParams({
    file,
    line1: String(line),
    column1: String(column),
  })
  void fetch(`/__nextjs_launch-editor?${params}`).catch(() => undefined)
}
