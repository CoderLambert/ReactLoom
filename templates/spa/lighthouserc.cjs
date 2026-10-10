const attached = process.env.LIGHTHOUSE_ATTACH === '1'
const ci = process.env.CI === 'true'

module.exports = {
  ci: {
    collect: {
      url: [process.env.LIGHTHOUSE_URL || 'http://127.0.0.1:4317/'],
      numberOfRuns: 1,
      ...(attached
        ? {}
        : {
            startServerCommand: 'pnpm exec vite preview --host 127.0.0.1 --port 4317',
            startServerReadyPattern: 'Local:',
            startServerReadyTimeout: 120000,
          }),
      settings: {
        preset: 'desktop',
        chromeFlags: '--no-sandbox --headless=new',
        ...(process.env.CHROME_PATH ? { chromePath: process.env.CHROME_PATH } : {}),
      },
    },
    assert: {
      assertions: {
        'categories:performance': ['warn', { minScore: 0.7 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['warn', { minScore: 0.9 }],
        'categories:seo': ['warn', { minScore: 0.8 }],
        'resource-summary:script:size': ['error', { maxNumericValue: 1500000 }],
      },
    },
    upload: {
      target: ci ? 'temporary-public-storage' : 'filesystem',
      outputDir: '.lighthouseci',
    },
  },
}
