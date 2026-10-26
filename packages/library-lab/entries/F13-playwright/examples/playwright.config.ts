import {defineConfig} from '@playwright/test'

// Independent CLI workshop. Does not start or modify the Library Lab app.
export default defineConfig({
  testDir: '.',
  testMatch: '**/*.spec.ts',
  fullyParallel: false,
  retries: 0,
  workers: 1,
  use: {browserName: 'chromium', headless: true, trace: 'retain-on-failure'},
  reporter: [['list']],
  outputDir: './.playwright-artifacts',
})
