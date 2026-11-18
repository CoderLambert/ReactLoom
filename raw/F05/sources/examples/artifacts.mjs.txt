import { createHash } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'

const directory = new URL('../.artifacts/', import.meta.url)
const scenarios = new Set(['basic', 'business', 'advanced'])

/** Only writes original fixtures under this entry; caller paths are never accepted. */
export async function saveArtifacts(scenario, bytes, result) {
  if (!scenarios.has(scenario)) throw new Error('未知实验')
  await mkdir(directory, { recursive: true })
  const artifact = {
    workbook: `.artifacts/${scenario}.xlsx`,
    result: `.artifacts/${scenario}.json`,
    bytes: bytes.byteLength,
    sha256: createHash('sha256').update(bytes).digest('hex'),
  }
  const report = { ...result, artifact }
  await writeFile(new URL(`${scenario}.xlsx`, directory), bytes)
  await writeFile(new URL(`${scenario}.json`, directory), `${JSON.stringify(report, null, 2)}\n`)
  console.log(JSON.stringify(report, null, 2))
  return report
}
