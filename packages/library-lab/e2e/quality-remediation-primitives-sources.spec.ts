import { expect, test } from '@playwright/test'

for (const [id, slug, status] of [
  ['B10', 'base-ui', 'unknown'],
  ['B11', 'radix-primitives', 'unknown'],
  ['B12', 'react-aria', 'blocked'],
  ['B14', 'pragmatic-drag-and-drop', 'unknown'],
  ['B16', 'react-resizable-panels', 'unknown'],
  ['B18', 'cmdk', 'blocked'],
  ['B19', 'embla-carousel', 'unknown'],
  ['B20', 'sonner', 'unknown'],
  ['B15', 'react-grid-layout', 'unknown'],
  ['B21', 'react-motion-migration', 'unknown'],
  ['B22', 'react-beautiful-dnd-migration', 'unknown'],
  ['C02', 'zod', 'unknown'],
  ['C03', 'valibot', 'unknown'],
  ['C04', 'jsonforms', 'blocked'],
  ['C05', 'ajv', 'unknown'],
  ['C06', 'imask', 'unknown'],
  ['C08', 'ag-grid', 'blocked'],
  ['C09', 'react-virtuoso', 'unknown'],
  ['C10', 'tanstack-virtual', 'blocked'],
  ['C11', 'react-arborist', 'unknown'],
  ['C12', 'fullcalendar', 'blocked'],
  ['C13', 'frappe-gantt', 'blocked'],
  ['C14', 'date-fns', 'unknown'],
  ['C15', 'dayjs', 'unknown'],
  ['C16', 'luxon', 'unknown'],
  ['C17', 'i18next', 'blocked'],
  ['C18', 'react-i18next', 'blocked'],
  ['C19', 'nuqs', 'unknown'],
  ['C21', 'tailwind-merge', 'blocked'],
]) {
  test(`@${id} original fixed README and evidenced homepage ${status}`, async ({ page }) => {
    await page.goto(`/libraries/${slug}?tab=readme`)
    await expect(page.getByRole('heading', { name: '官方 README 原文', exact: true })).toBeVisible()
    await expect(page.locator('.prose')).not.toBeEmpty()
    await expect(page.getByRole('alert')).toHaveCount(0)
    await expect(page.getByRole('link', { name: '打开上游原文' })).toHaveAttribute(
      'href',
      /\/[a-f0-9]{40}\//u,
    )
    await page.getByRole('tab', { name: '官网预览', exact: true }).click()
    await expect(page.getByRole('link', { name: /打开官网|打开官方仓库/u })).toHaveAttribute(
      'href',
      /^https:/u,
    )
    await expect(page.locator('iframe')).toHaveCount(0)
    const load = page.getByRole('button', { name: '加载官网预览', exact: true })
    if (status === 'blocked') await expect(load).toHaveCount(0)
    else await expect(load).toBeVisible()
  })
}
