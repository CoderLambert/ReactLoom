import fs from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import bundleAnalyzer from '@next/bundle-analyzer'
import { codeInspectorPlugin } from 'code-inspector-plugin'
import type { NextConfig } from 'next'
import { headersFor } from './src/server/security-headers'

// `pnpm analyze` is `next analyze --output` (Turbopack). This wrapper still
// writes `.next/analyze` for `ANALYZE=true next build --webpack`.
const withBundleAnalyzer = bundleAnalyzer({ enabled: process.env.ANALYZE === 'true' })

type InspectorEditor = NonNullable<Parameters<typeof codeInspectorPlugin>[0]['editor']>

// Points the inspector at scripts/code. The shim runs open-in-editor.mjs.
// Turbopack loader options must be plain data, so this returns a string.
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

// A boolean `dev: false` turns the plugin off for production builds and Playwright.
// Functions and regexes are not serializable.
const clickToSource =
  process.env.NODE_ENV !== 'production' && process.env.NEXT_PUBLIC_DEVTOOLS !== 'false'

// TanStack panels follow the shared devtools switch. React Scan has a separate,
// opt-in startup switch; the shared panel can also activate scanning on demand.
const productionBuild = process.env.NODE_ENV === 'production'
const tanStackDevtoolsStub =
  process.env.NODE_ENV === 'production' || process.env.NEXT_PUBLIC_DEVTOOLS === 'false'
const reactScanStub =
  productionBuild || (tanStackDevtoolsStub && process.env.NEXT_PUBLIC_REACT_SCAN !== 'true')
    ? './src/lib/react-scan-stub.ts'
    : undefined

// App builds drop the worker and the React axe logger. Storybook sets STORYBOOK
// so `storybook build` can still import the real packages.
const workflowStub =
  process.env.STORYBOOK === 'true' || !tanStackDevtoolsStub
    ? undefined
    : './src/lib/workflow-stub.ts'

function bundledAliases(): Record<string, string> | undefined {
  const alias: Record<string, string> = {}
  if (reactScanStub) alias['react-scan'] = reactScanStub
  if (tanStackDevtoolsStub) {
    alias['@/app/devtools-plugins'] = './src/lib/react-scan-stub.ts'
    alias['@tanstack/react-devtools'] = './src/lib/react-scan-stub.ts'
    alias['@tanstack/react-query-devtools'] = './src/lib/react-scan-stub.ts'
  }
  if (workflowStub) {
    alias['msw/browser'] = workflowStub
    alias['msw/http'] = workflowStub
    alias['msw/node'] = workflowStub
    alias['@axe-core/react'] = workflowStub
  }
  return Object.keys(alias).length > 0 ? alias : undefined
}

const aliases = bundledAliases()

function webpackWithAliases(entries: Record<string, string>) {
  return (config: { resolve?: { alias?: unknown } }) => {
    const resolve = config.resolve ?? {}
    const current = resolve.alias
    const alias =
      current && typeof current === 'object' && !Array.isArray(current)
        ? { ...(current as Record<string, unknown>) }
        : {}
    const absolute = Object.fromEntries(
      Object.entries(entries).map(([key, value]) => [key, path.join(import.meta.dirname, value)]),
    )
    config.resolve = { ...resolve, alias: { ...alias, ...absolute } }
    return config
  }
}

const nextConfig: NextConfig = {
  // The Next.js dev overlay stays on. productionBrowserSourceMaps stays off.
  allowedDevOrigins: ['127.0.0.1'],
  output: 'standalone',
  outputFileTracingRoot: path.join(import.meta.dirname, '../..'),
  poweredByHeader: false,
  reactStrictMode: true,
  transpilePackages: ['@reactloom/api-client', '@reactloom/devtools'],
  turbopack: {
    rules: codeInspectorPlugin({
      bundler: 'turbopack',
      hotKeys: ['ctrlKey', 'shiftKey', 'altKey'],
      ...(clickToSource ? { editor: activateEditor(import.meta.dirname) } : { dev: false }),
    }),
    ...(aliases ? { resolveAlias: aliases } : {}),
  },
  webpack: aliases ? webpackWithAliases(aliases) : undefined,
  async headers() {
    return [{ source: '/:path*', headers: [...headersFor(process.env.NODE_ENV)] }]
  },
}

export default withBundleAnalyzer(nextConfig)
