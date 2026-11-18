import assert from 'node:assert/strict'
import test from 'node:test'
import { getDocument, version } from 'pdfjs-dist/legacy/build/pdf.mjs'
import { createWorkshopPdf } from './fixture.ts'

test('real legacy SDK parses original bytes and extracts both distinct pages in Node', async () => {
  assert.equal(version, '6.3.289')
  const bytes = createWorkshopPdf()
  const task = getDocument({ data: bytes.slice() })
  try {
    const doc = await task.promise
    assert.equal(doc.numPages, 2)
    const text = async (n) =>
      (await (await doc.getPage(n)).getTextContent()).items.map((x) => x.str ?? '').join(' ')
    assert.match(await text(1), /ReactLoom PDF Guide.*Page One/)
    assert.match(await text(2), /ReactLoom News Summary.*Page Two/)
    assert.equal(bytes[0], 37, 'canonical input not transferred')
  } finally {
    await task.destroy()
  }
})

test('real legacy SDK rejects independent corrupt input without changing accepted document', async () => {
  const accepted = getDocument({ data: createWorkshopPdf() })
  const corrupt = getDocument({ data: new Uint8Array([1, 2, 3, 4, 5]) })
  try {
    const doc = await accepted.promise
    await assert.rejects(corrupt.promise, { name: 'InvalidPDFException' })
    assert.equal(doc.numPages, 2)
    assert.equal((await doc.getPage(2)).pageNumber, 2)
  } finally {
    await Promise.all([accepted.destroy(), corrupt.destroy()])
  }
})
