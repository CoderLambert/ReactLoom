import { expect, type Locator, type Page, test } from '@playwright/test'

async function open(page: Page, level: string) {
  await page.setViewportSize({ width: 1280, height: 2200 })
  await page.goto(`/libraries/pragmatic-drag-and-drop?tab=demo&example=${level}`)
  const region = page.getByRole('region', { name: 'Pragmatic drag and drop 实践', exact: true })
  const run = page.getByRole('button', { name: '运行当前示例', exact: true })
  await expect(region.or(run).first()).toBeVisible()
  if (await run.isVisible()) await run.click()
  await expect(region).toBeVisible()
  return region
}
function row(board: Locator, id: string) {
  return board.locator(`li[data-item-id="${id}"]`)
}
async function drag(
  page: Page,
  sourceBoard: Locator,
  sourceId: string,
  targetBoard: Locator,
  targetId: string,
  duringDrag?: () => Promise<void>,
) {
  const source = row(sourceBoard, sourceId)
  const handle = source.locator('[data-drag-handle]')
  const target = row(targetBoard, targetId)
  await handle.scrollIntoViewIfNeeded()
  await target.scrollIntoViewIfNeeded()
  const from = await handle.boundingBox(),
    to = await target.boundingBox()
  if (!from || !to) throw new Error('Native drag endpoints are not on screen')
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2)
  await page.mouse.down()
  try {
    await page.mouse.move(from.x + from.width / 2 + 12, from.y + from.height / 2 + 6, { steps: 5 })
    await expect(source).toHaveAttribute('data-state', 'dragging')
    if (duringDrag) await duringDrag()
    await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, { steps: 12 })
    await page.mouse.move(to.x + to.width / 2 + 2, to.y + to.height / 2 + 2)
  } finally {
    await page.mouse.up()
  }
  await expect(source).not.toHaveAttribute('data-state', 'dragging')
}

test('@B14 native trusted handle drag uses actual adapters and stable row DOM, with keyboard fallback', async ({
  page,
}) => {
  const app = await open(page, 'basic')
  const board = app.getByRole('region', { name: '频道排序主列表', exact: true })
  const original = await row(board, 'ai').elementHandle()
  if (!original) throw new Error('No actual draggable row')
  await row(board, 'ai').evaluate((element) => {
    element.addEventListener('dragstart', (event) => {
      element.setAttribute('data-native-trusted', String(event.isTrusted))
    })
  })
  await drag(page, board, 'ai', board, 'opensource')
  await expect(board.getByTestId('b14-order')).toHaveText('frontend → opensource → ai')
  await expect(board).toHaveAttribute('data-all-order', 'frontend,opensource,ai,global,deep')
  expect(await original.evaluate((node) => node.isConnected)).toBe(true)
  await expect(row(board, 'ai')).toHaveAttribute('data-native-trusted', 'true')
  await board.getByRole('button', { name: '上移 AI / 模型', exact: true }).focus()
  await page.keyboard.press('Enter')
  await expect(board.getByTestId('b14-order')).toHaveText('frontend → ai → opensource')
  await expect(board.locator('li')).toHaveCount(3)
})

test('@B14 pinned slots reject source destination and crossing for actual pointer and keyboard', async ({
  page,
}) => {
  const app = await open(page, 'business')
  const board = app.getByRole('region', { name: '频道排序主列表', exact: true })
  await expect(row(board, 'global')).not.toHaveAttribute('draggable', 'true')
  await expect(board.getByRole('button', { name: '上移 国际资讯', exact: true })).toBeDisabled()
  await expect(board.getByRole('button', { name: '下移 开源趋势', exact: true })).toBeDisabled()
  await drag(page, board, 'ai', board, 'deep')
  await expect(board.getByTestId('b14-order')).toHaveText(
    'ai → frontend → opensource → global → deep',
  )
  await expect(board.locator('p[role="status"]')).toContainText('不能被跨越')
  await drag(page, board, 'ai', board, 'frontend')
  await expect(board.getByTestId('b14-order')).toHaveText(
    'frontend → ai → opensource → global → deep',
  )
})

test('@B14 two actual scopes isolate foreign drops and cleanup old registered rows on stop', async ({
  page,
}) => {
  const app = await open(page, 'advanced')
  const main = app.getByRole('region', { name: '频道排序主列表', exact: true })
  const peer = app.getByRole('region', { name: '隔离对照列表', exact: true })
  expect(await main.getAttribute('data-scope')).not.toBe(await peer.getAttribute('data-scope'))
  const initial = 'ai → frontend → opensource → global → deep'
  await drag(page, main, 'ai', peer, 'frontend')
  await expect(main.getByTestId('b14-order')).toHaveText(initial)
  await expect(peer.getByTestId('b14-order')).toHaveText(initial)
  await drag(page, peer, 'ai', peer, 'frontend')
  await expect(peer.getByTestId('b14-order')).toHaveText(
    'frontend → ai → opensource → global → deep',
  )
  await expect(main.getByTestId('b14-order')).toHaveText(initial)
  await drag(page, main, 'ai', main, 'opensource')
  await main.getByRole('button', { name: '撤销排序', exact: true }).click()
  await expect(main.getByTestId('b14-order')).toHaveText(initial)
  await expect(main.getByRole('button', { name: '撤销排序', exact: true })).toBeDisabled()
  await row(main, 'opensource').evaluate((element) => {
    element.addEventListener('drop', (event) =>
      element.setAttribute('data-native-drop-trusted', String(event.isTrusted)),
    )
  })
  // A programmatic UI fixture models a business refresh while the real mouse drag
  // is held. It does not forge drag events or replace SDK callbacks/results.
  await drag(page, main, 'ai', main, 'opensource', async () => {
    await main.getByRole('button', { name: '重置频道', exact: true }).evaluate((button) => {
      if (!(button instanceof HTMLButtonElement)) throw new Error('No reset control')
      button.click()
    })
  })
  await expect(row(main, 'opensource')).toHaveAttribute('data-native-drop-trusted', 'true')
  await expect(main.getByTestId('b14-order')).toHaveText(initial)
  const old = await row(main, 'ai').elementHandle()
  if (!old) throw new Error('No registered row before stop')
  await page.getByRole('button', { name: '停止并卸载', exact: true }).click()
  await expect(app).toHaveCount(0)
  expect(await old.evaluate((element) => element.isConnected)).toBe(false)
  expect(await old.evaluate((element) => element.getAttribute('draggable'))).not.toBe('true')
  await page.getByRole('button', { name: '运行当前示例', exact: true }).click()
  await expect(main.getByTestId('b14-order')).toHaveText(initial)
  await drag(page, main, 'ai', main, 'frontend')
  await expect(main.getByTestId('b14-order')).toHaveText(
    'frontend → ai → opensource → global → deep',
  )
})
