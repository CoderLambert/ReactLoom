import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'

const script = fileURLToPath(new URL('./print-playwright-chrome.mjs', import.meta.url))

function withFixture(run) {
  const root = mkdtempSync(join(tmpdir(), 'reactloom-playwright-'))
  try {
    mkdirSync(join(root, 'scripts'))
    copyFileSync(script, join(root, 'scripts', 'print-playwright-chrome.mjs'))
    return run(root)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
}

function installFakePlaywright(projectRoot, executable) {
  const moduleRoot = join(projectRoot, 'node_modules', '@playwright', 'test')
  mkdirSync(moduleRoot, { recursive: true })
  writeFileSync(join(projectRoot, 'package.json'), '{}\n')
  writeFileSync(join(moduleRoot, 'package.json'), '{"main":"index.cjs"}\n')
  writeFileSync(
    join(moduleRoot, 'index.cjs'),
    'exports.chromium = { executablePath: () => ' + JSON.stringify(executable) + ' }\n',
  )
}

function invoke(root, ...args) {
  return spawnSync(
    process.execPath,
    [join(root, 'scripts', 'print-playwright-chrome.mjs'), ...args],
    { encoding: 'utf8' },
  )
}

test('standalone resolves the Playwright-owned browser, not the first cache entry', () => {
  withFixture((root) => {
    const stale = join(root, 'stale', 'chrome-linux', 'chrome')
    const selected = join(root, 'current', 'chrome-linux64', 'chrome')
    for (const executable of [stale, selected]) {
      mkdirSync(dirname(executable), { recursive: true })
      writeFileSync(executable, '')
    }
    installFakePlaywright(root, selected)
    const result = invoke(root)
    assert.equal(result.status, 0, result.stderr)
    assert.equal(result.stdout, selected)
    assert.ok(existsSync(stale))
  })
})

test('workspace SPA and SSR resolve their own installed Playwright versions', () => {
  withFixture((root) => {
    for (const template of ['spa', 'ssr']) {
      const executable = join(root, template + '-chromium', 'chrome')
      mkdirSync(dirname(executable), { recursive: true })
      writeFileSync(executable, '')
      const templateRoot = join(root, 'templates', template)
      mkdirSync(templateRoot, { recursive: true })
      installFakePlaywright(templateRoot, executable)
      const result = invoke(root, template)
      assert.equal(result.status, 0, result.stderr)
      assert.equal(result.stdout, executable)
    }
  })
})

test('missing Playwright browser fails instead of silently selecting a stale cache binary', () => {
  withFixture((root) => {
    const selected = join(root, 'missing', 'chrome')
    installFakePlaywright(root, selected)
    const result = invoke(root)
    assert.equal(result.status, 1)
    assert.match(result.stderr, /Playwright Chromium is not installed/)
    assert.equal(result.stdout, '')
  })
})

test('missing Playwright package fails with actionable diagnostics', () => {
  withFixture((root) => {
    writeFileSync(join(root, 'package.json'), '{}\n')
    const result = invoke(root)
    assert.equal(result.status, 1)
    assert.match(result.stderr, /Cannot resolve Playwright Chromium/)
  })
})

test('unexpected template selector fails without resolving arbitrary directories', () => {
  withFixture((root) => {
    const result = invoke(root, '../other')
    assert.equal(result.status, 1)
    assert.match(result.stderr, /Expected a template name/)
  })
})

test(
  'Lighthouse CI fails the step on Chromium resolver errors without exporting an empty path',
  { skip: process.platform === 'win32' },
  () => {
    const workflow = readFileSync(
      fileURLToPath(new URL('../.github/workflows/ci.yml', import.meta.url)),
      'utf8',
    )
    const step = workflow.match(
      /      - name: Point Lighthouse at Playwright Chromium\n        run: \|\n((?: {10}.*\n)+)/,
    )?.[1]
    assert.ok(step, 'the Lighthouse Chromium step must be a multiline shell command')
    const command = step.replace(/^ {10}/gm, '').trim().replaceAll('${{ matrix.name }}', 'spa')
    const invocation = 'node scripts/print-playwright-chrome.mjs spa'
    assert.ok(command.includes(invocation), 'the step must resolve the template browser')
    withFixture((root) => {
      const envFile = join(root, 'github-env')
      const simulate = (resolver) =>
        spawnSync(
          'bash',
          ['-e', '-o', 'pipefail', '-c', command.replace(invocation, resolver)],
          { env: { ...process.env, GITHUB_ENV: envFile }, encoding: 'utf8' },
        )
      const failed = simulate(`${JSON.stringify(process.execPath)} -e 'process.exit(23)'`)
      assert.equal(failed.status, 23, failed.stderr)
      assert.equal(existsSync(envFile), false, 'must not export an empty CHROME_PATH')
      const passed = simulate(
        `${JSON.stringify(process.execPath)} -e 'process.stdout.write("/fake/chrome")'`,
      )
      assert.equal(passed.status, 0, passed.stderr)
      assert.equal(readFileSync(envFile, 'utf8'), 'CHROME_PATH=/fake/chrome\n')
    })
  },
)
