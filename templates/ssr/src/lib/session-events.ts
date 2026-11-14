// Session transitions are advisory: receivers must verify the current cookie.
export type SessionEvent = 'signed-in' | 'signed-out'

type SessionNotice = { event: SessionEvent; id: string; broadcastSent: boolean }

const channelName = 'reactloom-session'
const storageKey = 'reactloom-session-signal'
const maxSeenNotices = 32

function isSessionEvent(value: unknown): value is SessionEvent {
  return value === 'signed-in' || value === 'signed-out'
}

function parseNotice(value: unknown): SessionNotice | null {
  if (!value || typeof value !== 'object') return null
  const notice = value as Partial<SessionNotice>
  return isSessionEvent(notice.event) &&
    typeof notice.id === 'string' &&
    notice.id.length > 0 &&
    typeof notice.broadcastSent === 'boolean'
    ? { event: notice.event, id: notice.id, broadcastSent: notice.broadcastSent }
    : null
}

export function broadcastSessionEvent(event: SessionEvent): void {
  // Preserve the original string payload for tabs running an older bundle.
  // The storage notice has an event id only, never a cookie or JWT.
  let broadcastSent = false
  if (typeof BroadcastChannel !== 'undefined') {
    try {
      const channel = new BroadcastChannel(channelName)
      try {
        channel.postMessage(event)
        broadcastSent = true
      } finally {
        channel.close()
      }
    } catch {
      // The cookie transition must succeed even when messaging is denied.
    }
  }

  // A sender may support BroadcastChannel while its recipient does not.
  // Publish a transient storage notice in both cases; capable listeners
  // ignore the mirror when the original channel delivery was attempted.
  if (typeof window !== 'undefined') {
    const notice: SessionNotice = {
      event,
      id: globalThis.crypto?.randomUUID?.() ?? Date.now() + '-' + Math.random(),
      broadcastSent,
    }
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(notice))
      window.localStorage.removeItem(storageKey)
    } catch {
      // Storage may be unavailable in private or sandboxed browsing contexts.
    }
  }
}

export function subscribeSessionEvents(listener: (event: SessionEvent) => void): () => void {
  const seen = new Set<string>()
  const receive = (value: unknown) => {
    if (isSessionEvent(value)) {
      listener(value)
      return
    }
    const notice = parseNotice(value)
    if (!notice || seen.has(notice.id)) return
    seen.add(notice.id)
    if (seen.size > maxSeenNotices) {
      const oldest = seen.values().next().value
      if (oldest) seen.delete(oldest)
    }
    listener(notice.event)
  }

  let channel: BroadcastChannel | undefined
  if (typeof BroadcastChannel !== 'undefined') {
    try {
      channel = new BroadcastChannel(channelName)
      channel.onmessage = (message: MessageEvent<unknown>) => receive(message.data)
    } catch {
      // Keep the storage-event subscriber when the channel is denied.
    }
  }

  const target = typeof window === 'undefined' ? undefined : window
  const onStorage = (event: StorageEvent) => {
    if (event.key !== storageKey || !event.newValue) return
    try {
      const notice = parseNotice(JSON.parse(event.newValue))
      if (notice && (!channel || !notice.broadcastSent)) receive(notice)
    } catch {
      // Ignore malformed or unrelated storage events.
    }
  }
  target?.addEventListener('storage', onStorage)

  return () => {
    target?.removeEventListener('storage', onStorage)
    try {
      channel?.close()
    } catch {
      // Teardown must not interrupt an auth transition.
    }
  }
}
