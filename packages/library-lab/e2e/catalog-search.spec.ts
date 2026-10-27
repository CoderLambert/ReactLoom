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

test('invalid catalogue payload shows a recoverable error rather than rendering corrupt entries',async({page})=>{
  let corrupt=true;
  await page.route('**/catalog.json',route=>corrupt?
    route.fulfill({status:200,contentType:'application/json',body:'{"invalid":true}'}):route.continue());
  await page.goto('/');
  await expect(page.getByRole('alert')).toContainText('受限的条目数组');
  corrupt=false;
  await page.getByRole('button',{name:'重试'}).click();
  await expect(page.locator('.library-card')).toHaveCount(119);
});
