import { AppState } from 'react-native'

export function subscribeToForeground(checkSession: () => void) {
  const subscription = AppState.addEventListener('change', (state) => {
    if (state === 'active') checkSession()
  })
  return () => subscription.remove()
}
