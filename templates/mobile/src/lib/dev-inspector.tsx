import type { ReactNode } from 'react'

declare const __DEV__: boolean
declare function require(moduleName: string): typeof import('react-native-dev-inspector')

let inspector: typeof import('react-native-dev-inspector') | null = null
if (__DEV__ && process.env.EXPO_PUBLIC_DEVTOOLS !== 'false') {
  inspector = require('react-native-dev-inspector')
}

export function DevInspector({ children }: { children: ReactNode }) {
  if (!inspector) return children
  const { Inspector, InspectorDevMenu } = inspector
  return (
    <Inspector>
      {children}
      <InspectorDevMenu position="bottom-right" />
    </Inspector>
  )
}
