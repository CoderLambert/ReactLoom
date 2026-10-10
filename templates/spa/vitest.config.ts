import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    env: {
      VITE_API_BASE_URL: 'http://127.0.0.1:4317',
      VITE_ENABLE_MSW: 'false',
      VITE_APP_NAME: 'ReactLoom',
    },
  },
})
