import {
  sourceTextPath,
  validateSourceIndex,
  verifySourceIndexDigest,
} from '../src/lib/source-integrity.mjs'

const path: string = sourceTextPath('examples/index.html')
const index = validateSourceIndex([], [])
const verified: Promise<unknown> = verifySourceIndexDigest(index, 'a'.repeat(64))
void path
void verified
