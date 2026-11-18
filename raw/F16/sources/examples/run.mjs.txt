import { executeCruise } from './cli.mjs'

const level = process.argv[2] ?? 'basic'
if (!['basic', 'business', 'advanced'].includes(level)) {
  process.stderr.write('Usage: node examples/run.mjs basic|business|advanced\n')
  process.exit(2)
}
const run = executeCruise(level, 'json')
if (run.error) {
  process.stderr.write(`无法启动依赖检查工具：${String(run.error)}\n`)
  process.exit(2)
}
process.stdout.write(run.stdout ?? '')
process.stderr.write(run.stderr ?? '')
process.stderr.write(
  `\n实际depcruise退出码：${run.status}；JSON报告器退出0不表示没有违反，严格err合同请执行verify.mjs。\n`,
)
process.exit(run.status ?? 2)
