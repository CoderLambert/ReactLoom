import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'
import { defineConfig, searchForWorkspaceRoot } from 'vite'

const root = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    process.env.ANALYZE === 'true'
      ? visualizer({ filename: 'dist/stats.html', gzipSize: true, open: false })
      : undefined,
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
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
})
