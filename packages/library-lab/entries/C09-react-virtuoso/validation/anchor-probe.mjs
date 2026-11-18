// Diagnostic only: own Chromium context, actual fixed candidate16 dist, real scroll/SDK/DOM.

import { writeFile } from 'node:fs/promises'
import { chromium, expect } from '@playwright/test'

const settle = process.argv.includes('--settle')
const browser = await chromium.launch()
const records = []
try {
  for (let attempt = 1; attempt <= 3; attempt++) {
    const page = await browser.newPage({ viewport: { width: 1100, height: 1000 } })
    try {
      await page.goto('http://127.0.0.1:4319/libraries/react-virtuoso?tab=demo&example=advanced')
      const app = page.getByTestId('c09-advanced')
      const run = page.getByRole('button', { name: '运行当前示例', exact: true })
      await expect(app.or(run).first()).toBeVisible()
      if (await run.isVisible()) await run.click()
      const scroller = app.locator('[data-virtuoso-scroller="true"]')
      const row = app.locator('[data-article-id="article-501"]')
      await expect(row).toBeVisible()
      const oldHeight = await row.evaluate((node) => node.getBoundingClientRect().height)
      await app.getByRole('button', { name: '展开 article-501 说明', exact: true }).click()
      await expect
        .poll(() =>
          row.evaluate((node) => Number(node.parentElement.getAttribute('data-known-size'))),
        )
        .toBeGreaterThan(oldHeight + 100)
      const before = await row.evaluate(
        (node) =>
          node.getBoundingClientRect().top -
          node.closest('[data-virtuoso-scroller]').getBoundingClientRect().top,
      )
      await app.getByRole('button', { name: '向前加载 10 条', exact: true }).click()
      await expect(app.getByTestId('c09-history-status')).toContainText('消息 40 条')
      await expect
        .poll(() =>
          row.evaluate(
            (node) =>
              node.getBoundingClientRect().top -
              node.closest('[data-virtuoso-scroller]').getBoundingClientRect().top,
          ),
        )
        .toBeGreaterThan(before - 8)
      await app.getByRole('button', { name: '折叠 article-501 说明', exact: true }).click()
      if (settle)
        await expect
          .poll(() =>
            row.evaluate((node) =>
              Math.abs(
                Number(node.parentElement.getAttribute('data-known-size')) -
                  node.getBoundingClientRect().height,
              ),
            ),
          )
          .toBeLessThanOrEqual(1)
      await scroller.evaluate((element) => {
        const app = element.closest('[data-testid="c09-advanced"]')
        const sample = (label) => {
          const box = element.getBoundingClientRect()
          const rows = [...element.querySelectorAll('article[data-article-id]')].map((row) => ({
            id: row.dataset.articleId,
            top: row.getBoundingClientRect().top - box.top,
            height: row.getBoundingClientRect().height,
            known: Number(row.parentElement.getAttribute('data-known-size')),
          }))
          return {
            label,
            at: performance.now(),
            scrollTop: element.scrollTop,
            scrollHeight: element.scrollHeight,
            atBottom: app.dataset.atBottom,
            rows,
          }
        }
        window.__c09Probe = { sample, events: [] }
        element.addEventListener(
          'scroll',
          () => window.__c09Probe.events.push(sample('native-scroll')),
          { passive: true },
        )
      })
      const initial = await page.evaluate(() => window.__c09Probe.sample('before-wheel'))
      await scroller.hover()
      await page.mouse.wheel(0, 400)
      await expect(app).toHaveAttribute('data-at-bottom', 'false')
      if (settle)
        await expect
          .poll(() => scroller.evaluate((element) => element.scrollTop))
          .toBeGreaterThan(initial.scrollTop + 390)
      const sampled = await page.evaluate(() => {
        const snapshot = window.__c09Probe.sample('anchor-captured')
        const height = document
          .querySelector('[data-virtuoso-scroller]')
          .getBoundingClientRect().height
        const row = snapshot.rows.find((row) => row.top >= 1 && row.top < height - 20)
        if (!row) throw new Error('No visible anchor')
        return { ...snapshot, anchor: { id: row.id, offset: row.top } }
      })
      await app.getByRole('button', { name: '添加最新消息', exact: true }).click()
      await expect(app.getByTestId('c09-history-status')).toContainText('消息 41 条')
      await page.waitForTimeout(250)
      const result = await page.evaluate(() => ({
        final: window.__c09Probe.sample('after-append'),
        events: window.__c09Probe.events,
      }))
      const retained = result.final.rows.find((row) => row.id === sampled.anchor.id)
      const delta = retained ? Math.abs(retained.top - sampled.anchor.offset) : null
      const record = {
        attempt,
        settle,
        initial,
        sampled,
        ...result,
        delta,
        pass: delta !== null && delta < 8,
      }
      records.push(record)
      console.log(JSON.stringify(record))
    } finally {
      await page.close()
    }
  }
} finally {
  await browser.close()
}
await writeFile(
  new URL(settle ? './anchor-probe-settled.json' : './anchor-probe-original.json', import.meta.url),
  JSON.stringify(records, null, 2) + '\n',
)
if (records.some((record) => !record.pass)) process.exitCode = 1
