import path from 'node:path'
import bundleAnalyzer from '@next/bundle-analyzer'
import { codeInspectorPlugin } from 'code-inspector-plugin'
import type { NextConfig } from 'next'
import { headersFor } from './src/server/security-headers'

const withBundleAnalyzer = bundleAnalyzer({ enabled: process.env.ANALYZE === 'true' })

// Unset means auto-detect. `.env.development` does not set an editor.
// Next.js open-in-editor reads REACT_EDITOR, then a running editor, then VISUAL, then EDITOR.
function inspectorEditor():
  | NonNullable<Parameters<typeof codeInspectorPlugin>[0]['editor']>
  | undefined {
  const value = process.env.CODE_EDITOR || process.env.LAUNCH_EDITOR || process.env.REACT_EDITOR
  if (!value) return undefined
  return value as NonNullable<Parameters<typeof codeInspectorPlugin>[0]['editor']>
}

const editor = inspectorEditor()
// Turbopack loader options must be plain data. A boolean `dev: false` turns the
// plugin off for production builds and Playwright. Functions and regexes are not serializable.
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
      ...(clickToSource ? {} : { dev: false }),
      ...(editor ? { editor } : {}),
    }),
  },
  async headers() {
    return [{ source: '/:path*', headers: [...headersFor(process.env.NODE_ENV)] }]
  },
}

export default withBundleAnalyzer(nextConfig)
