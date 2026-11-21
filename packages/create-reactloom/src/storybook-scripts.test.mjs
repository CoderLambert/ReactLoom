import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { assertStorybookScripts, usesPortableStorybookRunner } from './storybook-scripts.ts'

const legacy = {
  storybook: 'STORYBOOK=true storybook dev -p 6007 --no-open',
  'build-storybook': 'STORYBOOK=true storybook build',
}
const portable = {
  storybook: 'node scripts/run-project-tool.mjs storybook',
  'build-storybook': 'node scripts/run-project-tool.mjs build-storybook',
}
const runner = `
if (mode === 'storybook' || mode === 'build-storybook') {
  const manifestPath = createRequire(path.join(projectRoot, 'package.json')).resolve(
    'storybook/package.json',
  )
  const { bin } = JSON.parse(readFileSync(manifestPath, 'utf8'))
  const entry = typeof bin === 'string' ? bin : bin?.storybook
  return [path.resolve(path.dirname(manifestPath), entry),
    ...(mode === 'storybook' ? ['dev', '-p', '6007', '--no-open'] : ['build'])]
}
const child = spawn(process.execPath, [script, ...args], {
  ...(isStorybook ? { env: { ...process.env, STORYBOOK: 'true' } } : {}),
})
`

describe('CLI Storybook scaffold validation', () => {
  it('keeps the existing SPA and SSR shell commands valid', () => {
    assert.doesNotThrow(() => assertStorybookScripts(legacy))
    assert.equal(usesPortableStorybookRunner(legacy), false)
  })
  it('accepts the cross-platform SSR Node runner when its CLI and env are verified', () => {
    assert.equal(usesPortableStorybookRunner(portable), true)
    assert.doesNotThrow(() => assertStorybookScripts(portable, runner))
  })
  it('rejects mismatched scripts rather than treating any Node script as Storybook', () => {
    assert.throws(
      () =>
        assertStorybookScripts(
          { ...portable, storybook: 'node scripts/noop.mjs storybook' },
          runner,
        ),
      /must launch Storybook/,
    )
    assert.throws(
      () => assertStorybookScripts({ ...portable, 'build-storybook': 'echo noop' }, runner),
      /must launch Storybook/,
    )
  })
  it('rejects a missing runner even with matching package scripts', () => {
    assert.throws(() => assertStorybookScripts(portable), /is missing/)
  })
  it('rejects a runner without the build-time STORYBOOK flag', () => {
    assert.throws(
      () =>
        assertStorybookScripts(
          portable,
          runner.replace("STORYBOOK: 'true'", "STORYBOOK: 'false'"),
        ),
      /environment flag/,
    )
  })
  it('rejects a runner that does not execute the installed Storybook binary', () => {
    assert.throws(
      () =>
        assertStorybookScripts(
          portable,
          runner.replace('storybook/package.json', 'nonexistent/package.json'),
        ),
      /installed Storybook package/,
    )
    assert.throws(
      () =>
        assertStorybookScripts(
          portable,
          runner.replace('spawn(process.execPath', 'spawn(command'),
        ),
      /Node CLI invocation/,
    )
  })
  it('rejects a runner with no Storybook build subcommand', () => {
    assert.throws(
      () => assertStorybookScripts(portable, runner.replace(": ['build']", ": ['test']")),
      /build subcommand/,
    )
  })
})
