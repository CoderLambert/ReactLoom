import {test, expect} from '@playwright/test'
import {basicPage} from './fixtures'

test('basic: accessible locator and observable save state', async ({page}) => {
  await page.setContent(basicPage)
  await expect(page.getByRole('heading', {name: '任务编辑'})).toBeVisible()
  await page.getByRole('button', {name: '保存'}).click()
  await expect(page.getByRole('status')).toContainText('请输入标题')
  await page.getByRole('textbox', {name: '标题'}).fill('本地新闻摘要')
  await page.getByRole('button', {name: '保存'}).click()
  await expect(page.getByRole('status')).toHaveText('保存完成')
})
