import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'
import { defineConfig, searchForWorkspaceRoot } from 'vite'
import checker from 'vite-plugin-checker'

const root = fileURLToPath(new URL('.', import.meta.url))
const devtoolsStub = fileURLToPath(new URL('./src/lib/devtools-stub.ts', import.meta.url))

export default defineConfig(({ command }) => ({
  plugins: [
    react(),
    tailwindcss(),
    checker({ typescript: true, enableBuild: false }),
    process.env.ANALYZE === 'true'
      ? visualizer({ filename: 'dist/stats.html', gzipSize: true, open: false })
      : undefined,
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      // Production builds swap dev-only panels for an empty module so they stay out of the gzip budget.
      ...(command === 'build'
        ? {
            'react-scan': devtoolsStub,
            '@tanstack/react-router-devtools': devtoolsStub,
            '@tanstack/react-query-devtools': devtoolsStub,
          }
        : {}),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 4317,
    fs: {
      allow: [searchForWorkspaceRoot(root), root],
    },
  },
  preview: {
    host: '0.0.0.0',
    port: 4317,
  },
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (id.includes('@tanstack')) return 'tanstack'
          if (id.includes('i18next') || id.includes('react-i18next')) return 'i18n'
          if (id.includes('@sentry')) return 'sentry'
          return
        },
      },
    },
  },
}))
