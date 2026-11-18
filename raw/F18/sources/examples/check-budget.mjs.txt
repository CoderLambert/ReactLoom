import { writeFile } from 'node:fs/promises'
import path from 'node:path'
import { evaluateBudget } from './report-policy.mjs'
import { readCurrentSummary, reports } from './summary-reader.mjs'

const args = process.argv.slice(2)
const option = args[0] ?? '--max-initial-gzip=2500'
if (args.length > 1 || !/^--max-initial-gzip=[1-9][0-9]*$/.test(option)) {
  throw new Error(
    'Usage: node entries/F18-rollup-plugin-visualizer/examples/check-budget.mjs [--max-initial-gzip=2500]',
  )
}
const current = await readCurrentSummary()
if (current.status !== 'ready')
  throw new Error(`${current.reason}；先运行 verify.mjs --scenario=advanced`)
const build = current.summary.builds.find((item) => item.variant === 'lazy')
if (!build) throw new Error('Budget requires the lazy build; run the business or advanced scenario')
const result = evaluateBudget(build, Number(option.split('=')[1]))
await writeFile(path.join(reports, 'budget-result.json'), `${JSON.stringify(result, null, 2)}\n`)
process.stdout.write(
  `Initial JS gzip(level 9): ${result.actual} B; limit: ${result.limit} B; ${result.passed ? 'PASS' : 'FAIL'}\n`,
)
process.exitCode = result.passed ? 0 : 1
