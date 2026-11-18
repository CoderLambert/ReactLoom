import { defineConfig } from '@playwright/test'

const baseURL = process.env.LAB_E19_LOCAL_URL
if (!baseURL || !/^http:\/\/127\.0\.0\.1:\d+\/$/u.test(baseURL)) {
  throw new Error('Start the E19 local runner to provide the isolated loopback URL')
}

export default defineConfig({
  testDir: '.',
  testMatch: 'browser-local.spec.ts',
  timeout: 45_000,
  retries: 0,
  workers: 1,
  outputDir: process.env.LAB_E19_OUTPUT_DIR,
  reporter: 'list',
  use: { baseURL, trace: 'off', acceptDownloads: true },
})
