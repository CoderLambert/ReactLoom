import {test,expect} from '@playwright/test';

test('Chinese IME composition stays in the input until committed',async({page})=>{
  await page.goto('/');
  const input=page.getByRole('textbox',{name:'搜索工具库'});
  await input.evaluate(element=>element.dispatchEvent(new CompositionEvent('compositionstart',{bubbles:true,data:'图'})));
  await input.fill('图表');
  await page.waitForTimeout(300);
  expect(new URL(page.url()).searchParams.get('q')).toBeFalsy();
  await input.evaluate(element=>element.dispatchEvent(new CompositionEvent('compositionend',{bubbles:true,data:'图表'})));
  await expect.poll(()=>new URL(page.url()).searchParams.get('q')).toBe('图表');
  await expect(input).toHaveValue('图表');
  expect(await page.locator('.library-card').count()).toBeGreaterThan(0);
});

test('search commits preserve existing category and do not create an entry per keystroke',async({page})=>{
  await page.goto('/?group=E&q=');
  const input=page.getByRole('textbox',{name:'搜索工具库'});
  await input.fill('Monaco');
  await expect.poll(()=>new URL(page.url()).searchParams.get('q')).toBe('Monaco');
  expect(new URL(page.url()).searchParams.get('group')).toBe('E');
  await expect(page.locator('.library-card')).toHaveCount(1);
});

test('invalid compact index is rejected and can be retried without requesting the legacy catalogue',async({page})=>{
  let corrupt=true;
  const requested:string[]=[];
  page.on('request',request=>requested.push(new URL(request.url()).pathname));
  await page.route('**/catalog-index.json',route=>corrupt?
    route.fulfill({status:200,contentType:'application/json',body:'{"invalid":true}'}):route.continue());
  await page.goto('/');
  await expect(page.getByRole('alert')).toContainText('目录索引必须为非空、限定长度的数组');
  expect(requested).toContain('/catalog-index.json');
  expect(requested).not.toContain('/catalog.json');
  corrupt=false;
  await page.getByRole('button',{name:'重试',exact:true}).click();
  await expect(page.locator('.library-card')).toHaveCount(119);
  expect(requested.filter(path=>path==='/catalog-index.json')).toHaveLength(2);
});

test('a corrupt per-library detail stays isolated and a retry restores the selected library',async({page})=>{
  let corrupt=true;
  const details:string[]=[];
  page.on('request',request=>{
    const pathname=new URL(request.url()).pathname;
    if(pathname.endsWith('/detail.json'))details.push(pathname);
  });
  await page.route('**/raw/C20/detail.json',route=>corrupt?
    route.fulfill({status:200,contentType:'application/json',body:'{}'}):route.continue());
  await page.goto('/libraries/clsx?tab=docs');
  await expect(page.getByRole('alert')).toContainText('无法加载库详情');
  corrupt=false;
  await page.getByRole('button',{name:'重试读取'}).click();
  await expect(page.getByRole('tab',{name:'详细文档'})).toHaveAttribute('aria-selected','true');
  expect(details).toEqual(['/raw/C20/detail.json','/raw/C20/detail.json']);
});
