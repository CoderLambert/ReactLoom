// File selection ownership is independent of crop/zoom/export invalidation.
export function createFileCheck() {
  let epoch = 0
  return {
    begin: () => ++epoch,
    current: (id) => id === epoch,
    dispose: () => {
      epoch++
    },
  }
}
