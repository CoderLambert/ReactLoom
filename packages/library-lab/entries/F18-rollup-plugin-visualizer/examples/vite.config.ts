import { createHash } from 'node:crypto'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { gzipSync } from 'node:zlib'
import { visualizer } from 'rollup-plugin-visualizer'
import { defineConfig, type Plugin } from 'vite'

const examples = fileURLToPath(new URL('.', import.meta.url))
const fixture = path.join(examples, 'fixture')

// This inventory is application-owned measurement, not a Visualizer API.
function inventory(): Plugin {
  return {
    name: 'f18-output-inventory',
    enforce: 'post',
    generateBundle: {
      order: 'post',
      handler(_options, bundle) {
        const chunks = Object.values(bundle)
          .filter((output) => output.type === 'chunk')
          .map((chunk) => ({
            file: chunk.fileName,
            isEntry: chunk.isEntry,
            imports: chunk.imports,
            dynamicImports: chunk.dynamicImports,
            bytes: Buffer.byteLength(chunk.code),
            gzipBytes: gzipSync(chunk.code, { level: 9 }).byteLength,
            sha256: createHash('sha256').update(chunk.code).digest('hex'),
            moduleIds: Object.keys(chunk.modules).map((id) =>
              id.startsWith(fixture) ? id.slice(fixture.length).replaceAll('\\', '/') : id,
            ),
          }))
        this.emitFile({
          type: 'asset',
          fileName: 'bundle-inventory.json',
          source: JSON.stringify({ schemaVersion: 1, chunks }, null, 2),
        })
      },
    },
  }
}

function lastVisualizer(options: Parameters<typeof visualizer>[0]): Plugin {
  const plugin = visualizer(options)
  return {
    ...plugin,
    enforce: 'post',
    generateBundle: { order: 'post', handler: plugin.generateBundle },
  }
}

export default defineConfig(({ mode }) => {
  // Old direct --mode recipes remain valid; the scenario runner builds both variants.
  const variants: Record<string, 'static' | 'lazy'> = {
    basic: 'static',
    business: 'lazy',
    advanced: 'lazy',
    static: 'static',
    lazy: 'lazy',
  }
  const variant = variants[mode]
  if (!variant) throw new Error('Choose --mode static|lazy (or basic|business|advanced)')
  const reports = path.join(examples, 'reports', variant)
  return {
    root: fixture,
    base: './',
    plugins: [
      {
        name: 'f18-select-entry',
        transformIndexHtml: {
          order: 'pre',
          handler(html) {
            return variant === 'lazy' ? html.replace('/main.ts', '/main-lazy.ts') : html
          },
        },
      },
      inventory(),
      // Same dataset, three views. Report formats are not separate experiments.
      ...(['treemap', 'network', 'raw-data'] as const).map((template) =>
        lastVisualizer({
          filename: path.join(
            reports,
            template === 'raw-data' ? 'raw-data.json' : `${template}.html`,
          ),
          template,
          projectRoot: fixture,
          sourcemap: true,
          open: false,
        }),
      ),
    ],
    build: {
      target: 'es2022',
      outDir: path.join(reports, 'dist'),
      emptyOutDir: true,
      sourcemap: 'hidden',
      minify: 'oxc',
    },
  }
})
