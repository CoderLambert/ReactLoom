import { releaseProxy } from 'comlink'

// A release request is not an acknowledgment. Physical termination must not wait for it.
export function disposeSession(active) {
  if (!active) return '没有活动 Worker'
  active.controller.abort(new DOMException('Session ended', 'AbortError'))
  let release = 'releaseProxy 已请求'
  try {
    active.remote[releaseProxy]()
  } catch {
    release = 'releaseProxy 请求失败'
  } finally {
    active.worker.terminate()
  }
  return `${release}；terminate 已调用（不是释放 ACK）`
}
