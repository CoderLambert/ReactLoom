const MAX_BYTES = 3 * 1024 * 1024;

/** PDF.js may transfer data buffers to its Worker; never pass owned state directly. */
export function createPdfWorkerPayload(source) {
  if (!(source instanceof Uint8Array) || source.byteLength === 0 || source.byteLength > MAX_BYTES) {
    throw new Error('PDF worker payload must be a non-empty Uint8Array of at most 3MiB');
  }
  return {data: source.slice()};
}
