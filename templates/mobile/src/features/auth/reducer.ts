import type { Session } from '@/features/auth/schema'

export type AuthState = { revision: number } & (
  | { status: 'loading' }
  | { status: 'anonymous'; error?: string }
  | { status: 'authenticated'; session: Session }
)

export type AuthEvent =
  | { type: 'hydrated'; session: Session | null }
  | { type: 'signed-in'; session: Session }
  | { type: 'signed-out' }
  | { type: 'storage-failed' }

export const initialAuthState: AuthState = { status: 'loading', revision: 0 }

export function authReducer(state: AuthState, event: AuthEvent): AuthState {
  switch (event.type) {
    case 'hydrated':
      if (state.status !== 'loading') return state
      return event.session
        ? { status: 'authenticated', session: event.session, revision: state.revision + 1 }
        : { status: 'anonymous', revision: state.revision }
    case 'signed-in':
      return {
        status: 'authenticated',
        session: event.session,
        revision:
          state.revision +
          (state.status === 'authenticated' && state.session === event.session ? 0 : 1),
      }
    case 'signed-out':
      return {
        status: 'anonymous',
        revision: state.revision + (state.status === 'authenticated' ? 1 : 0),
      }
    case 'storage-failed':
      return {
        status: 'anonymous',
        error: 'Session storage is unavailable.',
        revision: state.revision + (state.status === 'authenticated' ? 1 : 0),
      }
    default:
      return state
  }
}
