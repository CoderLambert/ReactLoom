const path = require('node:path')
const { getDefaultConfig } = require('expo/metro-config')
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

// No editor option: launch-editor detects a running VS Code or Cursor.
module.exports = withInspector(config)
