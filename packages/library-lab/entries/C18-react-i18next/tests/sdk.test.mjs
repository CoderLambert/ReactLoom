import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {createInstance} from 'i18next';
import {I18nextProvider, useTranslation, Trans} from 'react-i18next';

const resources = {
  zh: {common: {greeting: '你好', legal: '阅读<strong>说明</strong>'}},
  en: {common: {greeting: 'Hello', legal: 'Read <strong>notice</strong>'}},
};
function Greeting() {
  const {t} = useTranslation('common', {useSuspense: false});
  return React.createElement('span', null, t('greeting'));
}
async function local(lng) {
  const i18n = createInstance();
  await i18n.init({lng, fallbackLng:'en', defaultNS:'common', ns:['common'],
    resources, initAsync:false});
  return i18n;
}
test('actual React provider creates separate localized SSR trees', async () => {
  const zh = await local('zh'), en = await local('en');
  const render = i18n => renderToStaticMarkup(React.createElement(I18nextProvider,
    {i18n}, React.createElement(Greeting)));
  assert.match(render(zh), /你好/);
  assert.match(render(en), /Hello/);
  await zh.changeLanguage('en');
  await en.changeLanguage('zh');
  assert.match(render(zh), /Hello/);
  assert.match(render(en), /你好/);
  zh.destroy(); en.destroy();
});
test('actual Trans uses a React element instead of raw HTML insertion', async () => {
  const i18n = await local('en');
  const markup = renderToStaticMarkup(React.createElement(I18nextProvider,{i18n},
    React.createElement(Trans,{ns:'common',i18nKey:'legal',components:{strong:React.createElement('strong')}})));
  assert.match(markup, /<strong>notice<\/strong>/);
  i18n.destroy();
});

