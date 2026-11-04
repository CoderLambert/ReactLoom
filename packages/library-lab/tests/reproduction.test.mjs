import assert from 'node:assert/strict'
import test from 'node:test'
import { reproductionCommand } from '../src/lib/reproduction.mjs'

const entry = { directory: 'F12-vitest', packages: [{ name: 'vitest', version: '5.0.5' }] }
const base = {
  executionKind: 'node-ci',
  level: 'basic',
  entryPoint: 'examples/basic.test.ts',
  sourceFiles: ['examples/basic.test.ts'],
}
test('Vitest recipes use Vitest not node', () =>
  assert.equal(
    reproductionCommand(entry, base),
    'pnpm exec vitest run entries/F12-vitest/examples/basic.test.ts',
  ))
test('Node recipes distinguish executable and test files', () => {
  const e = { directory: 'F11-msw', packages: [{ name: 'msw', version: '3.0.3' }] }
  assert.equal(
    reproductionCommand(e, {
      ...base,
      entryPoint: 'examples/run.mjs',
      sourceFiles: ['examples/run.mjs'],
      level: 'advanced',
    }),
    'node entries/F11-msw/examples/run.mjs advanced',
  )
  assert.equal(
    reproductionCommand(e, {
      ...base,
      entryPoint: 'tests/node-scenarios.test.mjs',
      sourceFiles: ['tests/node-scenarios.test.mjs'],
    }),
    'node --test entries/F11-msw/tests/node-scenarios.test.mjs',
  )
})
test('rejects unsafe paths and unsupported modes', () => {
  for (const bad of ['../test.mjs', 'foo;rm.mjs', 'foo\\bar.mjs', '/etc/test.mjs'])
    assert.equal(reproductionCommand(entry, { ...base, entryPoint: bad, sourceFiles: [bad] }), null)
  assert.equal(reproductionCommand(entry, { ...base, sourceFiles: [] }), null)
  assert.equal(reproductionCommand(entry, { ...base, executionKind: 'react' }), null)
  assert.equal(
    reproductionCommand({ directory: 'F12-vitest;echo BAD', packages: entry.packages }, base),
    null,
  )
  assert.equal(reproductionCommand({ directory: 'F12-vitest', packages: [] }, base), null)
})

test('Playwright workshops use their checked-in standalone config, not the app test runner', () => {
  const e = {
    directory: 'F13-playwright',
    packages: [{ name: '@playwright/test', version: '1.64.0' }],
  }
  const demo = {
    executionKind: 'node-ci',
    level: 'business',
    entryPoint: 'examples/business.spec.ts',
    sourceFiles: ['examples/business.spec.ts', 'examples/playwright.config.ts'],
  }
  assert.equal(
    reproductionCommand(e, demo),
    'pnpm exec playwright test --config=entries/F13-playwright/examples/playwright.config.ts entries/F13-playwright/examples/business.spec.ts',
  )
  assert.equal(
    reproductionCommand(e, { ...demo, sourceFiles: ['examples/business.spec.ts'] }),
    null,
    'missing config cannot silently fall back to app tests',
  )
})

test('Storybook recipe uses an actual checked-in config and refuses missing prerequisites', () => {
  const e = {
    directory: 'F14-storybook',
    packages: [{ name: 'storybook' }, { name: '@storybook/react-vite' }],
  }
  const demo = {
    ...base,
    entryPoint: 'examples/stories/StatusCard.stories.tsx',
    sourceFiles: ['examples/stories/StatusCard.stories.tsx', 'examples/.storybook/main.ts'],
  }
  assert.equal(
    reproductionCommand(e, demo),
    'pnpm exec storybook dev --no-open -p 6029 --config-dir entries/F14-storybook/examples/.storybook',
  )
  assert.equal(reproductionCommand(e, { ...demo, sourceFiles: [demo.entryPoint] }), null)
  assert.equal(reproductionCommand({ ...e, packages: [{ name: 'storybook' }] }, demo), null)
})
test('Knip recipes are restricted to the local sample fixture without destructive flags', () => {
  const e = { directory: 'F15-knip', packages: [{ name: 'knip' }] }
  for (const level of ['basic', 'business', 'advanced']) {
    const file = `examples/workspace/knip.${level}.json`
    const demo = {
      ...base,
      entryPoint: file,
      level,
      sourceFiles: [file, 'examples/workspace/package.json'],
    }
    const cmd = reproductionCommand(e, demo)
    assert.equal(
      cmd,
      `pnpm exec knip --directory entries/F15-knip/examples/workspace --config knip.${level}.json${level === 'advanced' ? ' --production' : ''}`,
    )
    assert.equal(reproductionCommand(e, { ...demo, sourceFiles: [file] }), null)
    assert.equal(cmd.includes('--fix'), false)
  }
  assert.equal(
    reproductionCommand(e, {
      ...base,
      entryPoint: 'examples/workspace/knip.evil.json',
      sourceFiles: ['examples/workspace/knip.evil.json', 'examples/workspace/package.json'],
    }),
    null,
  )
})

test('dependency-cruiser uses the checked-in Node harness rather than trying to run a TypeScript fixture', () => {
  const entry = { directory: 'F16-dependency-cruiser', packages: [{ name: 'dependency-cruiser' }] }
  const fixtures = {
    basic: 'examples/workspace/basic/src/main.ts',
    business: 'examples/workspace/business/src/domain/summary.ts',
    advanced: 'examples/workspace/advanced/src/first.ts',
  }
  for (const [level, entryPoint] of Object.entries(fixtures)) {
    const demo = {
      executionKind: 'node-ci',
      level,
      entryPoint,
      sourceFiles: [entryPoint, 'examples/run.mjs', 'examples/workspace/config.cjs'],
    }
    assert.equal(
      reproductionCommand(entry, demo),
      `node entries/F16-dependency-cruiser/examples/run.mjs ${level}`,
    )
    assert.equal(reproductionCommand(entry, { ...demo, sourceFiles: [entryPoint] }), null)
  }
})
test('visualizer executes standalone Vite config only when its declared package and sources exist', () => {
  const entry = {
    directory: 'F18-rollup-plugin-visualizer',
    packages: [{ name: 'rollup-plugin-visualizer' }, { name: 'vite' }],
  }
  const demo = {
    executionKind: 'node-ci',
    level: 'advanced',
    entryPoint: 'examples/vite.config.ts',
    sourceFiles: ['examples/vite.config.ts', 'examples/fixture/main.ts'],
  }
  assert.equal(
    reproductionCommand(entry, demo),
    'pnpm exec vite build --config entries/F18-rollup-plugin-visualizer/examples/vite.config.ts --mode advanced',
  )
  assert.equal(reproductionCommand({ ...entry, packages: [{ name: 'vite' }] }, demo), null)
  assert.equal(reproductionCommand({ ...entry, directory: '../../evil' }, demo), null)
})

test('copyable commands reject non-enumerated scenario levels and shell-like strings', () => {
  const entry = {
    directory: 'F18-rollup-plugin-visualizer',
    packages: [{ name: 'rollup-plugin-visualizer' }, { name: 'vite' }],
  }
  const demo = {
    executionKind: 'node-ci',
    entryPoint: 'examples/vite.config.ts',
    sourceFiles: ['examples/vite.config.ts'],
  }
  for (const level of ['advanced;echo BAD', 'basic && echo BAD', 'custom', null])
    assert.equal(reproductionCommand(entry, { ...demo, level }), null)
})
