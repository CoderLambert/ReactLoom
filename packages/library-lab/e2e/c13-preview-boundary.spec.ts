import { type CDPSession, expect, type Frame, type Page, test } from '@playwright/test'

const FRAME =
  /^http:\/\/(?:127\.0\.0\.1|localhost):4321\/lab-runners\/gantt\/sessions\/[a-f0-9-]+\/$/u
const frameElement = (page: Page) =>
  page.locator('iframe[title="Frappe Gantt 隔离示例与键盘任务表格"]')
async function startedFrame(page: Page) {
  await expect(frameElement(page)).toHaveCount(1)
  await expect.poll(() => page.frames().some((frame) => FRAME.test(frame.url()))).toBe(true)
  const frame = page.frames().find((item) => FRAME.test(item.url()))
  if (!frame) throw new Error('Missing C13 frame')
  await expect(frame.locator('svg.gantt')).toBeVisible()
  await expect(frame.getByRole('table')).toBeVisible()
  return frame
}
async function start(page: Page, level: 'basic' | 'business' | 'advanced', authority = '') {
  await page.goto(`${authority}/libraries/frappe-gantt?tab=demo&example=${level}`)
  await page.getByRole('button', { name: '运行当前示例' }).click()
  return startedFrame(page)
}
type FrameTree = {
  frame: { id: string; url: string }
  childFrames?: FrameTree[]
}
function findFrame(tree: FrameTree, url: string): string | undefined {
  if (tree.frame.url === url) return tree.frame.id
  for (const child of tree.childFrames ?? []) {
    const id = findFrame(child, url)
    if (id) return id
  }
}
async function observeDocuments(page: Page) {
  const cdp = await page.context().newCDPSession(page)
  const contexts = new Map<string, number>(),
    destroyed = new Set<number>()
  cdp.on('Runtime.executionContextCreated', ({ context }) => {
    if (context.auxData?.isDefault) contexts.set(context.auxData.frameId, context.id)
  })
  cdp.on('Runtime.executionContextDestroyed', ({ executionContextId }) => {
    destroyed.add(executionContextId)
    for (const [frame, id] of contexts) if (id === executionContextId) contexts.delete(frame)
  })
  cdp.on('Runtime.executionContextsCleared', () => {
    for (const id of contexts.values()) destroyed.add(id)
    contexts.clear()
  })
  await cdp.send('Runtime.enable')
  async function contextFor(frame: Frame) {
    let id = 0
    await expect
      .poll(async () => {
        const { frameTree } = await cdp.send('Page.getFrameTree')
        const frameId = findFrame(frameTree, frame.url())
        id = frameId ? (contexts.get(frameId) ?? 0) : 0
        return id
      })
      .toBeGreaterThan(0)
    return id
  }
  return { cdp, destroyed, contextFor }
}
async function mouseupCount(cdp: CDPSession, contextId: number) {
  const group = 'c13-document-listeners'
  try {
    const { result } = await cdp.send('Runtime.evaluate', {
      expression: 'document',
      contextId,
      objectGroup: group,
    })
    if (!result.objectId) throw new Error('Browser did not expose the actual document')
    const { listeners } = await cdp.send('DOMDebugger.getEventListeners', {
      objectId: result.objectId,
    })
    return listeners.filter((listener: { type: string }) => listener.type === 'mouseup').length
  } finally {
    await cdp.send('Runtime.releaseObjectGroup', { objectGroup: group })
  }
}
async function gone(
  page: Page,
  frame: Frame,
  contextId: number,
  observation: Awaited<ReturnType<typeof observeDocuments>>,
) {
  await expect.poll(() => frame.isDetached()).toBe(true)
  await expect.poll(() => observation.destroyed.has(contextId)).toBe(true)
  expect(page.frames()).not.toContain(frame)
}
async function progress(frame: Frame, id: string) {
  return frame.locator(`.bar-wrapper[data-id="${id}"]`).evaluate((element) => {
    const bar = element.querySelector('.bar'),
      value = element.querySelector('.bar-progress')
    if (!bar || !value) throw new Error('Missing real Gantt bars')
    return Number(value.getAttribute('width')) / Number(bar.getAttribute('width'))
  })
}

test('@C13 explicit basic start isolates real SVG and keeps document listeners bounded across view changes', async ({
  page,
}) => {
  const sdkRequests: string[] = []
  page.on('request', (request) => {
    if (/\/assets\/frappe-gantt\.es-/u.test(request.url())) sdkRequests.push(request.url())
  })
  await page.goto('/libraries/frappe-gantt?tab=demo&example=basic')
  await expect(frameElement(page)).toHaveCount(0)
  expect(sdkRequests).toEqual([])
  await page.getByRole('combobox', { name: '查看源码文件' }).selectOption('examples/example.tsx')
  await expect(page.locator('.source-viewer')).toContainText('等效键盘可编辑任务列表')
  await expect(page.locator('.source-viewer .hash')).toContainText('已校验')
  const observation = await observeDocuments(page)
  try {
    const parentContext = await observation.contextFor(page.mainFrame()),
      baseline = await mouseupCount(observation.cdp, parentContext)
    await page.getByRole('button', { name: '运行当前示例' }).click()
    const frame = await startedFrame(page),
      childContext = await observation.contextFor(frame)
    expect(await mouseupCount(observation.cdp, childContext)).toBe(1)
    for (const view of ['Day', 'Month', 'Week', 'Day', 'Month', 'Week'])
      await frame.getByRole('combobox', { name: '时间尺度' }).selectOption(view)
    expect(await mouseupCount(observation.cdp, childContext)).toBe(1)
    expect(await mouseupCount(observation.cdp, parentContext)).toBe(baseline)
    await expect(page.locator('.demo-stage svg.gantt')).toHaveCount(0)
    await expect(frame.getByRole('row')).toHaveCount(4)
    expect(await frameElement(page).getAttribute('sandbox')).toBe('allow-scripts allow-same-origin')
    await page.getByRole('button', { name: '停止并卸载' }).click()
    await gone(page, frame, childContext, observation)
    await expect(frameElement(page)).toHaveCount(0)
    expect(await mouseupCount(observation.cdp, parentContext)).toBe(baseline)
  } finally {
    await observation.cdp.detach()
  }
})

test('@C13 business keyboard saves update the real chart without adding document listeners', async ({
  page,
}) => {
  const frame = await start(page, 'business'),
    observation = await observeDocuments(page)
  try {
    const childContext = await observation.contextFor(frame)
    const input = frame.getByRole('spinbutton', { name: '前端开发进度' })
    await input.fill('60')
    await input.evaluate((element) =>
      element.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 'Enter',
          bubbles: true,
          cancelable: true,
          isComposing: true,
        }),
      ),
    )
    await expect(frame.getByRole('status')).toContainText('内存任务')
    await input.press('Enter')
    await expect(frame.getByRole('status')).toContainText('已更新当前内存计划：frontend')
    await expect.poll(() => progress(frame, 'frontend')).toBeCloseTo(0.6, 2)
    await input.fill('70')
    await frame
      .getByRole('row')
      .filter({ hasText: '前端开发' })
      .getByRole('button', { name: '保存' })
      .click()
    await expect.poll(() => progress(frame, 'frontend')).toBeCloseTo(0.7, 2)
    await input.fill('')
    await input.press('Enter')
    await expect(frame.getByRole('status')).toContainText('已拒绝保存')
    expect(await progress(frame, 'frontend')).toBeCloseTo(0.7, 2)
    await frame.getByRole('textbox', { name: '过滤表格任务' }).fill('前端')
    await expect(frame.getByRole('row')).toHaveCount(2)
    await expect(frame.locator('.bar-wrapper')).toHaveCount(3)
    expect(await mouseupCount(observation.cdp, childContext)).toBe(1)
    await page.getByRole('tab', { name: '详细文档' }).click()
    await gone(page, frame, childContext, observation)
  } finally {
    await observation.cdp.detach()
  }
})

test('@C13 advanced refusals preserve the chart and reset/scenario/tab changes destroy old documents', async ({
  page,
}) => {
  const frame = await start(page, 'advanced'),
    observation = await observeDocuments(page)
  try {
    const context = await observation.contextFor(frame),
      before = await progress(frame, 'qa')
    await frame.getByLabel('前端开发结束日期', { exact: true }).fill('2026-10-01')
    await frame
      .getByRole('row')
      .filter({ hasText: '前端开发' })
      .getByRole('button', { name: '保存' })
      .click()
    await expect(frame.getByRole('status')).toContainText('已拒绝保存，视图保持不变')
    await frame.getByRole('spinbutton', { name: '联调回归进度' }).fill('80')
    await frame
      .getByRole('row')
      .filter({ hasText: '联调回归' })
      .getByRole('button', { name: '保存' })
      .click()
    await expect(frame.getByRole('status')).toContainText('模拟 HTTP 409')
    expect(await progress(frame, 'qa')).toBe(before)
    await frame.getByRole('button', { name: '模拟依赖闭环（不保存）' }).click()
    await expect(frame.getByRole('status')).toContainText('演示依赖环被拒绝')
    await page.getByRole('button', { name: '重置此示例' }).click()
    await gone(page, frame, context, observation)
    const reset = await startedFrame(page),
      resetContext = await observation.contextFor(reset)
    expect(reset.url()).not.toBe(frame.url())
    await expect(reset.getByRole('spinbutton', { name: '联调回归进度' })).toHaveValue('10')
    await page.getByRole('combobox', { name: '学习场景' }).selectOption('business')
    await gone(page, reset, resetContext, observation)
    await expect(frameElement(page)).toHaveCount(0)
    await expect(page.getByRole('button', { name: '运行当前示例' })).toBeVisible()
    await page.getByRole('button', { name: '运行当前示例' }).click()
    const business = await startedFrame(page),
      businessContext = await observation.contextFor(business)
    await page.getByRole('tab', { name: 'Agent 指南' }).click()
    await gone(page, business, businessContext, observation)
  } finally {
    await observation.cdp.detach()
  }
})

test('@C13 stopping during the held real SDK chunk destroys its context before download completion', async ({
  page,
}) => {
  let release!: () => void,
    intercepted = false
  const released = new Promise<void>((resolve) => {
    release = resolve
  })
  let oldFrame: Frame | undefined
  const chunk = /\/lab-runners\/gantt\/assets\/frappe-gantt\.es-[^/]+\.js$/u
  await page.route(chunk, async (route) => {
    intercepted = true
    await released
    try {
      await route.continue()
    } catch (error) {
      if (!oldFrame?.isDetached()) throw error
    }
  })
  await page.goto('/libraries/frappe-gantt?tab=demo&example=business')
  const observation = await observeDocuments(page)
  try {
    await page.getByRole('button', { name: '运行当前示例' }).click()
    await expect.poll(() => intercepted).toBe(true)
    oldFrame = page.frames().find((frame) => FRAME.test(frame.url()))
    if (!oldFrame) throw new Error('Missing loading C13 frame')
    expect(oldFrame).toBeDefined()
    await expect(oldFrame.getByRole('table')).toBeVisible()
    const oldContext = await observation.contextFor(oldFrame)
    await page.getByRole('button', { name: '停止并卸载' }).click()
    await gone(page, oldFrame, oldContext, observation)
    release()
    await page.unroute(chunk)
    await expect(frameElement(page)).toHaveCount(0)
    await expect(page.getByRole('button', { name: '运行当前示例' })).toBeVisible()
    await page.getByRole('button', { name: '运行当前示例' }).click()
    const next = await startedFrame(page)
    expect(next.url()).not.toBe(oldFrame.url())
    await expect(next.getByRole('status')).toContainText('内存任务')
  } finally {
    release()
    await page.unroute(chunk)
    await observation.cdp.detach()
  }
})

test('@C13 two pages own independent documents and stopping one preserves the other', async ({
  page,
  context,
}) => {
  const second = await context.newPage()
  try {
    const firstFrame = await start(page, 'basic'),
      secondFrame = await start(second, 'business', 'http://localhost:4319')
    expect(firstFrame.url()).not.toBe(secondFrame.url())
    expect(secondFrame.url()).toMatch(/^http:\/\/localhost:4321\//u)
    await page.getByRole('button', { name: '停止并卸载' }).click()
    await expect.poll(() => firstFrame.isDetached()).toBe(true)
    expect(secondFrame.isDetached()).toBe(false)
    await secondFrame.getByRole('spinbutton', { name: '前端开发进度' }).fill('55')
    await secondFrame.getByRole('spinbutton', { name: '前端开发进度' }).press('Enter')
    await expect.poll(() => progress(secondFrame, 'frontend')).toBeCloseTo(0.55, 2)
    await second.getByRole('button', { name: '停止并卸载' }).click()
    await expect.poll(() => secondFrame.isDetached()).toBe(true)
  } finally {
    await second.close()
  }
})
