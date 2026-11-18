import { cumulativeChunks, makeLocalReply, recentUserText } from './reply-policy.mjs'
export function abortableSleep(ms, signal) {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(new DOMException('cancelled', 'AbortError'))
      return
    }
    const abort = () => {
      clearTimeout(timer)
      signal.removeEventListener('abort', abort)
      reject(new DOMException('cancelled', 'AbortError'))
    }
    const timer = setTimeout(() => {
      signal.removeEventListener('abort', abort)
      resolve()
    }, ms)
    signal.addEventListener('abort', abort, { once: true })
  })
}
export function createLocalAdapter(level) {
  if (!['basic', 'business', 'advanced'].includes(level)) throw new Error('未知实验层级')
  const active = new Set()
  return {
    adapter: {
      async *run({ messages, abortSignal }) {
        if (abortSignal.aborted) return
        const local = new AbortController()
        const abort = () => local.abort()
        active.add(local)
        abortSignal.addEventListener('abort', abort, { once: true })
        try {
          if (recentUserText(messages) === '/error') throw new Error('本地模拟失败；重新提问可恢复')
          const output = makeLocalReply(messages, level)
          const chunks =
            level === 'basic' ? [output] : cumulativeChunks(output, level === 'advanced' ? 18 : 24)
          for (const text of chunks) {
            if (local.signal.aborted) return
            await abortableSleep(level === 'advanced' ? 450 : 220, local.signal)
            if (local.signal.aborted) return
            yield { content: [{ type: 'text', text }] }
          }
        } catch (error) {
          if (!local.signal.aborted) throw error
        } finally {
          abortSignal.removeEventListener('abort', abort)
          active.delete(local)
        }
      },
    },
    // Cancel only this mounted session. It may accept another run after StrictMode cleanup.
    abortAll() {
      for (const controller of active) controller.abort()
    },
  }
}
