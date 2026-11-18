import { chromium } from '@playwright/test'

const browser = await chromium.launch({ headless: true })
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 1600 } })
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('http://127.0.0.1:4319/libraries/react-aria?tab=demo&example=advanced')
  const app = page.getByTestId('b12-workshop')
  await app.waitFor({ state: 'visible' })
  const combo = app.getByRole('combobox', { name: '选择 RSS 频道', exact: true })
  const state = async () => JSON.parse(await app.getByTestId('b12-state').textContent())
  await combo.fill('开源')
  await page.waitForFunction(
    () =>
      JSON.parse(document.querySelector('[data-testid="b12-state"]').textContent).query
        .resolvedQuery === '开源',
  )
  await combo.press('ArrowDown')
  await combo.press('Enter')
  await page.waitForFunction(
    () =>
      JSON.parse(document.querySelector('[data-testid="b12-state"]').textContent).query
        .resolvedQuery === '开源趋势',
  )
  console.log('SELECTED', JSON.stringify(await state()))
  await app.getByRole('button', { name: '提交真实表单', exact: true }).click()
  console.log('FORM', await app.getByTestId('b12-submit-status').textContent())
  await page.setViewportSize({ width: 390, height: 844 })
  await combo.fill('React')
  console.log('AFTER_FILL', JSON.stringify(await state()))
  await page.waitForTimeout(500)
  const final = await state()
  console.log(
    'AFTER_QUERY',
    JSON.stringify(final),
    'MESSAGE',
    await app.getByTestId('b12-submit-status').textContent(),
    'PAGE_ERRORS',
    errors,
  )
  if (final.inputValue === '' && final.query.resolvedQuery === '')
    console.log('REPRODUCED_OLD_DIST_DEFECT: new typed query erased by null selection callback')
  else
    console.log(
      'OBSERVATION_ONLY: this probe did not reproduce the erase; inspect the actual sequence before drawing a conclusion',
    )
} finally {
  await browser.close()
}
