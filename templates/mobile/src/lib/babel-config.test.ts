import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import { describe, expect, it } from 'vitest'

type BabelApi = {
  cache: { using: (callback: () => string) => void }
  caller: <T>(callback: (caller: { isDev: boolean }) => T) => T
}

type BabelResult = {
  presets: [string, Record<string, string>][]
  plugins: unknown[]
}

function loadConfig(isDev: boolean, env: Record<string, string> = {}) {
  const source = readFileSync(new URL('../../babel.config.js', import.meta.url), 'utf8')
  const sandboxModule: { exports: unknown } = { exports: null }
  const inspectorPlugin = () => undefined
  let inspectorImports = 0

  runInNewContext(source, {
    module: sandboxModule,
    process: { env },
    require: (id: string) => {
      if (id !== 'react-native-dev-inspector/metro') throw new Error(`Unexpected module: ${id}`)
      inspectorImports += 1
      return { inspectorBabelPlugin: inspectorPlugin }
    },
  })

  const configure = sandboxModule.exports as (api: BabelApi) => BabelResult
  const config = configure({
    cache: { using: (callback) => void callback() },
    caller: (callback) => callback({ isDev }),
  })
  return { config, inspectorImports, inspectorPlugin }
}

describe('Expo Babel development instrumentation', () => {
  it('does not load inspector or JSX instrumentation for an export caller with no NODE_ENV', () => {
    const { config, inspectorImports } = loadConfig(false)
    expect(inspectorImports).toBe(0)
    expect(config.plugins).toHaveLength(0)
    expect(config.presets[0]?.[1]).toEqual({})
  })

  it('loads inspector and render tracking in a development Metro caller', () => {
    const { config, inspectorImports, inspectorPlugin } = loadConfig(true, {
      NODE_ENV: 'development',
    })
    expect(inspectorImports).toBe(1)
    expect(config.plugins).toEqual([inspectorPlugin])
    expect(config.presets[0]?.[1]).toEqual({
      jsxImportSource: '@welldone-software/why-did-you-render',
    })
  })

  it('does not instrument an export even when NODE_ENV is development', () => {
    const { config, inspectorImports } = loadConfig(false, { NODE_ENV: 'development' })
    expect(inspectorImports).toBe(0)
    expect(config.plugins).toHaveLength(0)
    expect(config.presets[0]?.[1]).toEqual({})
  })

  it('keeps all instrumentation disabled for production and explicit opt-out', () => {
    for (const env of [{ NODE_ENV: 'production' }, { EXPO_PUBLIC_DEVTOOLS: 'false' }]) {
      const { config, inspectorImports } = loadConfig(true, env)
      expect(inspectorImports).toBe(0)
      expect(config.plugins).toHaveLength(0)
      expect(config.presets[0]?.[1]).toEqual({})
    }
  })
})
