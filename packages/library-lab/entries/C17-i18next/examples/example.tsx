import {useEffect, useRef, useState} from 'react';
import {createInstance, type i18n} from 'i18next';

type Level = 'basic' | 'business' | 'advanced';
type Language = 'zh' | 'en';

export const resources = {
  zh: {
    common: {welcome: '欢迎，{{name}}！', title: '阅读设置'},
    news: {article_other: '共 {{count}} 条文章', section: '技术', refresh: '更新频道'},
  },
  en: {
    common: {welcome: 'Welcome, {{name}}!', title: 'Reading settings'},
    news: {article_one: '{{count}} article', article_other: '{{count}} articles',
      section: 'Technology', refresh: 'Refresh feeds', editorial: 'Editors pick'},
  },
};

export async function createLocalI18next() {
  const instance = createInstance();
  // Each demo owns an instance; never mutate the app-wide singleton.
  await instance.init({
    lng: 'zh', fallbackLng: 'en', supportedLngs: ['zh', 'en'],
    defaultNS: 'common', ns: ['common', 'news'], resources,
    initAsync: false, interpolation: {escapeValue: true},
  });
  return instance;
}

export default function I18nextWorkshop({level}: {level: Level}) {
  const [instance, setInstance] = useState<i18n | null>(null);
  const [language, setLanguage] = useState<Language>('zh');
  const [name, setName] = useState('开发者');
  const [count, setCount] = useState(2);
  const [notice, setNotice] = useState('');
  const request = useRef(0);

  useEffect(() => {
    let alive = true;
    let owned: i18n | null = null;
    void createLocalI18next().then(local => {
      if (!alive) {local.destroy(); return;}
      owned = local;
      setInstance(local);
    }).catch(error => {if (alive) setNotice(String(error));});
    return () => {alive = false; request.current++; owned?.destroy();};
  }, []);

  async function switchLanguage(next: Language) {
    if (!instance) return;
    const id = ++request.current;
    try {
      await instance.changeLanguage(next);
      if (request.current === id) setLanguage(next);
    } catch (error) {
      if (request.current === id) setNotice('切换失败：' + String(error));
    }
  }

  if (!instance) return <p role="status">{notice || '正在初始化独立语言实例…'}</p>;
  return <section aria-label="i18next 核心 SDK 教学">
    <h2>{level === 'basic' ? '语言切换与插值' :
      level === 'business' ? '多命名空间新闻频道' : '缺失翻译与回退边界'}</h2>
    <p>当前语言：<strong>{language}</strong>。所有翻译来自内嵌本地词条，不会请求翻译服务。</p>
    <div className="demo-controls">
      <label>语言 <select aria-label="语言" value={language}
        onChange={event => void switchLanguage(event.target.value as Language)}>
        <option value="zh">中文</option><option value="en">English</option>
      </select></label>
      <label>昵称 <input aria-label="昵称" value={name}
        onChange={event => setName(event.target.value)} /></label>
      <label>数量 <input aria-label="文章数量" type="number" min="0" max="99"
        value={count} onChange={event => setCount(Math.max(0, Math.min(99, Number(event.target.value) || 0)))} /></label>
    </div>
    <div className="demo-output" data-testid="i18next-output">
      <p>{instance.t('common:welcome', {name})}</p>
      <p>{instance.t('news:article', {count})}</p>
      {level !== 'basic' && <p>{instance.t('news:section')} · {instance.t('news:refresh')}</p>}
      {level === 'advanced' && <>
        <p>中文词条缺失时回退到英语：{instance.t('news:editorial')}</p>
        <p>未知键的明确缺省文案：{instance.t('news:not_found', {defaultValue: '（未配置翻译）'})}</p>
      </>}
    </div>
    {notice && <p role="alert">{notice}</p>}
    <p>不要在模块顶层提前执行翻译函数并缓存结果；应在语言变更后重新渲染。</p>
  </section>;
}

