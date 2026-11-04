import { createRoot, type Root } from 'react-dom/client'
import 'frappe-gantt-runner.css'
import Example from '../../entries/C13-frappe-gantt/examples/example'
import {
  GANTT_APP_ORIGINS,
  GANTT_PROTOCOL,
  GANTT_SESSION,
  isGanttPacket,
} from '../../src/lib/gantt-frame-session.mjs'
import type { Level } from '../../src/lib/types'

const match = location.pathname.match(/^\/lab-runners\/gantt\/sessions\/([^/]+)\/$/u)
const appOrigin = GANTT_APP_ORIGINS.find(
  (origin) => origin.replace(':4319', ':4321') === location.origin,
)
if (
  window.parent !== window &&
  appOrigin &&
  match &&
  GANTT_SESSION.test(match[1]) &&
  !location.search
) {
  const session = match[1],
    element = document.getElementById('root')
  if (!element) throw new Error('Missing C13 runner root')
  const container: HTMLElement = element
  let root: Root | undefined,
    started = false,
    closed = false
  const post = (type: 'ready' | 'running' | 'error', message?: string) => {
    if (!closed)
      parent.postMessage(
        {
          protocol: GANTT_PROTOCOL,
          session,
          type,
          ...(message ? { message: message.slice(0, 500) } : {}),
        },
        appOrigin,
      )
  }
  const observer = new MutationObserver(() => {
    const error = container.querySelector('[role="alert"]')
    if (error) {
      observer.disconnect()
      post('error', error.textContent || '甘特图加载失败')
    } else if (container.querySelector('svg.gantt')) {
      observer.disconnect()
      post('running')
    }
  })
  function receive(event: MessageEvent) {
    if (
      closed ||
      started ||
      event.origin !== appOrigin ||
      event.source !== parent ||
      !isGanttPacket(event.data, session, 'start')
    )
      return
    started = true
    observer.observe(container, { childList: true, subtree: true })
    root = createRoot(container)
    // One mounted example per document; StrictMode would repeat a non-disposable constructor.
    root.render(<Example level={event.data.level as Level} />)
  }
  const error = (event: ErrorEvent) => post('error', event.message || '隔离示例运行失败')
  const rejection = (event: PromiseRejectionEvent) => post('error', String(event.reason))
  window.addEventListener('message', receive)
  window.addEventListener('error', error)
  window.addEventListener('unhandledrejection', rejection)
  window.addEventListener(
    'pagehide',
    () => {
      closed = true
      observer.disconnect()
      window.removeEventListener('message', receive)
      window.removeEventListener('error', error)
      window.removeEventListener('unhandledrejection', rejection)
      root?.unmount()
    },
    { once: true },
  )
  post('ready')
}
