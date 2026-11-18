import { readLocalTextPreview } from './preview.mjs'
// Invalidation prevents UI writes; it does not cancel Blob.arrayBuffer already in progress.
export function createPreviewSession() {
  let generation = 0
  return {
    invalidate() {
      generation++
    },
    async read(file, accept, reject) {
      const turn = ++generation
      try {
        const text = await readLocalTextPreview(file)
        if (turn === generation) accept(text)
      } catch (error) {
        if (turn === generation) reject(error)
      }
    },
  }
}
