import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import {
  PDF_LIMITS,
  validateNoteLabel,
  validateOutputPdf,
  validatePdfLayout,
} from './document-policy.mjs'

export async function createNote(label: string): Promise<Uint8Array> {
  const safeLabel = validateNoteLabel(label)
  const book = await PDFDocument.create()
  book.setTitle(`ReactLoom ${safeLabel}`)
  const page = book.addPage([595, 842])
  const font = await book.embedFont(StandardFonts.Helvetica)
  const title = `ReactLoom Library Lab - ${safeLabel}`
  page.drawText(title, {
    x: 45,
    y: 780,
    size: Math.min(17, 505 / font.widthOfTextAtSize(title, 1)),
    font,
    color: rgb(0.12, 0.34, 0.25),
  })
  page.drawText('Generated locally - no network', { x: 45, y: 745, size: 10, font })
  return validateOutputPdf(await book.save())
}

export async function combineNotes(): Promise<Uint8Array> {
  const target = await PDFDocument.create()
  for (const name of ['Weekly summary', 'Technical review']) {
    const source = await PDFDocument.load(await createNote(name))
    const copied = await target.copyPages(source, source.getPageIndices())
    for (const p of copied) target.addPage(p)
  }
  if (target.getPageCount() !== 2) throw new Error('merge must produce exactly two pages')
  validatePdfLayout(target)
  return validateOutputPdf(await target.save())
}

export async function stampOwnPdf(bytes: Uint8Array): Promise<Uint8Array> {
  if (bytes.byteLength < 10 || bytes.byteLength > PDF_LIMITS.maxInputBytes)
    throw new Error('PDF must be 10 bytes–2 MiB')
  if (new TextDecoder().decode(bytes.slice(0, 5)) !== '%PDF-') throw new Error('Not a PDF header')
  const book = await PDFDocument.load(bytes, { ignoreEncryption: false })
  validatePdfLayout(book)
  const page = book.getPages()[0]
  if (!page) throw new Error('Document has no pages')
  const font = await book.embedFont(StandardFonts.Helvetica)
  const media = page.getMediaBox(),
    crop = page.getCropBox()
  const x = Math.max(media.x, crop.x),
    y = Math.max(media.y, crop.y)
  const width = Math.min(media.x + media.width, crop.x + crop.width) - x
  const height = Math.min(media.y + media.height, crop.y + crop.height) - y
  if (![x, y, width, height].every(Number.isFinite) || width < 36 || height < 36)
    throw new Error('Visible PDF page area is unsupported')
  const margin = Math.min(48, width * 0.08)
  const size = Math.min(11, (width - 2 * margin) / font.widthOfTextAtSize('Reviewed locally', 1))
  page.drawText('Reviewed locally', {
    x: x + margin,
    y: y + Math.min(50, height * 0.15),
    size,
    font,
    color: rgb(0, 0.4, 0.2),
  })
  return validateOutputPdf(await book.save())
}
