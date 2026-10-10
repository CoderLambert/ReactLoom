import { Redirect } from 'expo-router'
import { Text, View } from 'react-native'
import { useAuth } from '@/features/auth/auth-context'

export default function Index() {
  const auth = useAuth()
  if (auth.status === 'loading') {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f4f0e6',
        }}
      >
        <Text>Loading session…</Text>
      </View>
    )
  }
  if (auth.status === 'authenticated') return <Redirect href="/tasks" />
  return <Redirect href="/login" />
}
