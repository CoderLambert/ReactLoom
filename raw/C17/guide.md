# i18next：从词典查找到独立实例的语言切换

i18next 把语言资源、插值、复数和缺键回退放在同一个核心实例里。它适合需要多语言资源管理的应用，也能用于框架无关工具；React 树需要自动订阅语言变化时，再接 react-i18next。只有几句固定中文的按钮通常不需要这一层。

本条目使用实际安装的 **i18next 26.4.3 / MIT**，直接调用核心 SDK。所有中英文词条均为人工编写的本地 fixture：库负责选词和替换参数，不会把中文自动翻成英文，也没有网络后端、语言探测器或 SSR 请求隔离实验。

## 先理解实例、资源和 t

一个实例保存当前语言、命名空间和资源。`common` 放通用文案，`news` 放频道文案；`news:article` 明确指定命名空间。昵称是插值参数，不是翻译键；数量通过名为 `count` 的参数参与复数选择。

```ts
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
local.t('common:welcome', { name: 'Ada' })
local.t('news:article', { count: 2 })
```

内嵌资源使初始化不依赖网络，`init` 仍返回应当处理的 Promise。每次创建实例都复制资源，避免运行时加入词典污染下一次演示。不要使用默认全局单例跨租户切换语言，也不要在模块加载时把 `t()` 的结果保存成不会更新的常量。

英文资源定义 `article_one` 和 `article_other`；数量 1 显示 `1 article`，2 显示 `2 articles`。中文只需要本例使用的 `article_other`。实际类别由语言的复数规则决定，不是所有语言都遵循英文的 one/other。数量控件在本例限制为 0–99，教学断言使用整数；这不构成完整金额或数量输入校验。

[`i18n-client.mjs`](examples/i18n-client.mjs) 保存实例工厂、资源和所属事件订阅；[`example.tsx`](examples/example.tsx) 管理 React 生命周期与操作控件。

## 目标一：插值、复数与文本输出

打开「实例、插值与复数」，把昵称改成 Ada、语言改成 English，欢迎语应为 `Welcome, Ada!`。数量依次填 1 和 2，观察单复数变化。改昵称不需要再次初始化实例。点「重置当前实例」，语言、昵称和数量回到初始值。

再输入昵称 `<Ada>`。本例保留 `escapeValue: true`，SDK 返回字符串中的 `&lt;Ada&gt;`；React 以文本节点呈现，因此页面显示这些实体字符，不会出现名为 Ada 的 HTML 元素。这是当前配置与输出位置的真实组合，也意味着视觉上会看到实体文本。若产品全部使用 React 文本插值，可按 React 绑定的惯例评估 `escapeValue: false`，但必须确保译文始终进入文本位置。此处没有把译文交给 HTML 解析器。

`escapeValue` 转义插值，并不是任意 HTML 的净化器。不要用 `dangerouslySetInnerHTML` 输出译文；富文本应采用受控组件映射，并核对对应 React 绑定的安全边界。

## 目标二：实际加入命名空间，观察资源所有权

打开「本地namespace与真实资源事件」。初始 `channel` 不存在，页面显示尚未加入词典。用按钮「加入本地channel词典」或键盘 Enter 激活：实际 `addResourceBundle` 分别写入中文和英文的 `channel`，页面出现「本地RSS频道配置」。切到 English，应得到 `Local RSS channel settings`。

```ts
local.addResourceBundle('zh', 'channel', { summary: '本地RSS频道配置' }, true, true)
```

最后两个参数表示深合并及覆盖已有值。本例一次加入两种语言，因此实际 `store` 的 `added` 事件累计 2；这证明 SDK 资源写入发生了，不证明发生过 HTTP 下载。UI 的资源状态通过实际 `hasResourceBundle` 读取。点重置后，新实例没有 `channel`，资源事件计数回到 0；原始资源对象也没有被写入新命名空间。

## 目标三：看清回退、SDK 事件和应用提交

打开「回退细节、最新意图与生命周期」。中文没有 `news:editorial`，`fallbackLng: 'en'` 使其得到 `Editors pick`。页面展示真实 `returnDetails` 的 `usedLng: 'en'` 和 `usedNS: 'news'`。未知键通过 `defaultValue` 得到「（未配置翻译）」。回退到英文不表示某项中文业务功能被关闭，资源发布前仍需检查缺键。

接着点「快速请求 EN→ZH」。这是同一操作连续发出两个真实语言请求，SDK 会依次推进至英文和中文；应用只发布最后的中文结果。页面分别显示 requested、已提交语言、SDK 当前语言、实际 `languageChanged` 次数和自建 UI commit 次数。此时 SDK 事件增加 2、UI commit 增加 1。反向按钮应最终提交英文。

[`language-switch.mjs`](examples/language-switch.mjs) 是本例自建的串行队列：一个调用进行时，待处理目标只保留最新一次；等待 SDK Promise 后，只有没有更新意图时才提交 UI。它不是 i18next 自带的取消 API。`getFixedT(committedLanguage)` 将可见文案固定到应用最后提交的语言，避免观察中间 SDK 事件时提前显示中间语言；诊断字段仍保留实际 SDK 状态。

资源均在内存中，切换很快。这个操作没有模拟慢网络、后端失败或网络中止；待处理请求与销毁边界另外由纯队列测试覆盖。

## React 生命周期由谁负责

每个 Session 的 effect 创建一个核心实例。初始化完成前显示状态；若 effect 已结束，Promise 返回后不会注册应用订阅或更新旧界面。初始化成功后才开始计数，因此屏幕上的 SDK 事件计数不包含初始化产生的语言事件。

组件为语言事件和资源事件各注册一个所属 callback。清理时分别调用 `off('languageChanged', callback)` 与 `store.off('added', callback)`，不会清掉其他消费者的监听。不能省略 callback：实际 SDK 的无 callback `off` 会删除该事件全部监听。

清理还调用队列 `dispose()`，停止接收新意图、丢弃尚未开始的目标并禁止晚到的 UI 提交；已经开始的 SDK Promise 不会因此中止。当前资源没有网络句柄，也没有 SDK `destroy()` 调用；实例随所有者释放引用。应用的 generation 只是重置计数，不是 SDK 实例编号。切换层级或重置会更换 Session，旧输入节点断开，新会话使用新词典和初始状态。

## 迁入项目

三个入口共用七份必要文件：[`demo.tsx`](examples/demo.tsx)、[`example.tsx`](examples/example.tsx)、[`i18n-client.mjs`](examples/i18n-client.mjs)、[`i18n-client.d.mts`](examples/i18n-client.d.mts)、[`language-switch.mjs`](examples/language-switch.mjs)、[`language-switch.d.mts`](examples/language-switch.d.mts) 和 [`styles.css`](examples/styles.css)。声明文件支持 TypeScript 消费 MJS；样式只作用于本条目类名，包含小屏换行和焦点显示。

在已有 React 19 / TypeScript 项目中安装匹配的 `i18next@26.4.3`，保留相对导入和样式导入，以 `level="basic"`、`"business"` 或 `"advanced"` 渲染组件。若改为应用级实例，应明确 Provider 的所有权、实例共享范围以及资源加载方式；不要照搬演示的每次重置策略管理整个应用。网络 backend、语言持久化和 SSR 每请求实例需要单独设计与验证。

## 已验证范围与官方资料

本例的实际运行覆盖插值与复数、回退详情、资源隔离、串行最新意图与所属 callback 解绑，以及三个 Demo 的浏览器操作。系统输入法、服务端租户隔离、全局监听普查和真实网络取消尚未验证；接入这些能力时，应在对应环境补充实验。

[官方 README 原文](official/readme.md) 来自 `i18next/i18next` 的 `v26.4.3` 固定提交 `0d2845a2360dcc236fe9681f849781f5dfdd35c4`、根 `README.md`，英语 5593 字节，SHA-256 `3964fe947138fb6369c58bbc7779eacc8877cf220d41db7647c9e4bd7c466966`，同步于 2026-11-10 UTC。该提交完整树仅有这一份 README，没有可优先采用的官方中文版本；原文未翻译或改写。

[官方 API](https://www.i18next.com/overview/api) 与 [配置选项](https://www.i18next.com/overview/configuration-options) 用于继续阅读。[官网](https://www.i18next.com) 的实际强制 CSP 为 `frame-ancestors https: ionic: capacitor:`，排除当前 HTTP Lab 父页面，官网面板标记 blocked 并保留直达入口。该判断不外推到 HTTPS 部署；响应 200 或 iframe load 都不能当作允许嵌入的证明。
