module.exports = function babelConfig(api) {
  api.cache.using(() => `${process.env.NODE_ENV ?? ''}:${process.env.EXPO_PUBLIC_DEVTOOLS ?? ''}`)
  const plugins = []
  if (process.env.NODE_ENV !== 'production' && process.env.EXPO_PUBLIC_DEVTOOLS !== 'false') {
    plugins.push(require('react-native-dev-inspector/metro').inspectorBabelPlugin)
  }
  return {
    presets: ['babel-preset-expo'],
    plugins,
  }
}
