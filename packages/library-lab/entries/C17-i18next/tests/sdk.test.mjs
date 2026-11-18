import assert from 'node:assert/strict'
import test from 'node:test'
import {
  addLocalChannelResources,
  createLocalI18next,
  observeLocalI18next,
  resources,
} from '../examples/i18n-client.mjs'
import { createLatestLanguageSwitcher } from '../examples/language-switch.mjs'

test('actual shared i18next fixture resolves interpolation, escaping and English plural rules', async () => {
  const local = await createLocalI18next()
  assert.equal(local.t('common:welcome', { name: 'Ada' }), '欢迎，Ada！')
  assert.equal(local.t('common:welcome', { name: '<Ada>' }), '欢迎，&lt;Ada&gt;！')
  await local.changeLanguage('en')
  assert.equal(local.t('news:article', { count: 1 }), '1 article')
  assert.equal(local.t('news:article', { count: 2 }), '2 articles')
})
test('actual returnDetails identifies the fallback language and explicit default text', async () => {
  const local = await createLocalI18next()
  const details = local.t('news:editorial', { returnDetails: true })
  assert.equal(details.res, 'Editors pick')
  assert.equal(details.usedLng, 'en')
  assert.equal(details.usedNS, 'news')
  assert.equal(local.t('news:not_found', { defaultValue: '（未配置翻译）' }), '（未配置翻译）')
})
test('actual namespace writes stay within one cloned instance and fixedT pins committed language', async () => {
  const first = await createLocalI18next()
  const second = await createLocalI18next()
  const fixed = first.getFixedT('zh')
  addLocalChannelResources(first)
  assert.equal(first.t('channel:summary'), '本地RSS频道配置')
  assert.equal(second.hasResourceBundle('zh', 'channel'), false)
  assert.equal(Object.hasOwn(resources.zh, 'channel'), false)
  await first.changeLanguage('en')
  assert.equal(first.t('channel:summary'), 'Local RSS channel settings')
  assert.equal(fixed('common:welcome', { name: 'Ada' }), '欢迎，Ada！')
  assert.equal(second.language, 'zh')
})
test('actual i18next and the shared serial queue publish only the latest intent', {
  timeout: 2000,
}, async () => {
  const local = await createLocalI18next()
  const committed = []
  let complete
  const finished = new Promise((resolve) => {
    complete = resolve
  })
  const switcher = createLatestLanguageSwitcher((language) => local.changeLanguage(language), {
    onCommit: (language) => {
      committed.push(language)
      complete()
    },
  })
  try {
    switcher.request('en')
    switcher.request('zh')
    await finished
    assert.equal(local.language, 'zh')
    assert.deepEqual(committed, ['zh'])
  } finally {
    switcher.dispose()
  }
})
test('actual owned event unsubscribe removes only its language/store callbacks', async () => {
  const local = await createLocalI18next()
  const first = { language: 0, resource: 0 }
  let secondLanguage = 0
  const stopFirst = observeLocalI18next(local, {
    onLanguage: () => {
      first.language++
    },
    onResource: () => {
      first.resource++
    },
  })
  const stopSecond = observeLocalI18next(local, {
    onLanguage: () => {
      secondLanguage++
    },
  })
  try {
    await local.changeLanguage('en')
    addLocalChannelResources(local)
    assert.deepEqual(first, { language: 1, resource: 2 })
    assert.equal(secondLanguage, 1)
    stopFirst()
    stopFirst()
    await local.changeLanguage('zh')
    local.addResource('zh', 'news', 'section', '本地更新')
    assert.deepEqual(first, { language: 1, resource: 2 })
    assert.equal(secondLanguage, 2)
    stopSecond()
    await local.changeLanguage('en')
    assert.equal(secondLanguage, 2)
  } finally {
    stopFirst()
    stopSecond()
  }
})
