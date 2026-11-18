import { createInstance } from 'i18next'
import { createLatestLanguageSwitcher } from './language-switch.mjs'

export const resources = {
  zh: {
    common: {
      title: '订阅偏好',
      greeting: '你好，{{name}}',
      legal: '请阅读<strong>隐私说明</strong>。',
    },
    feed: { unread_other: '未读 {{count}} 条', label: '关注的频道' },
  },
  en: {
    common: {
      title: 'Subscription preferences',
      greeting: 'Hello, {{name}}',
      legal: 'Read the <strong>privacy notice</strong>.',
    },
    feed: {
      unread_one: '{{count}} unread story',
      unread_other: '{{count}} unread stories',
      label: 'Followed feeds',
    },
  },
}

export const isLanguage = (value) => value === 'zh' || value === 'en'

// One stable original instance owns its queue, exact observer and optional local promise gate.
export function createWorkspace(initial, notify = () => {}) {
  if (!isLanguage(initial)) throw new Error('只支持 zh / en')
  const instance = createInstance()
  let active = true
  let ready = false
  let manual = false
  let held = null
  let requested = initial
  let committed = initial
  let activeTarget = null
  let error = ''
  let events = 0
  let status = 'initializing'
  const snapshot = () => ({
    ready,
    manual,
    requested,
    committed,
    actual: instance.language || initial,
    activeTarget,
    awaitingRelease: held !== null,
    error,
    events,
    status,
  })
  const publish = () => {
    if (active) notify(snapshot())
  }
  const onLanguageChanged = () => {
    events += 1
    publish()
  }
  instance.on('languageChanged', onLanguageChanged)
  const switcher = createLatestLanguageSwitcher(
    async (language) => {
      activeTarget = language
      if (manual) {
        await new Promise((resolve, reject) => {
          held = { resolve, reject }
          publish()
        })
      }
      if (!active) throw new Error('workspace disposed')
      await instance.changeLanguage(language)
    },
    {
      onCommit: (language) => {
        committed = language
        activeTarget = null
        status = 'ready'
        error = ''
        publish()
      },
      onError: (cause) => {
        activeTarget = null
        status = 'error'
        error = '切换失败：' + String(cause instanceof Error ? cause.message : cause)
        publish()
      },
    },
  )
  function release() {
    if (!active || !held) return
    const pending = held
    held = null
    publish()
    pending.resolve()
  }
  return {
    instance,
    snapshot,
    async start() {
      try {
        await instance.init({
          lng: initial,
          fallbackLng: 'en',
          supportedLngs: ['zh', 'en'],
          ns: ['common', 'feed'],
          defaultNS: 'common',
          resources: structuredClone(resources),
          initAsync: false,
          // React text escapes output. These source-owned resources are not CMS HTML.
          interpolation: { escapeValue: false },
          react: {
            useSuspense: false,
            transSupportBasicHtmlNodes: false,
            transKeepBasicHtmlNodesFor: [],
          },
        })
        if (active) {
          ready = true
          status = 'ready'
          publish()
        }
      } catch (cause) {
        if (active) {
          status = 'error'
          error = String(cause)
          publish()
        }
      }
    },
    request(language) {
      if (!active || !ready || !isLanguage(language)) return
      requested = language
      error = ''
      status = 'switching'
      publish()
      switcher.request(language)
    },
    setManual(enabled) {
      if (!active) return
      manual = Boolean(enabled)
      if (!manual && held) release()
      publish()
    },
    release,
    reject() {
      if (!active || !held) return
      const pending = held
      held = null
      publish()
      pending.reject(new Error('本地 fixture 拒绝，不是网络或 SDK 服务失败'))
    },
    dispose() {
      if (!active) return
      active = false
      switcher.dispose()
      instance.off('languageChanged', onLanguageChanged)
      if (held) {
        held.reject(new Error('workspace disposed'))
        held = null
      }
      // i18next has no public abort for an already-started changeLanguage.
      // It may finish on this discarded private instance; no later request or UI callback runs.
    },
  }
}
