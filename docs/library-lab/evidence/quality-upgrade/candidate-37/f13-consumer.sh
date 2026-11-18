set -eu
lab="$PWD/packages/library-lab"
consumer=$(mktemp -d /tmp/reactloom-f13-consumer.XXXXXX)
trap 'rm -rf -- "$consumer"' EXIT
cp "$lab"/entries/F13-playwright/examples/{fixtures.ts,playwright.config.ts,basic.spec.ts,business.spec.ts,advanced.spec.ts} "$consumer"
cat > "$consumer/independent.spec.ts" <<'TS'
import { expect, test } from '@playwright/test'
import { subscriptionPage } from './fixtures'
test('new subscriber input becomes the exact intercepted query', async ({ page }) => {
  let value = ''
  await page.route('https://api.lab.invalid/subscribe?**', async (route) => {
    value = new URL(route.request().url()).searchParams.get('email') ?? ''
    await route.fulfill({ status: 201, json: { ok: true } })
  })
  await page.setContent(subscriptionPage)
  await page.getByRole('textbox', { name: '邮箱' }).fill('orion+new@example.invalid')
  const submit = page.getByRole('button', { name: '提交订阅' })
  await submit.click()
  await expect(page.getByRole('status')).toHaveText('订阅成功')
  await expect(submit).toBeEnabled()
  expect(value).toBe('orion+new@example.invalid')
})
TS
ln -s "$lab/node_modules" "$consumer/node_modules"
cd "$lab"
printf 'cwd=%s consumer=%s\n' "$PWD" "$consumer"
pnpm exec playwright --version
pnpm exec playwright test --config="$consumer/playwright.config.ts" independent.spec.ts
