import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useState } from 'react'
import { I18nextProvider } from 'react-i18next'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { AuthProvider } from '@/features/auth/auth-context'
import { DevInspector } from '@/lib/dev-inspector'
import { i18n } from '@/lib/i18n'

export default function RootLayout() {
  const [client] = useState(() => new QueryClient())
  return (
    <DevInspector>
      <SafeAreaProvider>
        <I18nextProvider i18n={i18n}>
          <QueryClientProvider client={client}>
            <AuthProvider>
              <StatusBar style="dark" />
              <Stack
                screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#f4f0e6' } }}
              />
            </AuthProvider>
          </QueryClientProvider>
        </I18nextProvider>
      </SafeAreaProvider>
    </DevInspector>
  )
}
