# C18 react-i18next — 工程手册

## 适用

让 React 树订阅某份 i18next 实例，并用白名单组件渲染少量富文本。无 UI 的翻译用 C17。`Trans` 不是通用 HTML 渲染器。

## 版本

`react-i18next@17.0.16` 与 `i18next@26.4.3`，MIT。`useTranslation(..., { useSuspense: false })`。每个工作区 `createInstance` 后包进 `I18nextProvider`。

## 迁移

带走 `examples/example.tsx` 和 `examples/language-switch.mjs`。保持一棵子树一份实例。`Trans` 的 `components` 继续只包含 `strong`。不要改成默认单例。若启用 Suspense，同时加上边界，而不是删掉 `useSuspense: false` 就当完成。

## 不可删的清理

每个面板在卸载时 `switcher.dispose()`。实例 effect 清理时 `off('languageChanged')`。init 完成时若已卸载，不要 `setInstance`。语言队列必须串行，不能只用一个 epoch 丢掉 setState 却让 `changeLanguage` 并发。

## 反例

```tsx
<div dangerouslySetInnerHTML={{ __html: t('legal') }} />
import i18next from 'i18next'
i18next.changeLanguage('en')
```

- 两个工作区共用一个实例还声称互不影响。
- `t(userInput)` 或把用户文本拼进 keyPrefix。
- 模块加载时缓存 `t()` 结果。
- 把客户端双 Provider 写成 SSR 隔离已验证。

## 测试断言

- 队列只接受最新语言，dispose 后不 commit。
- 工作区 A 的 `changeLanguage` 不改变工作区 B 的实例。这需要浏览器或渲染测试，队列单测本身不够。
- `Trans` 只映射 `strong`。
- 英文单复数键与中文 other 键符合资源文件。

## 真实限制

没有异步后端，没有路由级 namespace，没有 SSR。`useSuspense: false` 是因为资源已经内嵌。法律句的词条是源码，不是不可信 CMS。

## 证据

没有收据不要写 PASS。Actions 41779873259 不是本条目。不要改 `verification.json`。
