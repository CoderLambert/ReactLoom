import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import vm from 'node:vm'

const configFile = fileURLToPath(new URL('../metro.config.js', import.meta.url))

function readMetroConfig(projectRoot, defaultConfig, existingPaths = []) {
  const files = new Set(existingPaths)
  const module = { exports: {} }
  const require = (name) => {
    if (name === 'node:fs') return { existsSync: (candidate) => files.has(candidate) }
    if (name === 'node:path') return path
    if (name === 'expo/metro-config') {
      return {
        getDefaultConfig: (root) => {
          assert.equal(root, projectRoot)
          return defaultConfig
        },
      }
    }
    if (name === 'metro-cache') {
      return {
        FileStore: class {
          constructor(options) {
            this.root = options.root
          }
        },
      }
    }
    if (name === 'react-native-dev-inspector/metro') {
      return {
        withInspector: (config, options) => ({ ...config, inspectorEditor: options.editor }),
      }
    }
    if (path.isAbsolute(name) && name.endsWith('open-in-editor.mjs')) {
      return { activateLauncher: (root) => `launcher:${root}:${name}` }
    }
    throw new Error(`Unexpected require: ${name}`)
  }
  const script = fs.readFileSync(configFile, 'utf8')
  const factory = vm.runInNewContext(
    `(function (require, module, __dirname) {\n${script}\n})`,
    {},
    { filename: configFile },
  )
  factory(require, module, projectRoot)
  return module.exports
}

test('detached mobile app does not watch or resolve from unrelated grandparent', () => {
  const root = path.join('/tmp', 'generated', 'my-mobile')
  const defaults = {
    watchFolders: [],
    resolver: { nodeModulesPaths: [path.join(root, 'node_modules')] },
  }
  const localLauncher = path.join(root, 'scripts', 'open-in-editor.mjs')
  const actual = readMetroConfig(root, defaults, [localLauncher])
  assert.deepEqual(Array.from(actual.watchFolders), [])
  assert.deepEqual(Array.from(actual.resolver.nodeModulesPaths), [path.join(root, 'node_modules')])
  assert.equal(actual.inspectorEditor, `launcher:${root}:${localLauncher}`)
})

test('in-repo template retains Expo auto-discovered workspace settings', () => {
  const workspace = path.join('/tmp', 'reactloom-repo')
  const root = path.join(workspace, 'templates', 'mobile')
  const defaults = {
    watchFolders: [workspace, path.join(workspace, 'custom')],
    resolver: {
      nodeModulesPaths: [path.join(workspace, 'node_modules'), path.join(root, 'node_modules')],
    },
  }
  const workspaceLauncher = path.join(workspace, 'scripts', 'open-in-editor.mjs')
  const files = [
    path.join(workspace, 'pnpm-workspace.yaml'),
    path.join(workspace, 'packages', 'create-reactloom', 'package.json'),
    workspaceLauncher,
  ]
  const actual = readMetroConfig(root, defaults, files)
  assert.deepEqual(Array.from(actual.watchFolders), Array.from(defaults.watchFolders))
  assert.deepEqual(
    Array.from(actual.resolver.nodeModulesPaths),
    Array.from(defaults.resolver.nodeModulesPaths),
  )
  assert.equal(actual.resolver.unstable_enableSymlinks, true)
  assert.equal(actual.cacheStores[0].root, path.join(root, '.metro-cache'))
  assert.equal(actual.inspectorEditor, `launcher:${root}:${workspaceLauncher}`)
})

test('detached app does not load a grandparent launcher when local copy is missing', () => {
  const root = path.join('/tmp', 'generated', 'my-mobile')
  const outside = path.resolve(root, '../..', 'scripts', 'open-in-editor.mjs')
  const defaults = { resolver: { nodeModulesPaths: [] } }
  assert.throws(
    () => readMetroConfig(root, defaults, [outside]),
    /Missing local editor launcher/,
  )
})

test('lookalike templates/mobile cannot use parent script without monorepo markers', () => {
  const workspace = path.join('/tmp', 'unrelated')
  const root = path.join(workspace, 'templates', 'mobile')
  const outside = path.join(workspace, 'scripts', 'open-in-editor.mjs')
  const defaults = { resolver: { nodeModulesPaths: [] } }
  assert.throws(
    () => readMetroConfig(root, defaults, [outside]),
    /Missing local editor launcher/,
  )
})
