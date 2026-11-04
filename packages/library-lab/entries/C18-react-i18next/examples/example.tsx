import {useEffect, useMemo, useState} from 'react';
import {createInstance, type i18n} from 'i18next';
import {I18nextProvider, Trans, useTranslation} from 'react-i18next';
import {createLatestLanguageSwitcher} from './language-switch.mjs';

type Language = 'zh' | 'en';
type Level = 'basic' | 'business' | 'advanced';

const resources = {
  zh: {
    common: {title: '订阅偏好', greeting: '你好，{{name}}', legal: '请阅读<strong>隐私说明</strong>。'},
    feed: {unread_other: '未读 {{count}} 条', label: '关注的频道'},
  },
  en: {
    common: {title: 'Subscription preferences', greeting: 'Hello, {{name}}',
      legal: 'Read the <strong>privacy notice</strong>.'},
    feed: {unread_one: '{{count}} unread story', unread_other: '{{count}} unread stories',
      label: 'Followed feeds'},
  },
};

function LocalizedPanel({level, scope}: {level: Level; scope: string}) {
  const {t, i18n} = useTranslation(['common', 'feed'], {useSuspense: false});
  const [count, setCount] = useState(2);
  const [name, setName] = useState('Lambert');
  const [error, setError] = useState('');
  // A provider owns one serialized queue, never overlapping changeLanguage promises.
  const switcher = useMemo(() => createLatestLanguageSwitcher(
    next => i18n.changeLanguage(next),
    {onCommit: () => setError(''), onError: cause => setError('切换失败：' + String(cause))},
  ), [i18n]);
  useEffect(() => () => switcher.dispose(), [switcher]);
  function changeLanguage(next: Language) {
    setError('');
    switcher.request(next);
  }
  return <article className="demo-card" aria-label={scope + '翻译面板'}>
    <h3>{scope} · {t('common:title')}</h3>
    <div className="demo-controls">
      <label>语言 <select aria-label={scope + '语言'} value={i18n.language}
        onChange={event => void changeLanguage(event.target.value as Language)}>
        <option value="zh">中文</option><option value="en">English</option>
      </select></label>
      <label>未读数量 <input aria-label={scope + '未读数量'} type="number"
        min="0" max="99" value={count}
        onChange={event => setCount(Math.max(0, Math.min(99, Number(event.target.value) || 0)))} /></label>
    </div>
    {level !== 'basic' && <label>用户昵称 <input aria-label={scope + '用户昵称'}
      value={name} onChange={event => setName(event.target.value)} /></label>}
    <div className="demo-output" data-testid={'react-i18next-' + scope}>
      <p>{t('common:greeting', {name})}</p>
      <p>{t('feed:label')} · {t('feed:unread', {count})}</p>
      {level !== 'basic' && <p><Trans i18nKey="legal" ns="common"
        components={{strong: <strong />}} /></p>}
      {level === 'advanced' && <p>缺省回退：{t('feed:absent', {defaultValue: '（等待本地化）'})}</p>}
    </div>
    {error && <p role="alert">{error}</p>}
  </article>;
}

function ScopedTranslation({level, scope, initial}: {
  level: Level; scope: string; initial: Language;
}) {
  const [instance, setInstance] = useState<i18n | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let alive = true;
    const local = createInstance();
    void local.init({
      lng: initial, fallbackLng: 'en', ns: ['common', 'feed'],
      defaultNS: 'common', resources, initAsync: false,
      interpolation: {escapeValue: true},
    }).then(() => {if (alive) setInstance(local);})
      .catch(cause => {if (alive) setError(String(cause));});
    // Each provider owns its instance; the panel separately disposes its language queue.
    return () => {alive = false; local.off('languageChanged');};
  }, [initial]);
  if (!instance) return <p role={error ? 'alert' : 'status'}>{error || '加载独立语言资源…'}</p>;
  return <I18nextProvider i18n={instance} defaultNS="common">
    <LocalizedPanel level={level} scope={scope} />
  </I18nextProvider>;
}

export default function ReactI18nextWorkshop({level}: {level: Level}) {
  return <section aria-label="react-i18next 实际绑定教学">
    <h2>{level === 'basic' ? 'useTranslation 与动态语言' :
      level === 'business' ? '多命名空间与 Trans 富文本' : '两个隔离的语言 Provider'}</h2>
    <p>每个 Provider 显式绑定私有 i18next 实例。第三方 Markdown/HTML 不会作为翻译结果直接执行。</p>
    <ScopedTranslation level={level} scope="工作区 A" initial="zh" />
    {level === 'advanced' && <>
      <p>切换工作区 A 的语言不会改变工作区 B。</p>
      <ScopedTranslation level={level} scope="工作区 B" initial="en" />
    </>}
  </section>;
}

