import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import { createGanttSessionMiddleware } from '../../scripts/gantt-runner-server.mjs'

export default defineConfig({
  root: fileURLToPath(new URL('./', import.meta.url)),
  base: '/lab-runners/gantt/',
  appType: 'mpa',
  publicDir: false,
  // The package exposes CSS only through a style condition; resolve the pinned asset explicitly.
  resolve: {
    alias: {
      'frappe-gantt-runner.css': fileURLToPath(
        new URL('./frappe-gantt.css', import.meta.resolve('frappe-gantt')),
      ),
    },
  },
  plugins: [
    {
      name: 'fixed-c13-session',
      configureServer(server) {
        server.middlewares.use(createGanttSessionMiddleware({ development: true }))
      },
      configurePreviewServer(server) {
        server.middlewares.use(createGanttSessionMiddleware())
      },
    },
  ],
  server: {
    host: '127.0.0.1',
    port: 4321,
    strictPort: true,
    hmr: false,
    fs: { allow: [fileURLToPath(new URL('../../', import.meta.url))] },
  },
  preview: { host: '127.0.0.1', port: 4321, strictPort: true },
  build: {
    outDir: '../../dist-runners/gantt',
    emptyOutDir: true,
    sourcemap: true,
  },
})
