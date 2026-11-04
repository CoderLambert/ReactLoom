import type { Session } from '@/features/auth/schema'

export type AuthState =
  | { status: 'loading' }
  | { status: 'anonymous'; error?: string }
  | { status: 'authenticated'; session: Session }

export type AuthEvent =
  | { type: 'hydrated'; session: Session | null }
  | { type: 'signed-in'; session: Session }
  | { type: 'signed-out' }
  | { type: 'storage-failed' }

export const initialAuthState: AuthState = { status: 'loading' }

export function authReducer(state: AuthState, event: AuthEvent): AuthState {
  switch (event.type) {
    case 'hydrated':
      if (state.status !== 'loading') return state
      return event.session
        ? { status: 'authenticated', session: event.session }
        : { status: 'anonymous' }
    case 'signed-in':
      return { status: 'authenticated', session: event.session }
    case 'signed-out':
      return { status: 'anonymous' }
    case 'storage-failed':
      return { status: 'anonymous', error: 'Session storage is unavailable.' }
    default:
      return state
  }
}
