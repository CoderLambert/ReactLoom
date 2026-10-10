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

// The client component imports react-scan. Production builds, and Playwright
// (NEXT_PUBLIC_DEVTOOLS=false), resolve that import to an empty module.
const reactScanStub =
  process.env.NODE_ENV === 'production' || process.env.NEXT_PUBLIC_DEVTOOLS === 'false'
    ? './src/lib/react-scan-stub.ts'
    : undefined

const nextConfig: NextConfig = {
  allowedDevOrigins: ['127.0.0.1'],
  output: 'standalone',
  outputFileTracingRoot: path.join(import.meta.dirname, '../..'),
  poweredByHeader: false,
  reactStrictMode: true,
  transpilePackages: ['@reactloom/api-client'],
  turbopack: {
    rules: codeInspectorPlugin({
      bundler: 'turbopack',
      ...(clickToSource ? { editor: activateEditor(import.meta.dirname) } : { dev: false }),
    }),
    ...(reactScanStub ? { resolveAlias: { 'react-scan': reactScanStub } } : {}),
  },
  webpack: reactScanStub
    ? (config: { resolve?: { alias?: unknown } }) => {
        const resolve = config.resolve ?? {}
        const current = resolve.alias
        const alias =
          current && typeof current === 'object' && !Array.isArray(current)
            ? { ...(current as Record<string, unknown>) }
            : {}
        config.resolve = {
          ...resolve,
          alias: {
            ...alias,
            'react-scan': path.join(import.meta.dirname, 'src/lib/react-scan-stub.ts'),
          },
        }
        return config
      }
    : undefined,
  async headers() {
    return [{ source: '/:path*', headers: [...headersFor(process.env.NODE_ENV)] }]
  },
}

export default withBundleAnalyzer(nextConfig)
