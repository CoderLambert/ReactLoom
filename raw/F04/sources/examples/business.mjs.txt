if (process.argv[2] !== undefined && process.argv[2] !== 'business')
  throw new Error('This entry accepts only its own scenario argument')

import { generateWorkbook, inspectWorkbook } from './core.mjs'

const { bytes, totals } = await generateWorkbook('business')
const info = await inspectWorkbook(bytes)
console.log(
  JSON.stringify({ scenario: 'business', bytes: bytes.byteLength, totals, info }, null, 2),
)
