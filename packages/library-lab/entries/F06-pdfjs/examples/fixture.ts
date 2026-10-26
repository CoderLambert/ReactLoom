/**
 * Small deterministic two-page PDF fixture (ASCII + valid xref table).
 * This is created from original text; it does not embed externally sourced PDF assets.
 */
export function createWorkshopPdf(): Uint8Array {
  const streams = [
    'BT /F1 20 Tf 64 722 Td (ReactLoom PDF Guide) Tj 0 -40 Td (Page One: basic render) Tj ET',
    'BT /F1 20 Tf 64 722 Td (ReactLoom News Summary) Tj 0 -40 Td (Page Two: search and extract) Tj ET',
  ]
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R 5 0 R] /Count 2 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 7 0 R >> >> /Contents 4 0 R >>',
    `<< /Length ${streams[0].length} >>\nstream\n${streams[0]}\nendstream`,
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 7 0 R >> >> /Contents 6 0 R >>',
    `<< /Length ${streams[1].length} >>\nstream\n${streams[1]}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ]
  const encoder = new TextEncoder()
  let result = '%PDF-1.4\n'
  const offsets = [0]
  for (const [index, content] of objects.entries()) {
    offsets.push(encoder.encode(result).byteLength)
    result += `${index + 1} 0 obj\n${content}\nendobj\n`
  }
  const startxref = encoder.encode(result).byteLength
  result += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
  for (const offset of offsets.slice(1)) result += `${String(offset).padStart(10,'0')} 00000 n \n`
  result += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${startxref}\n%%EOF\n`
  return encoder.encode(result)
}
