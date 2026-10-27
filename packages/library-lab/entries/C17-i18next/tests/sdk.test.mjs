import test from 'node:test';
import assert from 'node:assert/strict';
import {createInstance} from 'i18next';
import {createLatestLanguageSwitcher} from '../examples/language-switch.mjs';

const resources = {
  zh: {common: {greeting: '你好 {{name}}'}, feed: {article_other: '{{count}}条'}},
  en: {common: {greeting: 'Hi {{name}}'}, feed: {article_one: '{{count}} article', article_other: '{{count}} articles', extra: 'English fallback'}},
};
async function instance(lng) {
  const local = createInstance();
  await local.init({lng, fallbackLng: 'en', resources, defaultNS: 'common',
    ns: ['common', 'feed'], initAsync: false, interpolation: {escapeValue: true}});
  return local;
}
test('actual i18next performs interpolation and English plural rules', async () => {
  const client = await instance('en');
  assert.equal(client.t('common:greeting', {name: 'Ada'}), 'Hi Ada');
  assert.equal(client.t('feed:article', {count: 1}), '1 article');
  assert.equal(client.t('feed:article', {count: 2}), '2 articles');
  client.destroy();
});
test('actual i18next provides configured fallback and isolated instances', async () => {
  const zh = await instance('zh');
  const en = await instance('en');
  assert.equal(zh.t('feed:extra'), 'English fallback');
  await zh.changeLanguage('en');
  assert.equal(en.language, 'en');
  await en.changeLanguage('zh');
  assert.equal(zh.language, 'en');
  assert.equal(en.language, 'zh');
  zh.destroy(); en.destroy();
});


test('actual i18next honors latest intent when queued switches serialize', async () => {
  const client = await instance('zh');
  const committed = [];
  let latestCommitted;
  const finished = new Promise(resolve => { latestCommitted = resolve; });
  const switcher = createLatestLanguageSwitcher(
    language => client.changeLanguage(language),
    {onCommit: language => {committed.push(language); latestCommitted();}},
  );
  switcher.request('en');
  switcher.request('zh');
  await finished;
  assert.equal(client.language, 'zh');
  assert.deepEqual(committed, ['zh']);
  switcher.dispose();
  client.destroy();
});
