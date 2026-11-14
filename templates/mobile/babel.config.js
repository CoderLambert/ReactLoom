module.exports = function babelConfig(api) {
  api.cache.using(() => `${process.env.NODE_ENV ?? ''}:${process.env.EXPO_PUBLIC_DEVTOOLS ?? ''}`)
  const devtools =
    process.env.NODE_ENV !== 'production' && process.env.EXPO_PUBLIC_DEVTOOLS !== 'false'
  // Read the caller after the cache is configured. Calling it inside cache.using
  // makes Babel throw once Expo Router's entry is evaluated. Metro sets `isDev`
  // false for `expo export` even when the parent process left NODE_ENV unset.
  const trackRenders = devtools && api.caller((caller) => caller?.isDev) !== false
  const plugins = []
  // A production Metro caller must not instrument JSX for click-to-source,
  // even when the parent export process did not set NODE_ENV.
  if (trackRenders) {
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
