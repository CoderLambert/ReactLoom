/** Original two-page ASCII PDF. This fixture is not a downloaded third-party document. */
export function createSamplePdf(): Uint8Array {
  const streams = [
    'BT /F1 22 Tf 60 720 Td (ReactLoom React PDF) Tj 0 -42 Td (Page One: demo) Tj ET',
    'BT /F1 22 Tf 60 720 Td (ReactLoom Review) Tj 0 -42 Td (Page Two: evidence) Tj ET',
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
  let pdf = '%PDF-1.4\n'
  const offsets: number[] = []
  objects.forEach((content, index) => {
    offsets.push(encoder.encode(pdf).length)
    pdf += `${index+1} 0 obj\n${content}\nendobj\n`
  })
  const xref = encoder.encode(pdf).length
  pdf += `xref\n0 ${objects.length+1}\n0000000000 65535 f \n`
  offsets.forEach(offset => {pdf += `${String(offset).padStart(10,'0')} 00000 n \n`})
  pdf += `trailer\n<< /Size ${objects.length+1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`
  return encoder.encode(pdf)
}
