import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

// Entry-owned root/config: do not inherit the host Vite plugins or collect other entries.
export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  test: {
    environment: 'node',
    include: ['examples/{basic,business,advanced}.test.ts'],
    clearMocks: true,
    restoreMocks: true,
    testTimeout: 5_000,
  },
})
