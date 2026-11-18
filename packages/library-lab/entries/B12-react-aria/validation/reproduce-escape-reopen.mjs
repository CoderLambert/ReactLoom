import { chromium } from '@playwright/test'

const browser = await chromium.launch({ headless: true })
try {
  for (const level of ['basic', 'business']) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 1600 } })
    await page.goto(`http://127.0.0.1:4319/libraries/react-aria?tab=demo&example=${level}`)
    const app = page.getByTestId('b12-workshop')
    await app.waitFor({ state: 'visible' })
    const combo = app.getByRole('combobox', { name: '选择 RSS 频道', exact: true })
    if (level === 'basic') {
      await combo.focus()
      await combo.press('ArrowDown')
      await combo.press('Enter')
      await app.getByRole('button', { name: '提交真实表单', exact: true }).click()
      await combo.fill('React')
    } else await combo.fill('ZZ_NO_MATCH')
    await page.evaluate(() => {
      const input = document.querySelector('[data-testid="b12-workshop"] input[role="combobox"]')
      const output = document.querySelector('[data-testid="b12-state"]')
      const trace = []
      window.__b12EscapeTrace = trace
      const snap = (kind, extra = {}) =>
        trace.push({
          kind,
          expanded: input.getAttribute('aria-expanded'),
          input: input.value,
          state: JSON.parse(output.textContent),
          ...extra,
        })
      const observer = new MutationObserver((records) => {
        for (const record of records)
          snap('mutation', { attribute: record.attributeName, oldValue: record.oldValue })
      })
      observer.observe(input, {
        attributes: true,
        attributeFilter: ['aria-expanded'],
        attributeOldValue: true,
      })
      observer.observe(output, { subtree: true, childList: true, characterData: true })
      input.addEventListener(
        'keydown',
        (event) => {
          if (event.key === 'Escape') {
            snap('native-keydown-capture')
            queueMicrotask(() => snap('after-keydown', { prevented: event.defaultPrevented }))
          }
        },
        true,
      )
      snap('before-Escape')
    })
    await combo.press('Escape')
    await page.waitForTimeout(300)
    console.log(level, JSON.stringify(await page.evaluate(() => window.__b12EscapeTrace)))
    console.log('FINAL', {
      level,
      input: await combo.inputValue(),
      expanded: await combo.getAttribute('aria-expanded'),
      listboxes: await page.getByRole('listbox').count(),
    })
    await page.close()
  }
} finally {
  await browser.close()
}
// Passive native-event/attribute/state observation on an existing build only; not a patched-source PASS.
