import { defineConfig } from 'orval'

// Orval resolves input and output paths relative to this config file.
// Run with: pnpm --filter @reactloom/library-lab exec orval --config entries/F10-orval/examples/orval.config.ts --project basic
const input = { target: './openapi/news.json' }
const outputRoot = './generated'

export default defineConfig({
  basic: {
    input,
    output: {
      target: outputRoot + '/basic.ts',
      schemas: outputRoot + '/basic-models',
      client: 'fetch',
      mode: 'single',
      baseUrl: 'http://127.0.0.1:4319',
    },
  },
  business: {
    input,
    output: {
      target: outputRoot + '/business.ts',
      schemas: outputRoot + '/business-models',
      client: 'react-query',
      httpClient: 'fetch',
      mode: 'single',
      baseUrl: 'http://127.0.0.1:4319',
    },
  },
  advanced: {
    input,
    output: {
      target: outputRoot + '/advanced/client.ts',
      schemas: outputRoot + '/advanced-models',
      client: 'fetch',
      mode: 'tags-split',
      baseUrl: 'http://127.0.0.1:4319',
    },
  },
})
