// Broadcast only session transitions, never cookies or JWTs.
export type SessionEvent = 'signed-in' | 'signed-out'

const channelName = 'reactloom-session'

export function broadcastSessionEvent(event: SessionEvent): void {
  if (typeof BroadcastChannel === 'undefined') return
  const channel = new BroadcastChannel(channelName)
  channel.postMessage(event)
  channel.close()
}

export function subscribeSessionEvents(listener: (event: SessionEvent) => void): () => void {
  if (typeof BroadcastChannel === 'undefined') return () => undefined
  const channel = new BroadcastChannel(channelName)
  channel.onmessage = (message: MessageEvent<unknown>) => {
    if (message.data === 'signed-in' || message.data === 'signed-out') {
      listener(message.data)
    }
  }
  return () => channel.close()
}
