module.exports = function babelConfig(api) {
  api.cache.using(() => {
    const bundlerDev = api.caller((caller) => caller?.isDev)
    return `${process.env.NODE_ENV ?? ''}:${process.env.EXPO_PUBLIC_DEVTOOLS ?? ''}:${String(bundlerDev)}`
  })
  const devtools =
    process.env.NODE_ENV !== 'production' && process.env.EXPO_PUBLIC_DEVTOOLS !== 'false'
  // Metro sets `isDev` false for `expo export` even when the parent process left NODE_ENV unset.
  const trackRenders = devtools && api.caller((caller) => caller?.isDev) !== false
  const plugins = []
  if (devtools) {
    plugins.push(require('react-native-dev-inspector/metro').inspectorBabelPlugin)
  }
  return {
    presets: [
      [
        'babel-preset-expo',
        trackRenders ? { jsxImportSource: '@welldone-software/why-did-you-render' } : {},
      ],
    ],
    plugins,
  }
}
