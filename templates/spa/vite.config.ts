import fs from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath, URL } from 'node:url'
import {
  createLighthouseServer,
  isLocalDevtoolsRequest,
} from '@reactloom/devtools/lighthouse-server'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { codeInspectorPlugin } from 'code-inspector-plugin'
import { visualizer } from 'rollup-plugin-visualizer'
import { defineConfig, loadEnv, searchForWorkspaceRoot } from 'vite'
import checker from 'vite-plugin-checker'

type InspectorEditor = NonNullable<Parameters<typeof codeInspectorPlugin>[0]['editor']>

// Points the inspector at scripts/code. The shim runs open-in-editor.mjs.
function activateEditor(configDir: string): InspectorEditor {
  const beside = path.join(configDir, 'scripts', 'open-in-editor.mjs')
  const modulePath = fs.existsSync(beside)
    ? beside
    : path.join(configDir, '..', '..', 'scripts', 'open-in-editor.mjs')
  const loaded = createRequire(modulePath)(modulePath) as {
    activateLauncher: (dir: string) => string
  }
  return loaded.activateLauncher(configDir) as InspectorEditor
}

const root = fileURLToPath(new URL('.', import.meta.url))
const devtoolsStub = fileURLToPath(new URL('./src/lib/devtools-stub.ts', import.meta.url))
const workflowStub = fileURLToPath(new URL('./src/lib/workflow-stub.ts', import.meta.url))

export default defineConfig(({ command, mode }) => {
  const clickToSource = command === 'serve' && process.env.VITE_DEVTOOLS !== 'false'
  const devtoolsEnabled = loadEnv(mode, root, 'VITE_').VITE_DEVTOOLS !== 'false'
  return {
    plugins: [
      // Before the React plugin so JSX keeps data-insp-path. Dev server only; production builds omit it.
      clickToSource
        ? codeInspectorPlugin({
            bundler: 'vite',
            editor: activateEditor(root),
            hotKeys: ['ctrlKey', 'shiftKey', 'altKey'],
          })
        : undefined,
      react(),
      tailwindcss(),
      checker({ typescript: true, enableBuild: false }),
      {
        name: 'reactloom-lighthouse',
        apply: 'serve',
        configureServer(server) {
          if (!devtoolsEnabled || process.env.STORYBOOK === 'true') return
          const lighthouse = createLighthouseServer(root, 'http://127.0.0.1:4317/')
          server.middlewares.use('/__reactloom/lighthouse', async (request, response) => {
            if (
              !isLocalDevtoolsRequest(request.headers.host ?? null, request.headers.origin ?? null)
            ) {
              response.statusCode = 404
              response.end()
              return
            }
            if (request.method !== 'GET' && request.method !== 'POST') {
              response.statusCode = 405
              response.end()
              return
            }
            if (request.method === 'POST') lighthouse.run()
            response.setHeader('Content-Type', 'application/json')
            response.setHeader('Cache-Control', 'no-store')
            response.end(JSON.stringify(await lighthouse.state()))
          })
        },
      },
      process.env.ANALYZE === 'true'
        ? visualizer({ filename: 'dist/stats.html', gzipSize: true, open: false })
        : undefined,
    ],
    resolve: {
      alias: {
        ...(command === 'build' ? { '@/app/devtools-plugins': devtoolsStub } : {}),
        '@': fileURLToPath(new URL('./src', import.meta.url)),
        // The production build resolves React Scan to an empty module. Development keeps
        // the import order stable; the panel or VITE_REACT_SCAN can start scanning.
        ...(command === 'build' ? { 'react-scan': devtoolsStub } : {}),
        ...(command === 'build'
          ? {
              '@tanstack/react-devtools': devtoolsStub,
              '@tanstack/react-router-devtools': devtoolsStub,
              '@tanstack/react-query-devtools': devtoolsStub,
            }
          : {}),
        // App production builds drop the worker and the React axe logger.
        // `build-storybook` sets STORYBOOK so the stories can still import them.
        // Exact subpaths. A bare `msw` key is a prefix and turns `msw/browser`
        // into `workflow-stub.ts/browser` when the dev import is still in the graph.
        ...(command === 'build' && process.env.STORYBOOK !== 'true'
          ? {
              'msw/browser': workflowStub,
              'msw/http': workflowStub,
              'msw/node': workflowStub,
              '@axe-core/react': workflowStub,
            }
          : {}),
      },
    },
    server: {
      host: '0.0.0.0',
      port: 4317,
      // Report files must not trigger a reload and interrupt the panel's polling.
      watch: { ignored: ['**/.lighthouseci/**'] },
      // The error overlay stays on (Vite's default) and checker adds TypeScript.
      // Open the app URL, not 0.0.0.0. CI, Playwright, and Storybook keep it closed.
      open:
        process.env.CI || process.env.REACTLOOM_OPEN === 'false' || process.env.STORYBOOK === 'true'
          ? false
          : 'http://127.0.0.1:4317',
      fs: {
        allow: [searchForWorkspaceRoot(root), root],
      },
    },
    preview: {
      host: '0.0.0.0',
      port: 4317,
    },
    css: {
      devSourcemap: true,
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
  }
})
