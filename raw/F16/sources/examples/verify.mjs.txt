// Two distinct real CLI reporters: JSON structure and strict err exit contract.
import { executeCruise } from './cli.mjs'
import { checkCruiseExit, checkCruiseReport } from './result-policy.mjs'

for (const level of ['basic', 'business', 'advanced']) {
  // The JSON output mode need not implement err reporter's non-zero contract.
  const json = executeCruise(level, 'json')
  process.stdout.write(
    `${JSON.stringify({ level, reporter: 'json', cwd: json.cwd, command: json.command, status: json.status, signal: json.signal, stdout: json.stdout, stderr: json.stderr })}\n`,
  )
  if (json.error || json.signal || !Number.isInteger(json.status))
    throw Error(`JSON CLI unavailable/terminated: ${String(json.error ?? json.signal)}`)
  let result
  try {
    result = checkCruiseReport(level, json.stdout)
  } catch (error) {
    process.stderr.write(`${level} stderr: ${json.stderr || ''}\n`)
    throw error
  }
  const strict = executeCruise(level, 'err')
  process.stdout.write(
    `${JSON.stringify({ level, reporter: 'err', cwd: strict.cwd, command: strict.command, status: strict.status, signal: strict.signal, stdout: strict.stdout, stderr: strict.stderr })}\n`,
  )
  checkCruiseExit(level, strict)
  process.stdout.write(
    level +
      ': real depcruise modules=' +
      result.modules +
      ', errorRules=' +
      result.errors +
      ', strictExit=' +
      strict.status +
      '\n',
  )
}
