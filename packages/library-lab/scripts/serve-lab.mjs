/** Start the private app and its separately scoped execution origin together. */

import { fileURLToPath } from 'node:url'
import { createServer, preview } from 'vite'

const mode = process.argv[2]
if (!['dev', 'preview'].includes(mode))
  throw new Error('Usage: node scripts/serve-lab.mjs dev|preview')
const servers = []
async function close() {
  await Promise.allSettled(
    servers.map((server) =>
      mode === 'dev' ? server.close() : new Promise((resolve) => server.httpServer.close(resolve)),
    ),
  )
}
try {
  for (const relative of [
    '../runners/msw/vite.config.mjs',
    '../runners/gantt/vite.config.ts',
    '../vite.config.ts',
  ]) {
    const options = {
      configFile: fileURLToPath(new URL(relative, import.meta.url)),
    }
    const server = mode === 'dev' ? await createServer(options) : await preview(options)
    servers.push(server)
    if (mode === 'dev') await server.listen()
    server.printUrls()
  }
  for (const signal of ['SIGINT', 'SIGTERM'])
    process.once(signal, () => {
      void close().then(() => process.exit(0))
    })
} catch (error) {
  await close()
  throw error
}
