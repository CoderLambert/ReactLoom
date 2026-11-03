import {test, expect, type Page} from '@playwright/test';

// End-to-end gates mount actual entry components through the production Lab app.
// No page.route mocks, SDK stubs or forced verification.json PASS values.
async function start(page: Page, slug: string, level: 'basic'|'business'|'advanced') {
  await page.goto(`/libraries/${slug}?tab=demo&example=${level}`);
  await page.getByRole('button', {name: '运行当前示例'}).click();
}

test('@A01 real chart pauses for reduced motion and unmounts its DOM', async ({page}) => {
  await page.emulateMedia({reducedMotion: 'reduce'});
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await start(page, 'echarts', 'advanced');
  const chart = page.getByRole('img', {name: /七天阅读趋势交互图表/u});
  await expect(chart.locator('canvas')).toHaveCount(1);
  const region = page.getByRole('region', {name: 'Apache ECharts 真实图表'});
  await region.getByRole('button', {name: '启动增量更新'}).click();
  await expect(region).toContainText('已暂停（页面隐藏、离屏或减少动态）');
  await page.waitForTimeout(1400);
  await expect(region).toContainText('增量更新次数：0/');
  await region.getByRole('checkbox', {name: /允许动态演示/u}).check();
  await expect(region).toContainText(/增量更新次数：[1-9]/u, {timeout: 10_000});
  await page.getByRole('tab', {name: 'Agent 指南'}).click();
  await expect(chart).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('@B17 actual floating dialog returns focus and protects the IME composition boundary', async ({page}) => {
  await start(page, 'floating-ui', 'advanced');
  const trigger = page.getByRole('button', {name: /编辑过滤条件/u});
  await trigger.click();
  const dialog = page.getByRole('dialog', {name: '过滤条件'});
  const input = dialog.getByRole('textbox', {name: '筛选关键词'});
  await input.fill('React');
  await input.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();

  await trigger.click();
  await input.fill('React');
  await input.evaluate(element => {
    element.dispatchEvent(new CompositionEvent('compositionstart', {bubbles: true}));
    const event = new KeyboardEvent('keydown', {
      bubbles: true, cancelable: true, key: 'Enter', isComposing: true,
    });
    Object.defineProperty(event, 'keyCode', {value: 229});
    element.dispatchEvent(event);
  });
  await expect(dialog).toBeVisible();
  await expect(page.getByText('已应用过滤：React')).toHaveCount(0);
  await input.dispatchEvent('compositionend');
  await dialog.getByRole('button', {name: '应用过滤'}).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole('region', {name: 'Floating UI 真实交互示例'}).getByRole('status'))
    .toContainText('已应用过滤：React');
  await page.getByRole('tab', {name: '详细文档'}).click();
  await expect(page.getByRole('dialog', {name: '过滤条件'})).toHaveCount(0);
});

test('@C01 real RHF field-array submission and reset preserve default values', async ({page}) => {
  await start(page, 'react-hook-form', 'business');
  const region = page.getByRole('region', {name: 'React Hook Form 实际 SDK 示例'});
  await region.getByRole('button', {name: '新增 RSS 来源'}).click();
  await expect(region.getByRole('group')).toHaveCount(2);
  await region.getByRole('textbox', {name: '来源 2 URL'}).fill('https://example.com/second.xml');
  await region.getByRole('button', {name: '验证并预览'}).click();
  await expect(region.getByText('通过校验的本地数据')).toBeVisible();
  await expect(region.locator('output')).toContainText('second.xml');
  await region.getByRole('button', {name: '重置表单'}).click();
  await expect(region.getByRole('group')).toHaveCount(1);
  await expect(region.getByRole('textbox', {name: '来源 1 URL'})).toHaveValue('https://example.com/rss.xml');
  await expect(region.locator('output')).toHaveCount(0);
});

test('@D03 real p-limit demo unmounts and restarts with fresh batch state', async ({page}) => {
  await start(page, 'p-limit', 'advanced');
  const region = page.getByRole('region', {name: 'p-limit 真实并发调度'});
  await region.getByRole('button', {name: '运行批处理'}).click();
  await expect(region.getByText('正在执行真实 p-limit 批次')).toBeVisible();
  await page.getByRole('button', {name: '停止并卸载'}).click();
  await expect(region).toHaveCount(0);
  await page.getByRole('button', {name: '运行当前示例'}).click();
  await expect(page.getByRole('region', {name: 'p-limit 真实并发调度'}))
    .toContainText('尚未运行');
});

test('@E05 real Monaco editor creates a language worker and releases its environment lease', async ({page}) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await start(page, 'monaco-editor', 'advanced');
  const root = page.getByTestId('monaco-editor-root');
  await expect(root.locator('.monaco-editor')).toBeVisible({timeout: 20_000});
  await expect.poll(() => page.workers().length, {timeout: 20_000}).toBeGreaterThan(0);
  await expect(page.getByText(/编辑器已创建；Worker/u)).toBeVisible();
  await page.getByRole('tab', {name: 'Agent 指南'}).click();
  await expect(root).toHaveCount(0);
  await expect.poll(() => page.evaluate(() =>
    (globalThis as typeof globalThis & {MonacoEnvironment?: unknown}).MonacoEnvironment === undefined
  )).toBe(true);
  expect(errors).toEqual([]);
});
