import { createEnv } from '@t3-oss/env-core'
import * as z from 'zod'

export const env = createEnv({
  clientPrefix: 'VITE_',
  client: {
    VITE_API_BASE_URL: z.url().default('http://127.0.0.1:4317'),
    VITE_ENABLE_MSW: z.enum(['true', 'false']).default('true'),
    VITE_SENTRY_DSN: z.url().optional(),
    VITE_APP_NAME: z.string().min(1).default('ReactLoom'),
    VITE_DEVTOOLS: z.enum(['true', 'false']).default('true'),
  },
  runtimeEnv: import.meta.env,
  emptyStringAsUndefined: true,
})
