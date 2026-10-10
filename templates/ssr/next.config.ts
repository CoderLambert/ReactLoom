import path from 'node:path'
import bundleAnalyzer from '@next/bundle-analyzer'
import type { NextConfig } from 'next'
import { headersFor } from './src/server/security-headers'

const withBundleAnalyzer = bundleAnalyzer({ enabled: process.env.ANALYZE === 'true' })

const nextConfig: NextConfig = {
  allowedDevOrigins: ['127.0.0.1'],
  output: 'standalone',
  outputFileTracingRoot: path.join(import.meta.dirname, '../..'),
  poweredByHeader: false,
  reactStrictMode: true,
  transpilePackages: ['@reactloom/api-client'],
  async headers() {
    return [{ source: '/:path*', headers: [...headersFor(process.env.NODE_ENV)] }]
  },
}

export default withBundleAnalyzer(nextConfig)
