import { createEnv } from '@t3-oss/env-core'
import * as z from 'zod'

export const env = createEnv({
  clientPrefix: 'EXPO_PUBLIC_',
  client: {
    EXPO_PUBLIC_API_BASE_URL: z.url().default('http://127.0.0.1:4317'),
    EXPO_PUBLIC_USE_FIXTURES: z.enum(['true', 'false']).default('true'),
    EXPO_PUBLIC_SENTRY_DSN: z.url().optional(),
    EXPO_PUBLIC_DEVTOOLS: z.enum(['true', 'false']).default('true'),
  },
  runtimeEnv: {
    EXPO_PUBLIC_API_BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL,
    EXPO_PUBLIC_USE_FIXTURES: process.env.EXPO_PUBLIC_USE_FIXTURES,
    EXPO_PUBLIC_SENTRY_DSN: process.env.EXPO_PUBLIC_SENTRY_DSN,
    EXPO_PUBLIC_DEVTOOLS: process.env.EXPO_PUBLIC_DEVTOOLS,
  },
  emptyStringAsUndefined: true,
})
