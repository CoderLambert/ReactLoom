// No access token or user data crosses tabs; only this browser-session nonce.
const CHANNEL_NAME = 'reactloom.session-logout'

type LogoutMessage = { type: 'logout'; sessionId: string }

export function publishSessionLogout(sessionId: string) {
  if (typeof BroadcastChannel === 'undefined') return
  try {
    const channel = new BroadcastChannel(CHANNEL_NAME)
    channel.postMessage({ type: 'logout', sessionId } satisfies LogoutMessage)
    channel.close()
  } catch {
    // Browsers may disable this API; per-tab expiration still remains enforced.
  }
}

export function subscribeToSessionLogout(onLogout: (sessionId: string) => void) {
  if (typeof BroadcastChannel === 'undefined') return () => undefined
  try {
    const channel = new BroadcastChannel(CHANNEL_NAME)
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
    return () => channel.close()
  } catch {
    return () => undefined
  }
}
