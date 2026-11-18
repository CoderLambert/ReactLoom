# react-i18next：语言变了，哪棵 React 树应该更新

两个工作区同时打开订阅偏好：A 看中文、B 看英文。用户改语言后，问候、未读复数和法律说明要一起更新；A 的选择不能改变 B。react-i18next 负责把 i18next 实例接到 React Context、订阅和组件渲染，资源查找、复数、回退属于 i18next core。

本例锁定 react-i18next **17.0.16**、i18next **26.4.3**，两包 MIT；实装 peer 支持 React≥16.8、core≥26.2、TypeScript 5/6/7，当前 Lab 是 React19/TS7。翻译文本是源码内本地资源，不是翻译服务。手动放行和拒绝是明确的本地 Promise fixture，没有网络后端或计时时钟。

## 三个可操作目标

| 目标 | 输入与操作 | 应观察的结果 |
| --- | --- | --- |
| basic：组件绑定与复数 | 切 A 语言，未读数量1/2 | 实际 SDK 语言事件后标题/句子变化；英文 story/stories，中文other |
| business：namespace 与 Trans | 改昵称、切语言 | 用户文本原样显示，法律句只有源码控制的 strong，英文可以重排句子 |
| advanced：双 Provider 与在途请求 | A手动放行，连续en→zh；放行、拒绝、重试、重置 | 原请求按序执行，最新意图仍在队列；B状态不变；错误可恢复，旧session卸载 |

### 1. useTranslation 与实例

基本场景初始为“工作区 A · 订阅偏好”，未读2条。把“工作区 A语言”选 English，标题变 Subscription preferences；数量1为 1 unread story，2为 2 unread stories。再切中文，中文未读句仍更新。重置恢复中文与数量2。

[example.tsx](examples/example.tsx) 的 useTranslation 读取最近的 I18nextProvider：

~~~tsx
const { t, ready } = useTranslation(['common', 'feed'], { useSuspense: false })
~~~

common/feed 是两组资源名，不是两份实例；显式 common:greeting、feed:unread 选择键。hook 在本版本用 useSyncExternalStore 订阅 languageChanged，卸载时按同一回调身份 off；Provider 只提供 Context，不替你创建或销毁实例。本例还有一个自有 observer 展示实际语言事件和状态，属于诊断 UI，不是另一份翻译引擎。

资源在 init 中完整内嵌，initAsync:false；外层等待实际 init 完成，hook 再检查 ready。没有异步 backend。useSuspense:false 只表示不抛给 Suspense，换成HTTP加载后仍需实际的 ready、错误、取消和重试设计；这里没有证明默认 Suspense 能处理所有失败。

### 2. namespace、文本与 Trans

业务场景改“用户昵称”为 Ada，问候更新；把昵称改为包含 <img src=x> 或 & 的文字，页面仍应显示这些字符，不创建图片。React 文本节点负责转义，所以本例使用 escapeValue:false，避免先转义后又由React转义导致用户看到实体文本。这个设置不能直接搬去拼接 HTML 或 innerHTML。

法律说明来自源码内 common:legal；中文“请阅读隐私说明。”、英文“Read the privacy notice.”。实际强调部分是 React strong，不是把整句注入 HTML。

~~~tsx
<Trans
  i18nKey="legal"
  ns="common"
  components={{ strong: <SafeEmphasis /> }}
/>
~~~

[SafeEmphasis](examples/safe-emphasis.mjs) 只取 children，创建带固定 testid 的 strong，词条属性不会向 DOM 透传。17.0.16 实际支持词条属性覆盖映射组件 props；默认还保留一组 basic HTML tags，所以“有 components 就是通用净化器”不准确。本例显式关闭 basic HTML keep-list，只渲染源码中已知结构，资源也是可信源码。未知标签在本版本作为文字保留；这不构成任意 CMS、插件或第三方词条的全面安全保证。若要映射链接或按钮，应在自己组件中约束 href、事件和允许属性。

Trans 本身不是语言变化的完整订阅方案。它在这个面板里随 useTranslation 与实例事件重新渲染；不能把一段独立 Trans 当作所有动态语言场景都自动接好。

### 3. 稳定原实例、串行队列与恢复

进阶场景 A初始中文，B初始英文；每棵树自己的资源副本、实例、队列、observer、gate。缺键行用 defaultValue 显示“（等待本地化）”，不是远程回填。

1. 勾选 A“手动放行切换”，选en，再选zh。JSON显示 actual=zh、requested=zh、activeTarget=en，等待放行。
2. 点 A“放行在途切换”。SDK真正完成第一条en，标题可短暂为英文；最新zh仍排队且进入自己的等待放行。
3. 再点放行，实际与请求都为zh、status=ready。B语言/事件数不变。
4. A再请求en，点“拒绝在途切换”。显示本地fixture错误，实际语言仍zh；这不是网络或翻译服务失败。
5. 点“重试最新选择”，再取消手动放行，会放行当前等待并恢复为en。真实重试按钮避免原生select同一选项不触发change的问题。
6. 再让A有在途请求，点“重置当前演示”：旧Provider/session卸载，新A中文、新B英文，gate与错误清空。宿主“停止并卸载”后重开同样重新初始化。

状态 JSON 中 requested 是最后意图，actual 是真实实例当前语言，committed 是队列最后一次完成提交；本地等待也有 activeTarget/awaitingRelease。串行化不等于原子语言事务：已开始的请求完成时，SDK仍可能发中间 languageChanged，页面可以显示中间语言。队列合并等待中的意图，只让最新完成提交/错误更新本轮状态；它不撤销已经发出的 SDK 事件。

## 为什么队列不能依赖 hook 的 i18n 身份

本版本 useTranslation 返回的 i18n 是语言快照 wrapper，language/resolvedLanguage/languages 改变时身份会变。旧写法用这个对象作 useMemo 的依赖，语言事件可能触发旧队列 cleanup/dispose，使后续意图丢失。

本例把队列放在 [workspace.mjs](examples/workspace.mjs) 的稳定原实例 session 中；I18nextProvider拿该原实例，hook只消费 t/ready。每次 effect setup 创建完整 session，每次 cleanup dispose；不用在render里调用changeLanguage，也不用已在effect重放中被dispose的memo队列。双Provider不调用 initReactI18next 注册模块默认单例，避免多树互相覆盖默认实例。

## 所有权与迁移

携带九份实际源码：example.tsx、demo.tsx、workspace.mjs及声明、language-switch.mjs及声明、safe-emphasis.mjs及声明、styles.css。各目标 sourceFiles 同源读取这些文件；没有 C17 跨条目运行依赖、Lab别名、外部图片或宿主全局样式前提。

在自己的 React 应用安装：

~~~sh
pnpm add react-i18next@17.0.16 i18next@26.4.3
~~~

需要现代浏览器的 structuredClone；本例给每个实例复制纯对象资源，避免后续编辑资源时共享引用。源实例、observer和queue归session，hook订阅归SDK；dispose只解绑自己的onLanguageChanged，清待排队/本地gate，不用off(event)清掉全部订阅。

本地gate在dispose时拒绝等待中的Promise且禁止晚UI发布；已经进入i18next.changeLanguage的调用没有本例可用的公共abort，可能在被丢弃的私有实例上完成。不能把alive或dispose解释成取消了所有底层SDK工作。没有timer、Worker、网络、存储或第三方服务要全局清理。

SSR测试只证明服务端生成结果，未验hydration、请求隔离或真实OS输入法；本例也没有语言检测、URL路由、动态namespace backend、持久化、任务队列或不可信CMS。生产SSR要每请求实例并传相同初始资源，另测浏览器hydration。

## 官方来源与验证范围

[固定官方README](https://github.com/i18next/react-i18next/blob/606b6a55f231bbf73823863fbb94e6b8eb8272fd/README.md) 匹配 npm17.0.16 gitHead与同提交manifest；检查完整tree，没有根官方中文候选。保留英文原文12793B，SHA256 bcd692905cb53f1b7ca8e4c8c4b89b7fb0510669e41e9c3749e7830d3ada1c9b，UTC2026-11-10T17:43:00.934743+00:00。原文内容与本地教学分开，第三方文档中的代理提示不构成本项目指令或服务接入授权。

[官方文档站](https://react.i18next.com/) 实际CSP frame-ancestors仅含 https: ionic: capacitor:，排除当前HTTP Lab祖先，所以官网预览标 blocked。XFO缺失不覆盖CSP；若改成HTTPS部署仍需另核，不宣称当前iframe允许。原文/版本/原始重复头与离线分类修正保存在本地维护记录，未为分类校准重抓上游。

本地真实SDK5项（含Provider/Trans静态渲染及实际core队列）与纯policy4项分别通过；主控固定candidate19三目标和官方blocked共4项真实浏览器通过，九运行源保持一致。正式verification三状态仍NOT_RUN，本地收据层级另记；不由这些样本推断全浏览器、SSR hydration、OS IME或任意资源安全已通过。
