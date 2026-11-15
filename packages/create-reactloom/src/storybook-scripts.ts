type StorybookScripts = {
  storybook?: string
  'build-storybook'?: string
}

const PORTABLE_RUNNER = 'node scripts/run-project-tool.mjs'

export function usesPortableStorybookRunner(scripts: StorybookScripts): boolean {
  return (
    scripts.storybook === `${PORTABLE_RUNNER} storybook` &&
    scripts['build-storybook'] === `${PORTABLE_RUNNER} build-storybook`
  )
}

export function assertStorybookScripts(
  scripts: StorybookScripts,
  portableRunnerSource?: string,
): void {
  const dev = scripts.storybook ?? ''
  const build = scripts['build-storybook'] ?? ''
  // Retain the established SPA and original SSR shell entry points.
  if (
    dev.includes('storybook dev') &&
    build.includes('STORYBOOK=true') &&
    build.includes('storybook build')
  ) {
    return
  }
  if (!usesPortableStorybookRunner(scripts)) {
    throw new Error(
      'package.json must launch Storybook dev/build with STORYBOOK=true, either directly or through the supported Node runner.',
    )
  }
  if (!portableRunnerSource) {
    throw new Error('Storybook Node runner scripts/run-project-tool.mjs is missing.')
  }

  // Inspect the entrypoint rather than trusting a script with the right filename
  // that could silently skip Storybook or omit the build-time environment flag.
  const required: Array<[RegExp, string]> = [
    [/mode === 'storybook' \|\| mode === 'build-storybook'/, 'both Storybook modes'],
    [/storybook\/package\.json/, 'the installed Storybook package'],
    [/typeof bin === 'string' \? bin : bin\?\.storybook/, 'the package CLI bin'],
    [/mode === 'storybook' \? \['dev'/, 'the dev subcommand'],
    [/:\s*\['build'\]/, 'the build subcommand'],
    [/STORYBOOK:\s*'true'/, 'the Storybook environment flag'],
    [/spawn\(process\.execPath,\s*\[script,\s*\.\.\.args\]/, 'the Node CLI invocation'],
  ]
  for (const [pattern, purpose] of required) {
    if (!pattern.test(portableRunnerSource)) {
      throw new Error(`Storybook Node runner must provide ${purpose}.`)
    }
  }
}
