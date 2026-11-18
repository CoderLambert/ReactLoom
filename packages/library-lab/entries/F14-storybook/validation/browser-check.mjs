import assert from 'node:assert/strict'
import { writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'

const require = createRequire(new URL('../../../package.json', import.meta.url))
const { chromium } = require('@playwright/test')
const browser = await chromium.launch({ headless: true })
try {
  const page = await browser.newPage()
  for (const story of ['basic', 'business', 'advanced', 'recovery', 'business']) {
    const id = `library-lab-f14-statuscard--${story}`
    if (story === 'basic')
      await page.goto(`http://127.0.0.1:6037/iframe.html?id=${id}&viewMode=story`)
    else
      await page.evaluate(
        (storyId) =>
          window.__STORYBOOK_ADDONS_CHANNEL__.emit('setCurrentStory', {
            storyId,
            viewMode: 'story',
          }),
        id,
      )
    await page.waitForFunction((storyId) => {
      const [finished] = window.__STORYBOOK_ADDONS_CHANNEL__?.last('storyFinished') ?? []
      return finished?.storyId === storyId
    }, id)
    const [finished] = await page.evaluate(() =>
      window.__STORYBOOK_ADDONS_CHANNEL__.last('storyFinished'),
    )
    await writeFile(
      new URL(`./${story}-browser-report.json`, import.meta.url),
      JSON.stringify(finished, null, 2),
    )
    assert.equal(finished.status, 'success', `${story} play must finish successfully`)
    const a11y = finished.reporters.find((report) => report.type === 'a11y')
    assert.ok(a11y, `${story} addon must actually produce a report`)
    assert.equal(a11y.status, 'passed')
    assert.equal(a11y.result.violations.length, 0)
    const button = page.getByRole('button')
    assert.equal(await button.isDisabled(), story !== 'basic')
    const state = await page.getByRole('status').innerText()
    assert.equal(
      state,
      { basic: '待处理', business: '已归档', advanced: '等待审核', recovery: '已归档' }[story],
    )
    console.log(
      JSON.stringify({
        story,
        play: finished.status,
        a11y: a11y.status,
        axe: a11y.result.testEngine.version,
        violations: 0,
        incomplete: a11y.result.incomplete.length,
        state,
      }),
    )
  }
} finally {
  await browser.close()
}
