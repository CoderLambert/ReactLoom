import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import { createWorkerMiddleware } from '../../scripts/msw-runner-server.mjs'
import { APP_ORIGIN } from '../../src/lib/frame-session.mjs'

const root = fileURLToPath(new URL('./', import.meta.url))
const asset = new URL('./public/mockServiceWorker.js', import.meta.url)
const headers = {
  'Content-Security-Policy': `default-src 'none'; script-src 'self'; worker-src 'self'; connect-src 'self'; style-src 'self'; img-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors ${APP_ORIGIN}`,
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
}
async function attach(server, file) {
  server.middlewares.use(createWorkerMiddleware(await readFile(file)))
}
export default defineConfig({
  root,
  base: '/lab-runners/msw/',
  publicDir: 'public',
  plugins: [
    {
      name: 'scoped-msw-asset',
      configureServer: (server) => attach(server, asset),
      configurePreviewServer: (server) =>
        attach(server, new URL('../../dist-runners/msw/mockServiceWorker.js', import.meta.url)),
    },
  ],
  server: {
    host: '127.0.0.1',
    port: 4320,
    strictPort: true,
    hmr: false,
    headers,
    fs: { allow: [fileURLToPath(new URL('../../', import.meta.url))] },
  },
  preview: { host: '127.0.0.1', port: 4320, strictPort: true, headers },
  build: { outDir: '../../dist-runners/msw', emptyOutDir: true, sourcemap: true },
})
