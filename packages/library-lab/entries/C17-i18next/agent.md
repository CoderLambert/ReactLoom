# C17 i18next — 工程手册

## 适用

框架无关的文案、复数、插值和回退。React 订阅用 C18。不要用全局单例跨租户改语言。

## 版本

`i18next@26.4.3`，MIT。不是笔记里的 26.5.3。`createInstance`，`initAsync: false`，`interpolation.escapeValue: true`，`fallbackLng: 'en'`。

## 迁移

带走 `examples/example.tsx` 的资源和 `examples/language-switch.mjs`。每个所有者 `createInstance`。渲染时调用 `t`。语言切换继续走队列。React 绑定不要塞回这个文件。

## 不可删的清理

卸载时 `dispose()` 并 `off('languageChanged')`。init 完成时若 effect 已清理，不要 `setState`。队列在 dispose 后不得 `onCommit`。不要缓存 `t()` 的返回值。

## 反例

```ts
import i18next from 'i18next'
const title = i18next.t('title')
void i18n.changeLanguage('en')
void i18n.changeLanguage('zh')
```

- `dangerouslySetInnerHTML` 渲染译文。
- 用用户字符串当键。
- 中文资源只抄英文的 `_one`。
- 缺键没有 defaultValue 仍当正常 UI。
- 跨 demo 共用一个可变单例。

## 测试断言

- 队列只提交最后一次语言；dispose 之后不提交。
- 并发调用被串行化，后完成的旧请求不能覆盖更新的意图。
- 英文 count 1 与其他数量使用不同键；中文使用 other。
- `editorial` 在中文缺失时回退英文。
- 队列单测不是 i18next init 的 PASS。

## 真实限制

资源是内嵌对象。没有 HTTP 后端，没有语言探测器，没有 SSR。快速切换的浏览器行为需要 browser 收据。`escapeValue` 不是 HTML 净化器。

## 证据

没有收据不要写 PASS。Actions 41779873259 不是本条目。不要改 `verification.json`。
