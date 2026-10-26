import { defineConfig } from 'vite';
import { visualizer } from 'rollup-plugin-visualizer';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

// Runs independent of the main Library Lab production entry and dependency graph.
const examples = fileURLToPath(new URL('.', import.meta.url));
const fixture = path.join(examples, 'fixture');
const templates = {
  basic: { template: 'treemap', ext: '.html' },
  business: { template: 'markdown', ext: '.md' },
  advanced: { template: 'raw-data', ext: '.json' },
} as const;

export default defineConfig(({ mode }) => {
  if (!(mode in templates)) throw new Error('Choose --mode basic|business|advanced');
  const selected = templates[mode as keyof typeof templates];
  return {
    root: fixture,
    plugins: [visualizer({
      filename: path.join(examples, 'reports', mode + selected.ext),
      template: selected.template,
      gzipSize: true,
      open: false,
    })],
    build: {
      target: 'es2022',
      outDir: path.join(examples, 'reports', 'dist-' + mode),
      emptyOutDir: true,
      sourcemap: false,
      minify: 'esbuild',
    },
  };
});
