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

test('documentation headings expose stable shareable fragments',async({page})=>{
 await page.goto('/libraries/clsx?tab=docs');
 const toc=page.getByRole('navigation',{name:'当前文档目录'});
 await toc.getByRole('link',{name:'用在哪里'}).click();
 await expect(page).toHaveURL(/#用在哪里$/u);
 await expect(page.locator('h2#用在哪里')).toBeVisible();
});
test('Node-CI Vitest recipe shows reproducible command instead of fake shell',async({page})=>{
 await page.goto('/libraries/vitest?tab=demo&example=basic');
 await expect(page.getByText('pnpm exec vitest run entries/F12-vitest/examples/basic.test.ts')).toBeVisible();
 await expect(page.getByRole('button',{name:'运行当前示例'})).toHaveCount(0);
});


test('verification detail distinguishes SDK, build and browser outcomes',async({page})=>{
 await page.goto('/libraries/clsx?tab=docs');
 await expect(page.getByLabel('分项验证状态')).toBeVisible();
 await page.getByText('查看实际验证命令、证据与阻塞原因').click();
 await expect(page.getByText('目录收录、示例存在、Node 平台测试与真实第三方 SDK 验证必须分开判断。',{exact:false})).toBeVisible();
 await expect(page.getByText('当前源码与依赖指纹：',{exact:false})).toBeVisible();
});

test('Playwright workshop displays the real standalone CLI command and never runs a browser via UI',async({page})=>{
 await page.goto('/libraries/playwright?tab=demo&example=basic');
 await expect(page.getByText('pnpm exec playwright test --config=entries/F13-playwright/examples/playwright.config.ts entries/F13-playwright/examples/basic.spec.ts')).toBeVisible();
 await expect(page.getByRole('button',{name:'运行当前示例'})).toHaveCount(0);
});


test('mobile category picker remains keyboard-usable when the desktop sidebar is hidden',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.goto('/');
 const group=page.getByRole('combobox',{name:'选择领域分类'});
 await expect(group).toBeVisible();
 await group.selectOption('E');
 await expect(page.locator('.library-card')).toHaveCount(19);
 await page.getByRole('textbox',{name:'搜索工具库'}).fill('Monaco');
 await expect(page.locator('.library-card')).toHaveCount(1);
 await expect(page.getByRole('link',{name:/E05/})).toBeVisible();
});

test('manual tab activation preserves keyboard focus without loading other tabs',async({page})=>{
 await page.goto('/libraries/clsx?tab=docs');
 const docs=page.getByRole('tab',{name:'详细文档'});
 const agent=page.getByRole('tab',{name:'Agent 指南'});
 await docs.focus();
 await page.keyboard.press('ArrowRight');
 await expect(agent).toBeFocused();
 await expect(agent).toHaveAttribute('aria-selected','false');
 await page.keyboard.press('Enter');
 await expect(agent).toHaveAttribute('aria-selected','true');
 await expect(page).toHaveURL(/tab=agent/u);
 await expect(page.getByRole('button',{name:'运行当前示例'})).toHaveCount(0);
});

test('reading Monaco docs does not fetch its interactive editor runtime',async({page})=>{
 const heavyRequests:string[]=[];
 page.on('request',request=>{
  if(/\/(?:assets|node_modules)\/[^?]*(?:monaco-editor|echarts)/iu.test(request.url()))heavyRequests.push(request.url());
 });
 await page.goto('/libraries/monaco-editor?tab=docs');
 await expect(page.getByRole('tab',{name:'详细文档'})).toHaveAttribute('aria-selected','true');
 await expect(page.getByRole('link',{name:'读取 Markdown 原文'})).toBeVisible();
 expect(heavyRequests).toEqual([]);
});
