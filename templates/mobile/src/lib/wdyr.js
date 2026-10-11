const React = require('react')

if (__DEV__ && process.env.EXPO_PUBLIC_DEVTOOLS !== 'false') {
  const whyDidYouRender = require('@welldone-software/why-did-you-render')
  whyDidYouRender(React, { trackAllPureComponents: true })
}
