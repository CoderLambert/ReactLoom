# i18next 26.4.3｜每个演示一块自己的实例

Lab 锁定 `i18next@26.4.3`（MIT）。研究笔记里的 26.5.3 不是 pin。本条目使用核心 `createInstance`，不使用 React 绑定。组件订阅语言要看 C18。

没有收据时 sdk / build / browser 保持 NOT_RUN。Actions 41779873259 不是本条目 PASS。

## Lab 当前示例

[`examples/example.tsx`](examples/example.tsx) 在 effect 里 `createInstance()` 并 `init`。资源是文件里的对象，没有后端插件，也没有语言探测。`demo.tsx` 只做再导出。

```ts
await instance.init({
  lng: 'zh',
  fallbackLng: 'en',
  supportedLngs: ['zh', 'en'],
  defaultNS: 'common',
  ns: ['common', 'news'],
  resources,
  initAsync: false,
  interpolation: { escapeValue: true },
})
```

- **basic**：`common:welcome` 插值 `name`，`news:article` 带 `count`。中文资源只有 `article_other`。英文有 `article_one` 和 `article_other`。
- **business**：再显示 `news:section` 和 `news:refresh`。
- **advanced**：`news:editorial` 只存在于英文。中文界面应落到英文回退。`news:not_found` 用 `defaultValue`，不把键名直接扔给用户。

[`language-switch.mjs`](examples/language-switch.mjs) 的 `createLatestLanguageSwitcher` 串行化 `changeLanguage`。新的请求只保留最后一次目标。只有队列空且实例仍存活时才 `onCommit`。卸载调用 `dispose`，并把 `pending` 清掉。effect 还 `off('languageChanged')`。返回时若 init 尚未完成，`alive` 为假，则不再 `setState`。

不要在模块顶层 `i18next.t(...)` 把结果存成常量。语言一切换，那串字就是旧的。

## 什么时候用

服务端、脚本和与框架无关的文案。React 树里要跟着语言重渲染时用 react-i18next 的 Provider，而不是自己订 `languageChanged` 再把整棵应用套上。一个布尔按钮的两句中文不必引入 i18next。

`escapeValue: true` 会转义插值。这不等于可以 `dangerouslySetInnerHTML`。翻译结果用文本节点。

## 数据与模型

实例拥有语言、命名空间和资源。Lab 不碰默认导出的单例，避免一个 demo 的 `changeLanguage` 改到别的条目。

键用 `namespace:key`。缺省命名空间是 `common`，调用处仍写全称，避免以后改 defaultNS 时串台。

复数：英文 `count === 1` 走 `article_one`，其余走 `article_other`。中文没有 one，会用 other。不要在中文资源里抄英文的 one 规则。数量先夹到 0–99。

回退链是当前语言然后 `en`。缺键又没有 `defaultValue` 时，用户会看到键。advanced 对未知键给了明确的缺省句。

`changeLanguage` 返回 Promise。两个下拉框快速切换如果并发 await，完成顺序可能和点击顺序相反。switcher 用 `pending` 只留最新目标，并且同一时间只有一个 `drain` 在跑。dispose 之后不再 commit，也不再把错误写进已卸载组件。

`initAsync: false` 配合内嵌资源，init 的 Promise 仍要处理。示例在它完成前显示「正在初始化」。

## 三层示例

### 基本

切到 English，欢迎语和数量句变成英文。count 为 1 时应看到单数 article。改昵称，插值跟着变，不需要重新 init。输出在 `data-testid="i18next-output"`。

### 业务

中英文的「技术 / Technology」和刷新按钮文案都来自 `news`。不要把这两句写进组件。命名空间没加载时应看到缺键，而不是空白假装成功。本资源在 init 时就放进了两个 ns。

### 进阶

停在中文，editorial 那一行应出现英文 Editors pick。未知键出现「（未配置翻译）」。快速连点语言，最终界面与最后一次选择一致。离开 demo 后再回来，不应残留上一次实例的监听。

## 反例

### 1. 使用全局单例

```ts
import i18next from 'i18next'
i18next.changeLanguage('en')
```

别的模块会一起变。`createInstance`。

### 2. 模块级缓存 t() 的结果

```ts
const title = i18n.t('common:title')
```

语言切换后 title 不变。在渲染时调用 `t`。

### 3. 并发 changeLanguage

两次点击的 Promise 后完成的那次覆盖新选择。用 `createLatestLanguageSwitcher`。

### 4. 卸载后仍 setState

init 或 changeLanguage 的回调要看 `alive` 和 `dispose`。示例两者都有。

### 5. 把翻译插进 HTML

```tsx
<div dangerouslySetInnerHTML={{ __html: instance.t('news:section') }} />
```

即使 `escapeValue` 为真，也不要把整句当 HTML。富文本用 C18 的 `Trans`，并且组件映射是白名单。

### 6. 中文复制英文的 _one

中文复数不靠 one/other 同一套。缺了 other 会在数量不为 1 时露键。本资源的中文只有 other。

### 7. 用用户输入当键

`t(userString)` 会读到任意词条。键是源码里的字面量。昵称只做插值。

### 8. 缺键当功能开关

回退到英文不等于该功能在中文里关闭。缺键要有 `defaultValue` 或在发布前检查资源。

## 组合

**react-i18next。** 核心实例仍按这里的方式创建。Provider 和 `useTranslation` 在 C18。不要在 C17 的组件里再引一套全局 i18n。

**表单。** 校验文案用键，不要把 Zod 的英文默认句和 i18next 各写一套还不同步。本 Demo 没有表单。

## 生产清单

- 每块 UI 自己的实例，或应用级一个实例但绝不是跨租户共享可变单例。
- `escapeValue: true`，输出用文本。
- 语言切换串行，卸载 `dispose` 并 `off`。
- 复数键按语言补齐。
- 回退语言和 `supportedLngs` 写明。
- 不在模块加载时调用 `t` 并缓存。

## 升级

锁 26.4.3。若笔记或博客写 26.5，先改 pin 再谈行为差异。升级后重测：英文单复数、中文回退、快速切换、卸载后无 setState。

## 练习

1. count 为 1 和 2 时，英文句子不同，中文都走 other。
2. 中文界面读到 `editorial` 的英文。
3. 连续切换语言，最终与最后一次选择一致。
4. 离开页面，不出现对已卸载组件的更新警告。

## 官方链接

- https://www.i18next.com/overview/api
- https://www.i18next.com/overview/configuration-options
- https://github.com/i18next/i18next

## 证据

`language-switch` 单测不 init i18next。sdk 要真实 import `i18next@26.4.3` 并在 `docs/library-lab/evidence/runs/` 留下收据。

GitHub Actions 41779873259 是仓库级安装、typecheck、build、52 个 SDK 文件（153 项测试）和 45 项 Playwright 的结果，不是 C17 的条目 PASS。不要改 `verification.json`。
