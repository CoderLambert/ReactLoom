import { randomUUID } from 'node:crypto'
import { expect, type Page, type Response, test } from '@playwright/test'

function isTaskCreate(response: Response) {
  return new URL(response.url()).pathname === '/api/tasks' && response.request().method() === 'POST'
}

async function holdCreates(page: Page) {
  const received = Promise.withResolvers<void>()
  const release = Promise.withResolvers<void>()
  let requests = 0
  await page.route('**/api/tasks', async (route) => {
    if (route.request().method() !== 'POST') {
      await route.continue()
      return
    }
    requests += 1
    received.resolve()
    await release.promise
    await route.continue()
  })
  return { received: received.promise, release: release.resolve, count: () => requests }
}

test.beforeEach(async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('Email').fill('ada@reactloom.dev')
  await page.getByLabel('Password').fill('loom-demo')
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page.getByRole('heading', { name: 'Warp board' })).toBeVisible()
  await expect(page.getByText('Dress the loom', { exact: true })).toBeVisible()
})

test('announces a short task title and accepts a corrected submission', async ({ page }) => {
  let createRequests = 0
  await page.route('**/api/tasks', async (route) => {
    if (route.request().method() === 'POST') createRequests += 1
    await route.continue()
  })

  const title = page.getByLabel('Task title')
  await title.fill('ab')
  await page.getByRole('button', { name: 'Add task' }).click()
  const error = page.locator('#create-task-error')
  await expect(error).toHaveAttribute('role', 'alert')
  await expect(error).toHaveText('Task title must contain at least 3 characters.')
  await expect(title).toHaveAttribute('aria-invalid', 'true')
  await expect(title).toHaveAttribute('aria-describedby', 'create-task-error')
  expect(createRequests).toBe(0)

  const corrected = `Corrected title ${randomUUID()}`
  await title.fill(corrected)
  await expect(error).toHaveCount(0)
  await expect(title).toHaveAttribute('aria-invalid', 'false')
  await expect(title).not.toHaveAttribute('aria-describedby', 'create-task-error')

  const saved = page.waitForResponse(isTaskCreate)
  await page.getByRole('button', { name: 'Add task' }).click()
  expect((await saved).status()).toBe(201)
  await expect(page.getByText(corrected, { exact: true })).toBeVisible()
  expect(createRequests).toBe(1)
})

test('retains a server-rejected draft and accepts a corrected retry', async ({ page }) => {
  const title = page.getByLabel('Task title')
  const rejected = 'x'.repeat(81)
  await title.fill(rejected)
  const rejectedResponse = page.waitForResponse(isTaskCreate)
  await page.getByRole('button', { name: 'Add task' }).click()
  expect((await rejectedResponse).status()).toBe(400)
  await expect(page.locator('#create-task-error')).toContainText('Give the task a title.')
  await expect(title).toHaveAttribute('aria-invalid', 'true')
  await expect(title).toHaveAttribute('aria-describedby', 'create-task-error')
  await expect(title).toHaveValue(rejected)

  const corrected = `Retry draft ${randomUUID()}`
  await title.fill(corrected)
  const saved = page.waitForResponse(isTaskCreate)
  await page.getByRole('button', { name: 'Try again' }).click()
  expect((await saved).status()).toBe(201)
  await expect(page.getByText(corrected, { exact: true })).toBeVisible()
  await expect(title).toHaveValue('')
  await expect(page.locator('#create-task-error')).toHaveCount(0)
})

test('retains a draft after a network failure and retries only on request', async ({ page }) => {
  let requests = 0
  await page.route('**/api/tasks', async (route) => {
    if (route.request().method() === 'POST') {
      requests += 1
      await route.abort('failed')
      return
    }
    await route.continue()
  })
  const draft = `Offline draft ${randomUUID()}`
  const title = page.getByLabel('Task title')
  await title.fill(draft)
  await page.getByRole('button', { name: 'Add task' }).click()
  await expect(page.locator('#create-task-error')).toContainText('The network request failed.')
  await expect(title).toHaveValue(draft)
  await expect(page.getByRole('button', { name: 'Try again' })).toBeEnabled()
  expect(requests).toBe(1)

  await page.unroute('**/api/tasks')
  const saved = page.waitForResponse(isTaskCreate)
  await page.getByRole('button', { name: 'Try again' }).click()
  expect((await saved).status()).toBe(201)
  await expect(page.getByText(draft, { exact: true })).toBeVisible()
  await expect(title).toHaveValue('')
  await expect(page.locator('#create-task-error')).toHaveCount(0)
})

test('keeps the pending draft and prevents synchronous duplicate form submissions', async ({
  page,
}) => {
  const held = await holdCreates(page)
  try {
    const draft = `Pending draft ${randomUUID()}`
    const title = page.getByLabel('Task title')
    await title.fill(`  ${draft}  `)
    await page.evaluate(() => {
      const form = document.querySelector('form')
      if (!form) throw new Error('The task form is missing.')
      form.requestSubmit()
      form.requestSubmit()
    })
    await held.received
    await expect(page.getByRole('button', { name: 'Adding task…' })).toBeDisabled()
    await expect(title).toHaveValue(`  ${draft}  `)
    expect(held.count()).toBe(1)
    await title.press('Enter')

    const saved = page.waitForResponse(isTaskCreate)
    held.release()
    expect((await saved).status()).toBe(201)
    await expect(page.getByRole('button', { name: 'Add task' })).toBeEnabled()
    await expect(title).toHaveValue('')
    await expect(page.getByRole('listitem').filter({ hasText: draft })).toHaveCount(1)
    expect(held.count()).toBe(1)
  } finally {
    held.release()
  }
})

for (const restoreSubmitted of [false, true]) {
  test(`preserves a newer draft${restoreSubmitted ? ' matching the submitted title' : ''}`, async ({
    page,
  }) => {
    const held = await holdCreates(page)
    try {
      const submitted = `Submitted draft ${randomUUID()}`
      const newer = `Newer draft ${randomUUID()}`
      const title = page.getByLabel('Task title')
      await title.fill(submitted)
      await page.getByRole('button', { name: 'Add task' }).click()
      await held.received
      await title.fill(newer)
      if (restoreSubmitted) await title.fill(submitted)

      const saved = page.waitForResponse(isTaskCreate)
      held.release()
      expect((await saved).status()).toBe(201)
      await expect(page.getByRole('button', { name: 'Add task' })).toBeEnabled()
      await expect(page.getByText(submitted, { exact: true })).toBeVisible()
      await expect(title).toHaveValue(restoreSubmitted ? submitted : newer)
      expect(held.count()).toBe(1)
    } finally {
      held.release()
    }
  })
}
