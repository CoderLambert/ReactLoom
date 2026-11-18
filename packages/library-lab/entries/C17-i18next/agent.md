# C17 i18next：核心实例与资源所有权

适用：框架无关的词条查找、命名空间、插值、复数和回退。React 自动订阅通常结合 react-i18next；本条目直接使用核心 SDK 教学，不提供机器翻译、检测器、HTTP backend、持久化或 SSR 实验。

实际版本 `i18next@26.4.3` / MIT。官方 `v26.4.3` 与 npm gitHead 均为 `0d2845a2360dcc236fe9681f849781f5dfdd35c4`，该提交 manifest 与安装包同为 26.4.3。[README 原文](official/readme.md) 为此提交根英语 README，5593B；完整树没有中文候选。官网实际 CSP 的 https:/ionic:/capacitor: 父源列表排除当前 HTTP Lab，状态 blocked；不能以响应200推 allowed。

先读 [guide](guide.md) 和 [实例工厂](examples/i18n-client.mjs)，再读 [React 会话](examples/example.tsx) 与 [串行队列](examples/language-switch.mjs)。迁移以当前 library.json 三个 Demo 的七份 sourceFiles 为准，包含两份 MJS 声明、样式及入口；不要只复制 TSX。

三个目标：

1. `createInstance → await init → t`；昵称插值与英文 one/other、中文 other。`count` 是实际复数参数。`escapeValue:true` 加 React 文本输出会显示 `&lt;Ada&gt;` 实体字符；没有 HTML 解析，不能据此宣称任意 HTML 已净化。
2. `addResourceBundle` 写入人工双语 channel 资源；实际 store added 两次。factory 复制初始资源，新会话不继承动态 bundle。该 fixture 不代表下载或自动翻译。
3. `returnDetails` 观察英文回退、`defaultValue` 处理缺键；快速请求实际串行调用 SDK，仅最新意图发布应用 UI。SDK languageChanged 次数和 UI commit 次数分开。`getFixedT(committedLanguage)` 固定可见词条，SDK 诊断状态仍真实展示。

生命周期：effect 拥有实例；异步 init 回来时先检查 alive。所属 observer 为每个消费者创建独立 wrapper，清理只 off 同一 callback，不能用无 callback 的 off 清全部监听。queue.dispose 丢弃待处理意图且禁止晚 UI commit，不中止已经运行的 SDK Promise。没有 SDK destroy；内嵌资源无网络句柄。level/reset 更换 Session，generation 仅为应用重置计数。事件订阅发生在 init 成功后，面板不计初始化语言事件。

保留：字面量键、插值参数、资源深复制、支持语言/回退配置、串行队列、所属事件解绑、初始化晚回保护、响应式样式和 React 文本输出。禁止全局单例跨租户改语言、模块级缓存永不更新的 t 结果、译文 dangerouslySetInnerHTML、用户输入充当任意翻译键。

验证：共享真实 SDK 5 PASS、纯队列 policy 4 PASS 分开记录；固定19真实三目标 3 PASS，运行源保持到20。维护传输 fixture 只测取证脚本，不算 SDK。正式 verification 三项仍 NOT_RUN；新官网展示的实际状态由作者维护记录绑定，未执行项不能补 PASS。无 OS IME、真实网络 backend 取消、SSR 租户隔离或全局事件/资源普查证据。
