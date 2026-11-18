// Narrow real fixed-dist diagnosis. No SDK/input mock, no build, private browser context only.
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { chromium, expect } from '@playwright/test'

const candidate = process.argv.includes('--candidate-css')
const browser = await chromium.launch({ headless: true })
try {
  const context = await browser.newContext({ viewport: { width: 1280, height: 1100 } })
  const page = await context.newPage()
  await page.goto('http://127.0.0.1:4319/libraries/imask?tab=demo&example=advanced')
  const app = page.getByTestId('c06-workshop')
  const run = page.getByRole('button', { name: '运行当前示例', exact: true })
  await expect(app.or(run).first()).toBeVisible()
  if (await run.isVisible()) await run.click()
  const input = app.getByRole('textbox', { name: '事件日期', exact: true })
  await input.pressSequentially('20260230')
  await expect(app.getByTestId('c06-date')).toContainText('格式化不等于有效日期')
  await app.getByRole('button', { name: '重置当前控件', exact: true }).click()
  await input.pressSequentially('20240229')
  await app.getByRole('textbox', { name: '中文备注', exact: true }).fill('新闻来源备注')
  await page.setViewportSize({ width: 390, height: 980 })
  if (candidate)
    await page.addStyleTag({
      content: await readFile(
        fileURLToPath(new URL('../examples/styles.css', import.meta.url)),
        'utf8',
      ),
    })
  const result = await app.evaluate((root) => {
    const box = root.getBoundingClientRect()
    const description = (node) => {
      const rect = node.getBoundingClientRect(),
        style = getComputedStyle(node)
      return {
        tag: node.tagName,
        class: node.className,
        text: node.textContent?.slice(0, 90),
        x: rect.x,
        right: rect.right,
        width: rect.width,
        clientWidth: node.clientWidth,
        scrollWidth: node.scrollWidth,
        display: style.display,
        minWidth: style.minWidth,
        maxWidth: style.maxWidth,
        whiteSpace: style.whiteSpace,
        overflowWrap: style.overflowWrap,
        boxSizing: style.boxSizing,
      }
    }
    return {
      viewport: innerWidth,
      app: description(root),
      overflow: [...root.querySelectorAll('*')]
        .filter(
          (node) =>
            node.getBoundingClientRect().right > box.right + 1 ||
            node.scrollWidth > node.clientWidth + 1,
        )
        .map(description),
    }
  })
  console.log(JSON.stringify({ candidateCssOverlay: candidate, ...result }, null, 2))
  assert.ok(
    result.app.scrollWidth <= result.app.clientWidth + 1,
    `Actual app overflow: ${result.app.scrollWidth}>${result.app.clientWidth}+1`,
  )
} finally {
  await browser.close()
}
