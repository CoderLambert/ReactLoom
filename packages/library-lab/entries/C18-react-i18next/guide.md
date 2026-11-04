# react-i18next 17.0.16｜Provider 拥有实例，Trans 不是 HTML 注入

Lab 锁定 `react-i18next@17.0.16` 和 `i18next@26.4.3`（MIT）。绑定负责订阅和 `Trans`。资源、回退和 `t` 的规则在 i18next。不要把本条目写成 26.5 或另一版 react-i18next。

没有收据时 sdk / build / browser 保持 NOT_RUN。Actions 41779873259 不是本条目 PASS。

## Lab 当前示例

[`examples/example.tsx`](examples/example.tsx) 使用真实的 `I18nextProvider`、`useTranslation` 和 `Trans`。每个工作区在 effect 里 `createInstance()`。`demo.tsx` 只做再导出。没有 Suspense 数据源，没有 SSR。

```tsx
const { t, i18n } = useTranslation(['common', 'feed'], { useSuspense: false })
```

- **basic**：一个 Provider，初始语言 `zh`。问候、未读数量和语言下拉框。`useSuspense: false`，所以资源未就绪时由外层显示「加载独立语言资源…」，而不是抛给 Suspense。
- **business**：增加昵称输入。`Trans` 的键是 `common:legal`，映射只允许 `strong: <strong />`。英文句子里虽有 `<strong>` 字样，渲染的是 React 元素，不是 `innerHTML`。
- **advanced**：工作区 A 从中文开始，工作区 B 从英文开始。两边各有自己的实例和 [`language-switch.mjs`](examples/language-switch.mjs) 队列。切换 A 不得改变 B。缺键 `feed:absent` 使用 `defaultValue`。

init 选项：`fallbackLng: 'en'`，命名空间 `common` 和 `feed`，`escapeValue: true`，`initAsync: false`。卸载时 `local.off('languageChanged')`，面板的 effect 调用 `switcher.dispose()`。

研究笔记里的按路由懒加载 namespace、SSR `I18nextProvider` 每请求隔离，以及和 RHF 共用的表单，都没有挂载。

## 什么时候用

React 组件要在 `changeLanguage` 之后重渲染。脚本和无界面的服务用 C17 的实例即可。一句静态中文不需要 hook。

`useTranslation` 订阅的是它所在 Provider 的实例。没有 Provider 时会落到默认单例。本示例始终包住 Provider，避免 demo 改到别人的语言。

## 数据与模型

所有权：

| 层 | 职责 |
| --- | --- |
| `createInstance` | 资源、语言、回退 |
| `I18nextProvider` | 把该实例注入子树 |
| `useTranslation` | 订阅 `languageChanged` 并给出 `t` |
| switcher | 串行 `changeLanguage`，只提交最后一次 |
| `Trans` | 按白名单把占位符换成元素 |

`useSuspense: false` 时，hook 不会等异步后端。本资源是同步放进 init 的。若以后改成 HTTP 加载，未完成时 `t` 可能先返回键或回退，要有自己的就绪状态。不要假设打开 Suspense 就能处理每一种加载失败。

`Trans` 解析翻译字符串里的标签名，只渲染 `components` 里给出的类型。不要把用户写的 HTML 放进词条再打开 `dangerouslySetInnerHTML`。`strong` 是源码里的组件。若词条来自不可信的 CMS，这份映射也不够，需要单独的净化策略。

两个 Provider 即使 `resources` 对象相同，也是两份实例状态。A 调 `changeLanguage` 只影响 A 的 `i18n`。

switcher 用 `useMemo` 依赖 `i18n`。实例换了就新建队列，旧队列在 effect 清理时 `dispose`。只在 React 里忽略 setState 而不串行化 `changeLanguage`，底层仍可能后完成的请求覆盖语言。

## 三层示例

### 基本

下拉框改成 English，标题和未读句子跟着变。count 为 1 时英文是单数 story，中文走 `unread_other`。数量夹在 0–99。输出节点是 `data-testid="react-i18next-工作区 A"`。

### 业务

昵称改动只影响问候插值。法律句中间是真正的 `<strong>`。检查 DOM 时不应出现把整句设为 `innerHTML` 的属性。切语言后，strong 仍在，文案切换。

### 进阶

把 A 改成英文，B 保持初始英文或再改回中文。两边的 `<select>` 各看各的 `i18n.language`。A 的失败提示出现时，B 没有同一句 alert。缺省行显示「（等待本地化）」。

## 反例

### 1. 有 Provider 又改全局单例

```ts
import i18next from 'i18next'
i18next.changeLanguage('en')
```

子树看的是 Provider 的实例，全局单例是另一份。语言看起来没切换，或切换了不该动的树。

### 2. 默认 useSuspense 配没有边界的懒加载

后端一慢，整棵树挂起。本示例显式 `useSuspense: false`。真要挂起，就在路由级放好边界和错误态，并处理请求失败。

### 3. Trans 当 innerHTML

```tsx
<div dangerouslySetInnerHTML={{ __html: t('legal') }} />
```

词条里的标签会被当成 HTML。用 `Trans` 和固定的 `components`。

### 4. 并发 changeLanguage

两个点击各发一个 Promise。用 `createLatestLanguageSwitcher`。dispose 前不要再 commit。

### 5. 模块级 t('title')

语言变了常量不变。在组件渲染里调用 `t`。

### 6. 用 keyPrefix 拼用户输入

`keyPrefix` 只适合源码里的固定分组。用户字符串拼进键会读到任意词条。

### 7. SSR 共用一个实例

请求 A 的语言会漏到请求 B。每个请求 `createInstance`，或使用官方请求级克隆。本 Demo 没有服务器渲染，不能把客户端双 Provider 说成 hydration 已通过。

### 8. 翻译组件覆盖了按钮的语义

`components` 里塞一个会抢焦点的控件，句子的阅读顺序会乱。Lab 只用 `strong`。

## 组合

**i18next。** 资源结构和回退以 C17 为准。本文件只增加 Provider 和 `Trans`。

**RHF。** 错误文案用 `t('form.email')` 这类字面量键。不要把服务器返回的英文句子直接当翻译结果。本 Demo 没有表单。

**路由。** 按路由加载 namespace 时，key 要包含语言和 ns。未加载时显示就绪状态，而不是闪键名。当前两个 ns 都在 init 里。

## 生产清单

- 每个隔离区域一个实例加一个 Provider。
- `useSuspense` 与真实加载方式一致。
- `Trans` 的组件表是白名单。
- 语言切换串行，卸载 dispose 并 off。
- 插值保持 `escapeValue: true`。
- 不从语言推断时区或权限。

## 升级

react-i18next 17 配 i18next 26.4.3。升级任一包都要重测 Provider 隔离、`Trans` 的 strong、复数和快速切换。不要只改其中一个的版本号。

## 练习

1. 英文 count 1 与 2 的未读句子不同。
2. 法律句在 DOM 里是 `strong` 元素，不是一整段 HTML 字符串。
3. advanced 只改工作区 A，B 的语言不变。
4. 快速连点语言，最终与最后一次选择一致，且卸载无警告。

## 官方链接

- https://react.i18next.com/latest/usetranslation-hook
- https://react.i18next.com/latest/i18nextprovider
- https://react.i18next.com/latest/trans-component
- https://github.com/i18next/react-i18next

## 证据

语言队列单测不渲染 Provider。sdk 要真实 import `react-i18next@17.0.16` 与 `i18next@26.4.3`，并在 `docs/library-lab/evidence/runs/` 留下收据。SSR 和 hydration 不在此列。

GitHub Actions 41779873259 是仓库级安装、typecheck、build、52 个 SDK 文件（153 项测试）和 45 项 Playwright 的结果，不是 C18 的条目 PASS。不要改 `verification.json`。
