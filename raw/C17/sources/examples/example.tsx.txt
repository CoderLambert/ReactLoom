import type { i18n } from 'i18next'
import { useEffect, useRef, useState } from 'react'
import {
  addLocalChannelResources,
  createLocalI18next,
  observeLocalI18next,
} from './i18n-client.mjs'
import { createLatestLanguageSwitcher, type Language } from './language-switch.mjs'
import './styles.css'

export { createLocalI18next, resources } from './i18n-client.mjs'

type Level = 'basic' | 'business' | 'advanced'
type Events = {
  sdkLanguageChanged: number
  sdkResourceAdded: number
  uiCommits: number
  lastLanguage: string | null
  lastResource: string | null
}
export default function I18nextWorkshop({ level }: { level: Level }) {
  const [generation, setGeneration] = useState(0)
  return (
    <I18nextSession
      key={`${level}:${generation}`}
      level={level}
      generation={generation}
      reset={() => setGeneration((value) => value + 1)}
    />
  )
}
function I18nextSession({
  level,
  generation,
  reset,
}: {
  level: Level
  generation: number
  reset: () => void
}) {
  const [instance, setInstance] = useState<i18n | null>(null)
  const [language, setLanguage] = useState<Language>('zh')
  const [requested, setRequested] = useState<Language>('zh')
  const [name, setName] = useState('开发者')
  const [count, setCount] = useState(2)
  const [notice, setNotice] = useState('')
  const [status, setStatus] = useState('正在初始化独立语言实例…')
  const [pending, setPending] = useState(false)
  const [events, setEvents] = useState<Events>({
    sdkLanguageChanged: 0,
    sdkResourceAdded: 0,
    uiCommits: 0,
    lastLanguage: null,
    lastResource: null,
  })
  const switcher = useRef<ReturnType<typeof createLatestLanguageSwitcher> | null>(null)
  useEffect(() => {
    let alive = true
    let stopObserving = () => {}
    let ownedSwitcher: ReturnType<typeof createLatestLanguageSwitcher> | null = null
    void createLocalI18next()
      .then((local) => {
        if (!alive) return // No backend handles or application subscriptions were created yet.
        stopObserving = observeLocalI18next(local, {
          onLanguage: (value) => {
            if (alive)
              setEvents((old) => ({
                ...old,
                sdkLanguageChanged: old.sdkLanguageChanged + 1,
                lastLanguage: value,
              }))
          },
          onResource: (lng, ns) => {
            if (alive)
              setEvents((old) => ({
                ...old,
                sdkResourceAdded: old.sdkResourceAdded + 1,
                lastResource: `${lng}:${ns}`,
              }))
          },
        })
        ownedSwitcher = createLatestLanguageSwitcher((next) => local.changeLanguage(next), {
          onCommit: (next) => {
            if (!alive) return
            setLanguage(next)
            setPending(false)
            setNotice('')
            setStatus(`已提交语言 ${next}`)
            setEvents((old) => ({ ...old, uiCommits: old.uiCommits + 1 }))
          },
          onError: (error) => {
            if (alive) {
              setPending(false)
              setNotice(`切换失败：${String(error)}`)
              setStatus('最新请求失败，仍保留上次提交的语言')
            }
          },
        })
        switcher.current = ownedSwitcher
        setInstance(local)
        setStatus('独立实例已就绪；词条全部为本地fixture')
      })
      .catch((error) => {
        if (alive) {
          setNotice(String(error))
          setStatus('初始化失败')
        }
      })
    return () => {
      alive = false
      ownedSwitcher?.dispose()
      if (switcher.current === ownedSwitcher) switcher.current = null
      stopObserving() // Detach only callbacks registered by this owner, not SDK/other listeners.
    }
  }, [])
  function request(next: Language) {
    setRequested(next)
    setPending(true)
    setNotice('')
    setStatus(`请求语言 ${next}；等待队列最新提交`)
    switcher.current?.request(next)
  }
  const t = instance?.getFixedT(language)
  const fallback = instance?.t('news:editorial', { lng: language, returnDetails: true })
  const channelReady = Boolean(instance?.hasResourceBundle(language, 'channel'))
  return (
    <section
      aria-label="i18next 核心 SDK 教学"
      className="c17-workshop"
      data-testid="c17-workshop"
      data-level={level}
      data-generation={generation}
      data-ready={String(Boolean(instance))}
      data-language={language}
    >
      <h2>
        {level === 'basic'
          ? '语言切换、插值与数量复数'
          : level === 'business'
            ? '本地命名空间与资源事件'
            : '回退细节、最新意图与实例边界'}
      </h2>
      <p>所有词条来自人工编写的本地双语fixture，不会调用机器翻译、网络后端或语言探测器。</p>
      {instance && t && (
        <>
          <div className="c17-controls">
            <label>
              语言{' '}
              <select
                aria-label="语言"
                value={requested}
                onChange={(event) => request(event.target.value as Language)}
              >
                <option value="zh">中文</option>
                <option value="en">English</option>
              </select>
            </label>
            <label>
              昵称{' '}
              <input
                aria-label="昵称"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </label>
            <label>
              数量{' '}
              <input
                aria-label="文章数量"
                type="number"
                min="0"
                max="99"
                value={count}
                onChange={(event) =>
                  setCount(Math.max(0, Math.min(99, Number(event.target.value) || 0)))
                }
              />
            </label>
            <button type="button" onClick={reset}>
              重置当前实例
            </button>
          </div>
          {level === 'business' && (
            <div className="c17-controls">
              <button
                type="button"
                disabled={channelReady || pending}
                onClick={() => {
                  addLocalChannelResources(instance)
                  setStatus('已用真实addResourceBundle加入双语channel fixture，无网络加载')
                }}
              >
                加入本地channel词典
              </button>
            </div>
          )}
          {level === 'advanced' && (
            <div className="c17-controls">
              <button
                type="button"
                onClick={() => {
                  request('en')
                  request('zh')
                }}
              >
                快速请求 EN→ZH
              </button>
              <button
                type="button"
                onClick={() => {
                  request('zh')
                  request('en')
                }}
              >
                快速请求 ZH→EN
              </button>
            </div>
          )}
          <div className="c17-output" data-testid="i18next-output" lang={language}>
            <p data-testid="c17-welcome">{t('common:welcome', { name })}</p>
            <p data-testid="c17-plural">{t('news:article', { count })}</p>
            {level !== 'basic' && (
              <p>
                {t('news:section')} · {t('news:refresh')}
              </p>
            )}
            {level === 'business' && (
              <p data-testid="c17-channel">
                {t('channel:summary', { defaultValue: '尚未添加本地channel词典' })}
              </p>
            )}
            {level === 'advanced' && (
              <>
                <p>
                  中文缺词的回退：
                  <span data-testid="c17-editorial" lang={fallback?.usedLng}>
                    {fallback?.res}
                  </span>
                </p>
                <p data-testid="c17-missing">
                  {t('news:not_found', { defaultValue: '（未配置翻译）' })}
                </p>
                <pre data-testid="c17-fallback">{JSON.stringify(fallback, null, 2)}</pre>
              </>
            )}
          </div>
          <output className="c17-observation" data-testid="c17-language">
            {JSON.stringify({
              requested,
              committed: language,
              sdkObserved: instance.language,
              pending,
            })}
          </output>
          <output className="c17-observation" data-testid="c17-events">
            {JSON.stringify(events)}
          </output>
          {level === 'business' && (
            <output className="c17-observation" data-testid="c17-resource">
              {JSON.stringify({ namespace: 'channel', language, hasBundle: channelReady })}
            </output>
          )}
        </>
      )}
      <p role="status" data-testid="c17-status">
        {status}
      </p>
      {notice && <p role="alert">{notice}</p>}
      <p>
        渲染时用已提交语言的getFixedT，SDK中间languageChanged不会把待提交语言偷换进文本。事件计数是实际SDK回调，提交计数是应用队列观察。
      </p>
    </section>
  )
}
