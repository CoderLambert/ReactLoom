// No access token or user data crosses tabs; only this browser-session nonce.
const CHANNEL_NAME = 'reactloom.session-logout'
const STORAGE_EVENT_KEY = 'reactloom.session-logout-event'

type LogoutMessage = { type: 'logout'; sessionId: string }

export function publishSessionLogout(sessionId: string) {
  if (typeof BroadcastChannel !== 'undefined') {
    try {
      const channel = new BroadcastChannel(CHANNEL_NAME)
      channel.postMessage({ type: 'logout', sessionId } satisfies LogoutMessage)
      channel.close()
    } catch {
      // A disabled or failing BroadcastChannel must not block sign-out.
    }
  }

  // A tab may not support BroadcastChannel even when its sibling does.
  // The storage event is cross-tab only; delete the nonce immediately so no
  // revocation message (and never an access token) remains in persistent storage.
  try {
    if (typeof localStorage === 'undefined') return
    localStorage.setItem(STORAGE_EVENT_KEY, sessionId)
    localStorage.removeItem(STORAGE_EVENT_KEY)
  } catch {
    // Private browsing can deny storage; per-tab expiration remains enforced.
  }
}

export function subscribeToSessionLogout(onLogout: (sessionId: string) => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_EVENT_KEY && event.newValue) onLogout(event.newValue)
  }
  if (typeof window !== 'undefined') window.addEventListener('storage', onStorage)

  let channel: BroadcastChannel | undefined
  if (typeof BroadcastChannel !== 'undefined') {
    try {
      channel = new BroadcastChannel(CHANNEL_NAME)
      channel.onmessage = ({ data }: MessageEvent<unknown>) => {
        if (
          data &&
          typeof data === 'object' &&
          'type' in data &&
          'sessionId' in data &&
          data.type === 'logout' &&
          typeof data.sessionId === 'string'
        ) {
          onLogout(data.sessionId)
        }
      }
    } catch {
      try {
        channel?.close()
      } catch {
        // Ignore disabled channel cleanup errors.
      }
      channel = undefined
    }
  }

  return () => {
    if (typeof window !== 'undefined') window.removeEventListener('storage', onStorage)
    try {
      channel?.close()
    } catch {
      // An unavailable channel must not break component unmount.
    }
  }
}
