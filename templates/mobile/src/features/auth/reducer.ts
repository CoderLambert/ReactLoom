import type { Session } from '@/features/auth/schema'

export type AuthState =
  | { status: 'loading' }
  | { status: 'anonymous' }
  | { status: 'authenticated'; session: Session }

export type AuthEvent =
  | { type: 'hydrated'; session: Session | null }
  | { type: 'signed-in'; session: Session }
  | { type: 'signed-out' }

export const initialAuthState: AuthState = { status: 'loading' }

export function authReducer(state: AuthState, event: AuthEvent): AuthState {
  switch (event.type) {
    case 'hydrated':
      return event.session
        ? { status: 'authenticated', session: event.session }
        : { status: 'anonymous' }
    case 'signed-in':
      return { status: 'authenticated', session: event.session }
    case 'signed-out':
      return { status: 'anonymous' }
    default:
      return state
  }
}
