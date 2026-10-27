export interface PdfDimensions { width: number; height: number; }
export interface PdfShape {
  getPageCount(): number;
  getPages(): Array<{getSize(): PdfDimensions}>;
}
export const PDF_LIMITS: Readonly<{maxInputBytes:number;maxOutputBytes:number;maxPages:number;minEdgePt:number;maxEdgePt:number}>;
export function validatePdfLayout(document: PdfShape): number;
export function validateOutputPdf(bytes: Uint8Array): Uint8Array;
