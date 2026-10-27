/** Bound both CSS geometry and physical canvas backing storage before allocating. */
export function boundedCanvasSize(viewport, devicePixelRatio = 1) {
  const width = viewport?.width;
  const height = viewport?.height;
  if (![width, height, devicePixelRatio].every(value => typeof value === 'number' && Number.isFinite(value) && value > 0)) {
    throw new Error('PDF viewport and device pixel ratio must be finite positive numbers');
  }
  const cssWidth = Math.ceil(width);
  const cssHeight = Math.ceil(height);
  if (cssWidth > 4096 || cssHeight > 4096) {
    throw new Error('PDF page exceeds the 4096 CSS pixel edge budget');
  }
  const ratio = Math.max(1, Math.min(2, devicePixelRatio));
  const pixelWidth = Math.ceil(width * ratio);
  const pixelHeight = Math.ceil(height * ratio);
  if (pixelWidth > 4096 || pixelHeight > 4096 || pixelWidth * pixelHeight > 8_000_000) {
    throw new Error('PDF canvas exceeds the 8MP or 4096 pixel backing-store budget');
  }
  return Object.freeze({pixelWidth, pixelHeight, cssWidth, cssHeight, ratio});
}
