import { createHash } from 'node:crypto'
import { expect, test } from '@playwright/test'

test('@platform-document blocked reference labels remain readable without a misleading navigation target', async ({
  page,
}) => {
  await page.goto('/libraries/sheetjs?tab=docs')
  const body = page.locator('.prose')
  await expect(body.getByText('local-validation.md', { exact: true })).toBeVisible()
  await expect(body.getByRole('link', { name: 'local-validation.md', exact: true })).toHaveCount(0)
  await expect(body.locator('a:not([href]),a[href=""]')).toHaveCount(0)
})

test('@platform-document all 27 affected published documents retain text without empty URL anchors', async ({
  page,
}) => {
  const documents = [
    ['chartjs', 'docs'],
    ['d3', 'docs'],
    ['react-flow', 'docs'],
    ['react-three-fiber', 'docs'],
    ['motion-for-react', 'docs'],
    ['rive-react', 'docs'],
    ['base-ui', 'docs'],
    ['react-resizable-panels', 'docs'],
    ['cmdk', 'docs'],
    ['sonner', 'docs'],
    ['react-motion-migration', 'docs'],
    ['react-beautiful-dnd-migration', 'docs'],
    ['react-hook-form', 'docs'],
    ['zod', 'agent'],
    ['zod', 'docs'],
    ['jsonforms', 'docs'],
    ['ajv', 'docs'],
    ['ag-grid', 'docs'],
    ['react-virtuoso', 'agent'],
    ['react-virtuoso', 'docs'],
    ['tanstack-virtual', 'docs'],
    ['fullcalendar', 'docs'],
    ['frappe-gantt', 'docs'],
    ['p-limit', 'agent'],
    ['p-limit', 'docs'],
    ['streamdown', 'docs'],
    ['sheetjs', 'docs'],
  ]
  for (const [slug, tab] of documents) {
    await test.step(`${slug} ${tab}`, async () => {
      await page.goto(`/libraries/${slug}?tab=${tab}`)
      const body = page.locator('.prose')
      await expect(body).not.toBeEmpty()
      await expect(body.getByRole('heading').first()).toBeVisible()
      await expect(body.locator('a:not([href]),a[href=""]')).toHaveCount(0)
    })
  }
})

test('@platform-document a declared official snapshot link serves the preserved README bytes', async ({
  page,
  request,
}) => {
  await page.goto('/libraries/frappe-gantt?tab=docs')
  const link = page.locator('.prose').getByRole('link', { name: '官方 README 原文', exact: true })
  await expect(link).toHaveAttribute('href', '/raw/C13/readme.md')
  const metadataResponse = await request.get('/raw/C13/detail.json')
  expect(metadataResponse.ok()).toBe(true)
  const metadata = (await metadataResponse.json()) as {
    official: { readme: { sha256: string; snapshotPath: string } }
  }
  expect(metadata.official.readme.snapshotPath).toBe('official/readme.md')
  const response = await request.get('/raw/C13/readme.md')
  expect(response.ok()).toBe(true)
  expect(response.headers()['content-type']).not.toContain('text/html')
  const original = await response.body()
  expect(original.byteLength).toBe(15874)
  expect(createHash('sha256').update(original).digest('hex')).toBe(metadata.official.readme.sha256)
  expect(original.toString('utf8')).toContain('Frappe Gantt')
})

test('@platform-document a versioned migration patch link serves only inert declared source text', async ({
  page,
  request,
}) => {
  await page.goto('/libraries/react-grid-layout?tab=docs')
  const link = page
    .locator('.prose')
    .getByRole('link', { name: 'react-grid-layout@2.3.0.patch', exact: true })
  const url = '/raw/B15/sources/examples/react-grid-layout@2.3.0.patch.txt'
  await expect(link).toHaveAttribute('href', url)
  const indexResponse = await request.get('/raw/B15/source-index.json')
  expect(indexResponse.ok()).toBe(true)
  const sources = (await indexResponse.json()) as {
    path: string
    bytes: number
    sha256: string
  }[]
  const source = sources.find((item) => item.path === 'examples/react-grid-layout@2.3.0.patch')
  expect(source).toBeDefined()
  const response = await request.get(url)
  expect(response.ok()).toBe(true)
  expect(response.headers()['content-type']).toContain('text/plain')
  const original = await response.body()
  expect(original.byteLength).toBe(source?.bytes)
  expect(createHash('sha256').update(original).digest('hex')).toBe(source?.sha256)
  expect(original.toString('utf8')).toContain('edgeScrollRef')

  await page.goto('/libraries/react-grid-layout?tab=demo&example=basic')
  const viewer = page.locator('.source-viewer')
  await viewer
    .getByLabel('查看源码文件', { exact: true })
    .selectOption('examples/react-grid-layout@2.3.0.patch')
  await expect(viewer.locator('pre')).toContainText('edgeScrollRef')
  await expect(viewer.locator('.hash')).toContainText(`${source?.sha256} · 已校验`)
  await expect(viewer.getByRole('button', { name: '复制源码', exact: true })).toBeEnabled()
  await expect(viewer.getByRole('alert')).toHaveCount(0)
})
