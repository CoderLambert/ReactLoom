import { Platform } from 'react-native'

const KEY = 'reactloom.session'

export async function readToken(): Promise<string | null> {
  if (Platform.OS === 'web') return globalThis.localStorage?.getItem(KEY) ?? null
  const SecureStore = await import('expo-secure-store')
  return SecureStore.getItemAsync(KEY)
}

export async function writeToken(token: string | null): Promise<void> {
  if (Platform.OS === 'web') {
    if (token) globalThis.localStorage?.setItem(KEY, token)
    else globalThis.localStorage?.removeItem(KEY)
    return
  }
  const SecureStore = await import('expo-secure-store')
  if (token) await SecureStore.setItemAsync(KEY, token)
  else await SecureStore.deleteItemAsync(KEY)
}
