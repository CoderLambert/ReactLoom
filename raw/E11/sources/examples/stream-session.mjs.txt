export const initialSession = { status: 'ready', received: 0, markdown: '' }

function appendNext(state, chunks) {
  const delta = chunks[state.received]
  if (delta === undefined) return state
  const received = state.received + 1
  return {
    status:
      received === chunks.length ? 'completed' : state.status === 'playing' ? 'playing' : 'paused',
    received,
    markdown: state.markdown + delta,
  }
}

export function transitionSession(state, action, chunks) {
  const finished = state.status === 'completed' || state.status === 'ended'
  switch (action.type) {
    case 'start':
      return finished ? state : { ...state, status: 'playing' }
    case 'pause':
      return state.status === 'playing' ? { ...state, status: 'paused' } : state
    case 'next':
      return finished || state.status === 'playing' ? state : appendNext(state, chunks)
    case 'tick':
      return state.status === 'playing' ? appendNext(state, chunks) : state
    case 'end':
      return finished || state.received === 0 ? state : { ...state, status: 'ended' }
    case 'reset':
      return initialSession
    default:
      return state
  }
}
