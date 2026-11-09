import { standardSchemaResolver } from '@hookform/resolvers/standard-schema'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useLogin } from '@/features/auth/hooks'
import { type LoginInput, loginSchema } from '@/features/auth/schema'
import { isApiError } from '@/lib/api'

export function LoginPage() {
  const { t } = useTranslation()
  const login = useLogin()
  const form = useForm<LoginInput>({
    resolver: standardSchemaResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  const errorMessage = isApiError(login.error)
    ? login.error.message
    : login.error
      ? t('tasks.error')
      : null

  return (
    <Card className="mx-auto max-w-md">
      <CardHeader>
        <CardTitle>{t('login.title')}</CardTitle>
        <CardDescription>{t('login.hint')}</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-4"
          noValidate
          onSubmit={form.handleSubmit((values) => login.mutate(values))}
        >
          <div className="space-y-2">
            <Label htmlFor="email">{t('login.email')}</Label>
            <Input
              id="email"
              type="email"
              autoComplete="username"
              aria-invalid={form.formState.errors.email ? true : undefined}
              aria-describedby={form.formState.errors.email ? 'login-email-error' : undefined}
              {...form.register('email')}
            />
            {form.formState.errors.email ? (
              <p id="login-email-error" className="text-sm text-copper" role="alert">
                {form.formState.errors.email.message}
              </p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">{t('login.password')}</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              aria-invalid={form.formState.errors.password ? true : undefined}
              aria-describedby={form.formState.errors.password ? 'login-password-error' : undefined}
              {...form.register('password')}
            />
            {form.formState.errors.password ? (
              <p id="login-password-error" className="text-sm text-copper" role="alert">
                {form.formState.errors.password.message}
              </p>
            ) : null}
          </div>
          {errorMessage ? (
            <p className="text-sm text-copper" role="alert">
              {errorMessage}
            </p>
          ) : null}
          <Button type="submit" disabled={login.isPending}>
            {login.isPending ? t('login.submitting') : t('login.submit')}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
