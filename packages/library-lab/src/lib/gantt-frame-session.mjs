/** Fixed C13 runner, never an arbitrary code or entry-point transport. */
export const GANTT_PROTOCOL = 'reactloom-gantt-v1'
export const GANTT_SESSION =
  /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/u
const LEVELS = new Set(['basic', 'business', 'advanced'])
export const GANTT_APP_ORIGINS = Object.freeze(['http://127.0.0.1:4319', 'http://localhost:4319'])
export function ganttRunnerOrigin(appOrigin) {
  return GANTT_APP_ORIGINS.includes(appOrigin) ? appOrigin.replace(':4319', ':4321') : null
}
export function isRegisteredGanttDemo(entryId, demo) {
  return Boolean(
    entryId === 'C13' &&
      demo &&
      demo.executionKind === 'browser-frame' &&
      demo.entryPoint === 'examples/demo.tsx' &&
      LEVELS.has(demo.level) &&
      demo.demoId === demo.level &&
      (demo.capabilities === undefined ||
        (Array.isArray(demo.capabilities) && demo.capabilities.length === 0)),
  )
}
export function isGanttPacket(data, session, direction) {
  if (
    !data ||
    typeof data !== 'object' ||
    typeof session !== 'string' ||
    Array.isArray(data) ||
    data.protocol !== GANTT_PROTOCOL ||
    data.session !== session ||
    !GANTT_SESSION.test(session)
  )
    return false
  if (direction === 'start')
    return data.type === 'start' && LEVELS.has(data.level) && Object.keys(data).length === 4
  if (data.type === 'ready' || data.type === 'running') return Object.keys(data).length === 3
  return (
    data.type === 'error' &&
    typeof data.message === 'string' &&
    data.message.length > 0 &&
    data.message.length <= 500 &&
    Object.keys(data).length === 4
  )
}
export function createGanttFrameSession({
  window: host = globalThis.window,
  container,
  level,
  onEvent,
  startupTimeoutMs = 15000,
}) {
  const origin = ganttRunnerOrigin(host.location.origin)
  if (
    !origin ||
    !LEVELS.has(level) ||
    typeof onEvent !== 'function' ||
    container?.ownerDocument !== host.document ||
    !Number.isSafeInteger(startupTimeoutMs) ||
    startupTimeoutMs < 1 ||
    startupTimeoutMs > 30000
  )
    throw new Error('C13 requires its registered local origin, container and scenario')
  const session = host.crypto.randomUUID()
  if (!GANTT_SESSION.test(session)) throw new Error('Invalid C13 session identity')
  const frame = host.document.createElement('iframe')
  frame.title = 'Frappe Gantt 隔离示例与键盘任务表格'
  frame.referrerPolicy = 'no-referrer'
  frame.setAttribute('sandbox', 'allow-scripts allow-same-origin')
  frame.style.width = '100%'
  frame.style.height = '760px'
  frame.style.border = '0'
  frame.src = `${origin}/lab-runners/gantt/sessions/${session}/`
  let closed = false,
    started = false,
    deadline
  function close() {
    if (closed) return false
    closed = true
    host.clearTimeout(deadline)
    host.removeEventListener('message', receive)
    // No upstream disposer exists: destroying this document realm is the boundary.
    frame.remove()
    return true
  }
  function fail(message) {
    if (close()) onEvent({ type: 'error', message })
  }
  function receive(event) {
    const data = event.data
    if (
      closed ||
      event.origin !== origin ||
      event.source !== frame.contentWindow ||
      !isGanttPacket(data, session, 'event')
    )
      return
    if (data.type === 'ready' && !started) {
      started = true
      frame.contentWindow.postMessage(
        { protocol: GANTT_PROTOCOL, session, type: 'start', level },
        origin,
      )
    } else if (data.type === 'running' && started) {
      host.clearTimeout(deadline)
      onEvent({ type: 'running' })
    } else if (data.type === 'error') fail(data.message)
  }
  host.addEventListener('message', receive)
  deadline = host.setTimeout(() => fail('隔离甘特图启动超时，执行文档已关闭'), startupTimeoutMs)
  try {
    container.appendChild(frame)
  } catch (error) {
    close()
    throw error
  }
  onEvent({ type: 'loading' })
  return {
    session,
    frame,
    dispose() {
      if (close()) onEvent({ type: 'closed' })
    },
  }
}
