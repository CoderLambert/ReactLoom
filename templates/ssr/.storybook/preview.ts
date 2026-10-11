import type { Preview } from '@storybook/nextjs'
import { setupWorker } from 'msw/browser'
import { mswLoader } from 'msw-storybook-addon/csf3'
import { handlers } from '../src/mocks/handlers'
import '../src/styles/globals.css'

const preview: Preview = {
  loaders: [
    mswLoader(async () => {
      const worker = setupWorker()
      await worker.start({ onUnhandledFrame: 'bypass', quiet: true })
      return worker
    }),
  ],
  parameters: {
    msw: { handlers },
    a11y: {
      test: 'todo',
    },
  },
}

export default preview
