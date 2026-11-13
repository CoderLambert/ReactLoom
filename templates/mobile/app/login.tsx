import { standardSchemaResolver } from '@hookform/resolvers/standard-schema'
import { Redirect } from 'expo-router'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Pressable, Text, TextInput, View } from 'react-native'
import { useAuth } from '@/features/auth/auth-context'
import { loginValidationErrorKeys } from '@/features/auth/login-validation'
import { type LoginInput, loginSchema } from '@/features/auth/schema'

export default function LoginScreen() {
  const { t } = useTranslation()
  const auth = useAuth()
  const [error, setError] = useState<string | null>(null)
  const form = useForm<LoginInput>({
    resolver: standardSchemaResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })
  const message = auth.error ?? error
  const fieldErrors = loginValidationErrorKeys(form.formState.errors)

  if (auth.status === 'authenticated') return <Redirect href="/tasks" />

  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        padding: 24,
        backgroundColor: '#f4f0e6',
        gap: 16,
      }}
    >
      <Text accessibilityRole="header" style={{ fontSize: 40, color: '#1c1915' }}>
        {t('title')}
      </Text>
      <Text style={{ color: '#5e564c' }}>Fixture account: ada@reactloom.dev / loom-demo</Text>
      <Controller
        control={form.control}
        name="email"
        render={({ field }) => (
          <TextInput
            accessibilityLabel={t('email')}
            accessibilityHint={fieldErrors.email ? t(fieldErrors.email) : undefined}
            autoCapitalize="none"
            autoComplete="username"
            keyboardType="email-address"
            value={field.value}
            onChangeText={field.onChange}
            placeholder={t('email')}
            style={inputStyle}
          />
        )}
      />
      {fieldErrors.email && <Text accessibilityRole="alert">{t(fieldErrors.email)}</Text>}
      <Controller
        control={form.control}
        name="password"
        render={({ field }) => (
          <TextInput
            accessibilityLabel={t('password')}
            accessibilityHint={fieldErrors.password ? t(fieldErrors.password) : undefined}
            secureTextEntry
            autoComplete="current-password"
            value={field.value}
            onChangeText={field.onChange}
            placeholder={t('password')}
            style={inputStyle}
          />
        )}
      />
      {fieldErrors.password && <Text accessibilityRole="alert">{t(fieldErrors.password)}</Text>}
      {message ? <Text accessibilityRole="alert">{message}</Text> : null}
      <Pressable
        accessibilityRole="button"
        onPress={form.handleSubmit(async (values) => {
          try {
            setError(null)
            await auth.signIn(values)
          } catch (cause) {
            setError(cause instanceof Error ? cause.message : 'Sign in failed.')
          }
        })}
        style={{
          backgroundColor: '#1c1915',
          borderRadius: 999,
          paddingVertical: 12,
          alignItems: 'center',
        }}
      >
        <Text style={{ color: '#f4f0e6', fontWeight: '600' }}>{t('signIn')}</Text>
      </Pressable>
    </View>
  )
}

const inputStyle = {
  backgroundColor: '#fffdf8',
  borderRadius: 16,
  paddingHorizontal: 14,
  paddingVertical: 12,
  borderWidth: 1,
  borderColor: '#e3dac8',
}
