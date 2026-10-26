import {test,expect} from '@playwright/test';
test('catalogue has 119 entries and filters by task',async({page})=>{await page.goto('/');await expect(page.getByRole('link',{name:/C20/})).toBeVisible();await expect(page.locator('.library-card')).toHaveCount(119);await page.getByRole('textbox',{name:'搜索工具库'}).fill('p-limit');await expect(page.locator('.library-card')).toHaveCount(1);});
test('docs deep link loads raw markdown without starting SDK demo',async({page})=>{await page.goto('/libraries/clsx?tab=docs');await expect(page.getByRole('tab',{name:'详细文档'})).toHaveAttribute('aria-selected','true');await expect(page.getByRole('link',{name:'读取 Markdown 原文'})).toBeVisible();await expect(page.getByRole('button',{name:'运行当前示例'})).toHaveCount(0);const response=await page.request.get('/raw/C20/agent.md');expect(response.ok()).toBeTruthy();expect(await response.text()).toContain('C20 clsx');});
test('actual clsx demo changes class state and unmounts on tab change',async({page})=>{await page.goto('/libraries/clsx?tab=demo&example=basic');await page.getByRole('button',{name:'运行当前示例'}).click();await page.getByLabel('选中',{exact:true}).check();await expect(page.getByTestId('class-output')).toContainText('is-selected');await page.getByRole('tab',{name:'Agent 指南'}).click();await expect(page.getByTestId('class-output')).toHaveCount(0);});
test('p-limit can complete and cancel batches',async({page})=>{await page.goto('/libraries/p-limit?tab=demo&example=advanced');await page.getByRole('button',{name:'运行当前示例'}).click();await page.getByRole('button',{name:'运行批处理'}).click();await expect(page.getByText('执行结束：1 个失败',{exact:false})).toBeVisible();await page.getByRole('button',{name:'运行批处理'}).click();await page.getByRole('button',{name:'取消任务'}).click();await expect(page.getByText('已取消：运行中任务中断',{exact:false})).toBeVisible();});

test('source browser downloads only one file at a time and verifies its digest',async({page})=>{
 const sourceRequests:string[]=[];
 page.on('request',request=>{if(request.url().includes('/raw/C20/sources/'))sourceRequests.push(request.url());});
 await page.goto('/libraries/clsx?tab=demo&example=basic');
 const chooser=page.getByRole('combobox',{name:'查看源码文件'});
 await expect(chooser).toBeVisible();
 await expect(page.locator('.source-viewer .hash')).toContainText('已校验');
 expect(sourceRequests).toHaveLength(1);
 const options=await chooser.locator('option').evaluateAll(items=>items.map(item=>(item as HTMLOptionElement).value));
 expect(options.length).toBeGreaterThan(1);
 await chooser.selectOption(options[1]);
 await expect(page.locator('.source-viewer .hash')).toContainText('已校验');
 expect(sourceRequests).toHaveLength(2);
});
