const fs = require('node:fs')
const path = require('node:path')
const { getDefaultConfig } = require('expo/metro-config')
const { FileStore } = require('metro-cache')
const { withInspector } = require('react-native-dev-inspector/metro')

const projectRoot = __dirname
const workspaceRoot = path.resolve(projectRoot, '../..')
const config = getDefaultConfig(projectRoot)

config.watchFolders = [workspaceRoot]
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
]
config.resolver.unstable_enableSymlinks = true
config.cacheStores = [new FileStore({ root: path.join(projectRoot, '.metro-cache') })]

// scripts/code is named like VS Code so the inspector passes file:line.
// open-in-editor.mjs then opens Neovim, Cursor, or VS Code.
const beside = path.join(projectRoot, 'scripts', 'open-in-editor.mjs')
const modulePath = fs.existsSync(beside)
  ? beside
  : path.join(projectRoot, '..', '..', 'scripts', 'open-in-editor.mjs')
const { activateLauncher } = require(modulePath)
const launcher = activateLauncher(projectRoot)

module.exports = withInspector(config, { editor: launcher })
