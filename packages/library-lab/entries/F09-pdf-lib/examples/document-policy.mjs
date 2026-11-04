/** Bounded PDF document post-parse policy; not a substitute for sandboxing PDFDocument.load. */
export const PDF_LIMITS = Object.freeze({maxInputBytes: 2 * 1024 * 1024, maxOutputBytes: 4 * 1024 * 1024, maxPages: 20, minEdgePt: 36, maxEdgePt: 2000});
export function validatePdfLayout(document) {
  const count = document?.getPageCount?.();
  if (!Number.isSafeInteger(count) || count < 1 || count > PDF_LIMITS.maxPages) throw new Error('PDF page count outside the 1–20 bound');
  const pages = document.getPages();
  if (!Array.isArray(pages) || pages.length !== count) throw new Error('PDF page inventory mismatch');
  for (const page of pages) {
    const {width, height} = page.getSize();
    if (![width,height].every(value => Number.isFinite(value) && value >= PDF_LIMITS.minEdgePt && value <= PDF_LIMITS.maxEdgePt)) {
      throw new Error('PDF page dimensions outside the supported bound');
    }
  }
  return count;
}
export function validateOutputPdf(bytes) {
  if (!(bytes instanceof Uint8Array) || bytes.byteLength < 10 || bytes.byteLength > PDF_LIMITS.maxOutputBytes) {
    throw new Error('generated PDF size outside the supported bound');
  }
  return bytes;
}
