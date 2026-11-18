import { createInstance } from 'i18next'

// Authored local dictionaries, not machine translation or downloaded resources.
export const resources = {
  zh: {
    common: { welcome: '欢迎，{{name}}！', title: '阅读设置' },
    news: { article_other: '共 {{count}} 条文章', section: '技术', refresh: '更新频道' },
  },
  en: {
    common: { welcome: 'Welcome, {{name}}!', title: 'Reading settings' },
    news: {
      article_one: '{{count}} article',
      article_other: '{{count}} articles',
      section: 'Technology',
      refresh: 'Refresh feeds',
      editorial: 'Editors pick',
    },
  },
}
const channelResources = {
  zh: { summary: '本地RSS频道配置' },
  en: { summary: 'Local RSS channel settings' },
}
export async function createLocalI18next() {
  const local = createInstance()
  await local.init({
    lng: 'zh',
    fallbackLng: 'en',
    supportedLngs: ['zh', 'en'],
    defaultNS: 'common',
    ns: ['common', 'news'],
    resources: structuredClone(resources),
    initAsync: false,
    interpolation: { escapeValue: true },
  })
  return local
}
export function addLocalChannelResources(local) {
  for (const language of ['zh', 'en'])
    local.addResourceBundle(
      language,
      'channel',
      structuredClone(channelResources[language]),
      true,
      true,
    )
}
export function observeLocalI18next(local, { onLanguage = () => {}, onResource = () => {} } = {}) {
  const languageListener = (language) => onLanguage(language)
  const resourceListener = (language, namespace) => onResource(language, namespace)
  local.on('languageChanged', languageListener)
  local.store.on('added', resourceListener)
  let active = true
  return () => {
    if (!active) return
    active = false
    local.off('languageChanged', languageListener)
    local.store.off('added', resourceListener)
  }
}
