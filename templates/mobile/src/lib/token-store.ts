import { Platform } from 'react-native'
import * as z from 'zod'
import { type Session, sessionSchema } from '../features/auth/schema'

const KEY = 'reactloom.session'
const INVALIDATED_SESSION = '{"version":1,"session":null}'
const storedSessionSchema = z.strictObject({ version: z.literal(1), session: sessionSchema })

export async function readSession(): Promise<Session | null> {
  const raw =
    Platform.OS === 'web'
      ? globalThis.localStorage.getItem(KEY)
      : await (await import('expo-secure-store')).getItemAsync(KEY)
  if (raw === null) return null
  let value: unknown
  try {
    value = JSON.parse(raw)
  } catch {
    return null
  }
  const result = storedSessionSchema.safeParse(value)
  return result.success && result.data.session.expiresAt > Date.now() ? result.data.session : null
}

export async function readToken(): Promise<string | null> {
  return (await readSession())?.accessToken ?? null
}

export async function writeSession(session: Session | null): Promise<void> {
  const value =
    session === null ? null : JSON.stringify({ version: 1, session: sessionSchema.parse(session) })
  if (Platform.OS === 'web') {
    if (value !== null) {
      globalThis.localStorage.setItem(KEY, value)
    } else {
      let deletionError: unknown
      try {
        globalThis.localStorage.removeItem(KEY)
        // A fulfilled delete may still leave a valid bearer on disk.
        if (globalThis.localStorage.getItem(KEY) === null) return
      } catch (error) {
        deletionError = error
      }
      try {
        globalThis.localStorage.setItem(KEY, INVALIDATED_SESSION)
        if (globalThis.localStorage.getItem(KEY) === INVALIDATED_SESSION) return
      } catch (error) {
        throw deletionError ?? error
      }
      throw deletionError ?? new Error('Session storage deletion was ignored.')
    }
    return
  }
  const SecureStore = await import('expo-secure-store')
  if (value !== null) {
    await SecureStore.setItemAsync(KEY, value)
    return
  }
  let deletionError: unknown
  try {
    await SecureStore.deleteItemAsync(KEY)
    // A fulfilled platform Promise does not prove that the persisted bearer changed.
    if ((await SecureStore.getItemAsync(KEY)) === null) return
  } catch (error) {
    deletionError = error
  }
  try {
    await SecureStore.setItemAsync(KEY, INVALIDATED_SESSION)
    if ((await SecureStore.getItemAsync(KEY)) === INVALIDATED_SESSION) return
  } catch (error) {
    throw deletionError ?? error
  }
  throw deletionError ?? new Error('Session storage deletion was ignored.')
}
