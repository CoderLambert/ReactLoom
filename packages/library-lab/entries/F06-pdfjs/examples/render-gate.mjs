/**
 * Serializes async render work against one HTMLCanvasElement. The caller owns
 * PDF.js RenderTask.cancel() and must check whether its React effect is stale.
 * Rejecting/cancelling an operation never poisons the following operation.
 */
export function createRenderGate() {
  let settled = Promise.resolve()
  return function withCanvas(operation) {
    const current = settled.then(operation)
    settled = current.then(() => undefined, () => undefined)
    return current
  }
}
