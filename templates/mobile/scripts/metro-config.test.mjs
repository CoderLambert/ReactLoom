import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import vm from 'node:vm'

const configFile = fileURLToPath(new URL('../metro.config.js', import.meta.url))

function readMetroConfig(projectRoot, defaultConfig) {
  const module = { exports: {} }
  const require = (name) => {
    if (name === 'node:fs') return fs
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
      return { activateLauncher: (root) => `launcher:${root}` }
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
  const actual = readMetroConfig(root, defaults)
  assert.deepEqual(Array.from(actual.watchFolders), [])
  assert.deepEqual(Array.from(actual.resolver.nodeModulesPaths), [path.join(root, 'node_modules')])
  assert.equal(actual.inspectorEditor, `launcher:${root}`)
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
  const actual = readMetroConfig(root, defaults)
  assert.deepEqual(Array.from(actual.watchFolders), Array.from(defaults.watchFolders))
  assert.deepEqual(
    Array.from(actual.resolver.nodeModulesPaths),
    Array.from(defaults.resolver.nodeModulesPaths),
  )
  assert.equal(actual.resolver.unstable_enableSymlinks, true)
  assert.equal(actual.cacheStores[0].root, path.join(root, '.metro-cache'))
})
