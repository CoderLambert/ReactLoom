import { spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import { cp, mkdir, mkdtemp, readFile, rename, rm, symlink } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { preview } from 'vite'
import { prepareFfmpegCore } from '../../../scripts/prepare-ffmpeg-core.mjs'

if (process.env.LIBRARY_LAB_FFMPEG_CORE_LICENSE_REVIEWED !== 'true') {
  throw new Error(
    'The maintainer must confirm the exact core assets for local testing before staging',
  )
}
const lab = fileURLToPath(new URL('../../../', import.meta.url))
const [output, ...filters] = process.argv.slice(2)
if (!output) throw new Error('An evidence directory is required')
const outputDir = path.resolve(output)
const root = await mkdtemp(path.join(tmpdir(), 'reactloom-e19-local-'))
let server
let child
const abort = new AbortController()
const stop = () => abort.abort()
process.once('SIGINT', stop)
process.once('SIGTERM', stop)
try {
  await cp(path.join(lab, 'dist'), path.join(root, 'dist'), {
    recursive: true,
    filter: (source) => path.basename(source) !== 'ffmpeg-core',
  })
  await symlink(path.join(lab, 'node_modules'), path.join(root, 'node_modules'), 'dir')
  const staged = await prepareFfmpegCore(root)
  if (staged.status !== 'STAGED') throw new Error(staged.reason)
  const core = path.join(root, 'public', 'ffmpeg-core')
  const assetManifest = JSON.parse(
    await readFile(path.join(core, '.library-lab-generated.json'), 'utf8'),
  )
  const approved = new Map([
    ['ffmpeg-core.js', '67a48f11645f85439f3fde4f2119042c16b374b910206b7a7a24f342e28dcae3'],
    ['ffmpeg-core.wasm', '9f57947a5bd530d8f00c5b3f2cb2a3492faa7e5d823315342d6a8656d0a6b7b7'],
  ])
  if (
    assetManifest.assets.length !== approved.size ||
    assetManifest.assets.some((asset) => approved.get(asset.filename) !== asset.sha256)
  ) {
    throw new Error('Staged core does not match the two confirmed local assets')
  }
  await rename(core, path.join(root, 'dist', 'ffmpeg-core'))
  await mkdir(outputDir, { recursive: true })
  const manifestBytes = await readFile(path.join(root, 'dist', '.vite', 'manifest.json'))
  const catalog = JSON.parse(await readFile(path.join(root, 'dist', 'catalog.json'), 'utf8'))
  console.log(
    JSON.stringify({
      stage: staged,
      assetManifest,
      builtManifestSha256: createHash('sha256').update(manifestBytes).digest('hex'),
      e19SourceFingerprint: catalog.find((entry) => entry.entryId === 'E19')?.sourceFingerprint,
    }),
  )
  if (abort.signal.aborted) throw new Error('Local validation was interrupted')
  server = await preview({
    root,
    configFile: false,
    publicDir: false,
    build: { outDir: 'dist' },
    preview: { host: '127.0.0.1', port: 0, strictPort: true },
  })
  const address = server.httpServer.address()
  if (!address || typeof address === 'string' || address.address !== '127.0.0.1') {
    throw new Error('Expected an isolated loopback listener')
  }
  const config = fileURLToPath(new URL('./playwright.local.config.ts', import.meta.url))
  const argv = ['exec', 'playwright', 'test', '--config', config, ...filters]
  const localURL = `http://127.0.0.1:${address.port}/`
  console.log(JSON.stringify({ cwd: lab, localURL, argv: ['pnpm', ...argv] }))
  child = spawn('pnpm', argv, {
    cwd: lab,
    env: {
      ...process.env,
      LIBRARY_LAB_FFMPEG_CORE_LICENSE_REVIEWED: '',
      LAB_E19_LOCAL_URL: localURL,
      LAB_E19_OUTPUT_DIR: outputDir,
    },
    stdio: 'inherit',
    signal: abort.signal,
  })
  const exitCode = await new Promise((resolve, reject) => {
    child.once('error', reject)
    child.once('close', (code) => resolve(code ?? 1))
  })
  process.exitCode = exitCode
} finally {
  if (server) await new Promise((resolve) => server.httpServer.close(resolve))
  await rm(root, { recursive: true, force: true })
  console.log('Isolated core and preview directory removed.')
  process.removeListener('SIGINT', stop)
  process.removeListener('SIGTERM', stop)
}
