/** Application policy: fit both axes before mounting a Canvas. DPR is fixed at 1. */
export function getPageGeometry(viewport, zoom) {
  const { width, height } = viewport
  if (
    ![width, height, zoom].every(Number.isFinite) ||
    width <= 0 ||
    height <= 0 ||
    ![0.75, 1, 1.25, 1.5].includes(zoom)
  ) {
    throw new Error('Invalid PDF viewport or zoom')
  }
  const scale = Math.min((720 * zoom) / width, (960 * zoom) / height)
  const outputWidth = Math.ceil(width * scale)
  const outputHeight = Math.ceil(height * scale)
  if (
    !Number.isFinite(scale) ||
    scale <= 0 ||
    outputWidth > 1080 ||
    outputHeight > 1440 ||
    outputWidth * outputHeight > 1555200
  ) {
    throw new Error('PDF canvas budget exceeded')
  }
  return { scale, width: outputWidth, height: outputHeight }
}
