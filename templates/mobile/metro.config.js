const fs = require('node:fs')
const path = require('node:path')
const { getDefaultConfig } = require('expo/metro-config')
const { FileStore } = require('metro-cache')
const { withInspector } = require('react-native-dev-inspector/metro')

const projectRoot = __dirname
const config = getDefaultConfig(projectRoot)

// SDK 57's getDefaultConfig resolves pnpm monorepos automatically.
// Manual ../.. overrides escape a detached scaffold and search unrelated parents.
config.resolver.unstable_enableSymlinks = true
config.cacheStores = [new FileStore({ root: path.join(projectRoot, '.metro-cache') })]

// scripts/code is named like VS Code so the inspector passes file:line.
// open-in-editor.mjs then opens VS Code by default.
const beside = path.join(projectRoot, 'scripts', 'open-in-editor.mjs')
const modulePath = fs.existsSync(beside)
  ? beside
  : path.join(projectRoot, '..', '..', 'scripts', 'open-in-editor.mjs')
const { activateLauncher } = require(modulePath)
const launcher = activateLauncher(projectRoot)

module.exports = withInspector(config, { editor: launcher })
