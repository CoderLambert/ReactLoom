import { createEnv } from '@t3-oss/env-nextjs'
import * as z from 'zod'

const DEV_SECRET = 'dev-only-reactloom-session-secret-32'

export const env = createEnv({
  server: {
    SESSION_SECRET: z.string().min(32).default(DEV_SECRET),
    REACTLOOM_STRICT_SECRETS: z.enum(['true', 'false']).default('false'),
  },
  client: {
    NEXT_PUBLIC_APP_NAME: z.string().min(1).default('ReactLoom'),
    NEXT_PUBLIC_SENTRY_DSN: z.url().optional(),
    NEXT_PUBLIC_ENABLE_MSW: z.enum(['true', 'false']).default('false'),
    NEXT_PUBLIC_REACT_SCAN: z.enum(['true', 'false']).default('false'),
  },
  runtimeEnv: {
    SESSION_SECRET: process.env.SESSION_SECRET,
    REACTLOOM_STRICT_SECRETS: process.env.REACTLOOM_STRICT_SECRETS,
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
    NEXT_PUBLIC_ENABLE_MSW: process.env.NEXT_PUBLIC_ENABLE_MSW,
    NEXT_PUBLIC_REACT_SCAN: process.env.NEXT_PUBLIC_REACT_SCAN,
  },
  emptyStringAsUndefined: true,
})

export function assertProductionSecret() {
  if (env.REACTLOOM_STRICT_SECRETS === 'true' && env.SESSION_SECRET === DEV_SECRET) {
    throw new Error('Set SESSION_SECRET before running with REACTLOOM_STRICT_SECRETS=true.')
  }
}
