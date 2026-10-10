import fs from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import bundleAnalyzer from '@next/bundle-analyzer'
import { codeInspectorPlugin } from 'code-inspector-plugin'
import type { NextConfig } from 'next'
import { headersFor } from './src/server/security-headers'

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
  },
  async headers() {
    return [{ source: '/:path*', headers: [...headersFor(process.env.NODE_ENV)] }]
  },
}

export default withBundleAnalyzer(nextConfig)
