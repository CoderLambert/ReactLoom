import { expect, test } from '@playwright/test'

test('@D18 real module Worker RPC, remote validation recovery and successful close', async ({
  page,
}) => {
  let created = 0
  let closed = 0
  page.on('worker', (worker) => {
    created++
    worker.on('close', () => {
      closed++
    })
  })
  await page.goto('/libraries/comlink?tab=demo&example=basic')
  let app = page.getByRole('region', { name: 'Comlink真实Worker示例', exact: true })
  await app.getByRole('textbox', { name: '每行一个词' }).fill('__proto__\nconstructor\n__proto__')
  await app.getByRole('button', { name: '启动 Worker 任务', exact: true }).click()
  await expect(app.getByTestId('comlink-output')).toContainText('"count": 3')
  await expect(app.getByTestId('comlink-output')).toContainText('"value": "__proto__"')
  await expect.poll(() => closed).toBe(1)
  await expect.poll(() => page.workers().length).toBe(0)
  await page.goto('/libraries/comlink?tab=demo&example=business')
  app = page.getByRole('region', { name: 'Comlink真实Worker示例', exact: true })
  await app.getByRole('button', { name: '启动 Worker 任务', exact: true }).click()
  await expect(app.getByTestId('comlink-output')).toContainText('TypeError')
  await expect.poll(() => closed).toBe(2)
  await app.getByRole('checkbox', { name: '发送含数字的非法数组' }).uncheck()
  await app.getByRole('button', { name: '启动 Worker 任务', exact: true }).click()
  await expect(app.getByTestId('comlink-output')).toContainText('"count": 3')
  await expect.poll(() => closed).toBe(3)
  expect(created).toBe(3)
  await expect.poll(() => page.workers().length).toBe(0)
})

test('@D18 transfer/proxy result, cancel and tab exit physically close Workers', async ({
  page,
}) => {
  let created = 0
  let closed = 0
  page.on('worker', (worker) => {
    created++
    worker.on('close', () => {
      closed++
    })
  })
  await page.goto('/libraries/comlink?tab=demo&example=advanced')
  const app = page.getByRole('region', { name: 'Comlink真实Worker示例', exact: true })
  const output = app.getByTestId('comlink-output')
  const start = app.getByRole('button', { name: '启动 Worker 任务', exact: true })
  await start.click()
  await expect(output).toContainText('"sum": 75')
  await expect(output).toContainText('"detachedBytesOnMainThread": 0')
  const answer = JSON.parse(await output.innerText())
  expect(answer.progressEvents).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
  await expect.poll(() => closed).toBe(1)
  await start.click()
  await expect(output).toContainText('Worker 已处理')
  await app.getByRole('button', { name: '终止 Worker', exact: true }).click()
  await expect.poll(() => closed).toBe(2)
  await expect.poll(() => page.workers().length).toBe(0)
  await page.waitForTimeout(300) // >3 fixture intervals: no late UI callback after physical close.
  await expect(output).toHaveText('Worker 已终止，旧异步结果不会回写')
  await start.click()
  await expect(output).toContainText('Worker 已处理')
  await page.getByRole('button', { name: '停止并卸载', exact: true }).click()
  await expect.poll(() => closed).toBe(3)
  await expect.poll(() => page.workers().length).toBe(0)
  await page.getByRole('button', { name: '运行当前示例', exact: true }).click()
  await expect(output).toHaveText('Worker 尚未启动')
  await start.click()
  await expect(output).toContainText('Worker 已处理')
  await page.getByRole('tab', { name: '详细文档', exact: true }).click()
  await expect.poll(() => closed).toBe(4)
  await expect.poll(() => page.workers().length).toBe(0)
  expect(created).toBe(4)
})
