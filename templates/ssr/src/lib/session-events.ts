// Broadcast only session transitions, never cookies or JWTs.
export type SessionEvent = 'signed-in' | 'signed-out'

const channelName = 'reactloom-session'

export function broadcastSessionEvent(event: SessionEvent): void {
  if (typeof BroadcastChannel === 'undefined') return
  // The cookie transition has already completed. A restricted channel must
  // not make a successful sign-in or sign-out appear to have failed.
  try {
    const channel = new BroadcastChannel(channelName)
    try {
      channel.postMessage(event)
    } finally {
      channel.close()
    }
  } catch {
    // Session queries still revalidate on mount, focus, reconnect and interval.
  }
}

export function subscribeSessionEvents(listener: (event: SessionEvent) => void): () => void {
  if (typeof BroadcastChannel === 'undefined') return () => undefined
  try {
    const channel = new BroadcastChannel(channelName)
    channel.onmessage = (message: MessageEvent<unknown>) => {
      if (message.data === 'signed-in' || message.data === 'signed-out') {
        listener(message.data)
      }
    }
    return () => channel.close()
  } catch {
    // Session verification must remain available without cross-tab messaging.
    return () => undefined
  }
}
