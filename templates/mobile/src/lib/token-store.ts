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
      try {
        globalThis.localStorage.removeItem(KEY)
      } catch (deletionError) {
        // A denied remove can leave a valid bearer token for the next reload.
        // If writes are still permitted, persist an invalid session tombstone.
        try {
          globalThis.localStorage.setItem(KEY, INVALIDATED_SESSION)
        } catch {
          throw deletionError
        }
      }
    }
    return
  }
  const SecureStore = await import('expo-secure-store')
  if (value !== null) {
    await SecureStore.setItemAsync(KEY, value)
    return
  }
  try {
    await SecureStore.deleteItemAsync(KEY)
  } catch (deletionError) {
    // A failed native delete may still permit an overwrite. Replace the token
    // with a schema-invalid tombstone so a later launch cannot restore it.
    // If both operations fail, report the storage error rather than claiming logout succeeded.
    try {
      await SecureStore.setItemAsync(KEY, INVALIDATED_SESSION)
    } catch {
      throw deletionError
    }
  }
}
