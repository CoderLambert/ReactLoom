if (process.argv[2] !== undefined && process.argv[2] !== 'basic')
  throw new Error('This entry accepts only its own scenario argument')

import { generateWorkbook, inspectWorkbook } from './core.mjs'

const { bytes, totals } = await generateWorkbook('basic')
const info = await inspectWorkbook(bytes)
console.log(JSON.stringify({ scenario: 'basic', bytes: bytes.byteLength, totals, info }, null, 2))
