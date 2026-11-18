# Streamdown：把分段 Markdown 变成连续可读的正文

聊天回答往往先收到 `正在汇总 **流式`，稍后才收到 ` Markdown**`。如果把每段输入分别交给渲染器，前文会丢失；如果等全文结束才渲染，用户又看不到生成进度。Streamdown 适合在 React 中持续展示同一条消息：应用按消息 ID 累积文本，库把当前累计正文解析为 React 节点，并对未闭合 Markdown 做显示层修复。

本例使用已安装的 **streamdown 2.6.0**。它适合 AI 回答、研究摘要等持续追加的正文；静态文章可以考虑 [E06 react-markdown](../E06-react-markdown/guide.md)。Streamdown 不负责模型连接、消息存储、重试或请求取消，这些仍属于应用。代码高亮、数学公式、Mermaid 和 CJK 特化是可选插件，本例没有安装这些插件，也不把普通代码块声称为语法高亮。

## 核心机制：保留输入，修复显示

本页贯穿一个研究摘要。数据流是：**本地分段 fixture → 应用累加全文 → Streamdown → 实际 DOM**。

1. `fixtures.mjs` 保存按真实换行分隔的 Markdown 段落。delta 是一次收到的新文本，不是完整消息。
2. `stream-session.mjs` 每次执行 `markdown: state.markdown + delta`，保存上一段内容。`received` 是已收段数，不等同 token 数。
3. `example.tsx` 把累计正文作为 `children` 传给 Streamdown。库在 `mode="streaming"` 下划分 Markdown 块，并通过 remend 处理未闭合标记；它不会改写应用保存的原始字符串。
4. `parseIncompleteMarkdown` 控制这层语法修复。`isAnimating` 表示当前仍在接收，供库内交互判断；它既不启动输入，也不会自动启用文字动画。暂停时仍可保留 `mode="streaming"` 与修复能力。

2.6.0 有一个动态选项边界：Streamdown 顶层 memo 比较器没有比较 `parseIncompleteMarkdown`，正文不变时只改这个 prop 可能不触发重新渲染。本例为渲染器设置随修复开关变化的 React key，让切换选项重建显示实例；累计正文、输入进度与定时器会话保留。分别新建实例的 Node SSR 不能覆盖这一交互，必须在真实页面中切换验证。

版本依据是 [2.6.0 的实际实现](https://github.com/vercel/streamdown/blob/8a2ac221a878a0fc5839f2035c1e16575cfa3440/packages/streamdown/index.tsx)，不是假设当前官网所有新增功能都存在于旧版本。

## 实验一：累计正文与未闭合语法

**问题：** 半截强调或代码围栏到达时，怎样让内容先可读，同时保留原始输入？

打开入门场景，点击两次“追加下一段”。“累计正文”保留第一段标题，末尾是未闭合的 `**流式`；实际渲染应出现格式化的“流式”。切换“修复未闭合语法”，观察格式变化，累计正文不变。继续推进到第 6 段，代码内容已经出现，关闭围栏尚未到达；再追加第 7 段，状态变成“接收完成”。2.6.0 的默认强调节点是 `span[data-streamdown="strong"]`，不应在测试里假定它一定输出 `<strong>`。

“开始自动追加”每 700ms 接收一段。“暂停”保留当前正文，“继续自动追加”从下一段恢复；“提前结束”保留已收正文并封闭本轮，必须“重置”才能重开。自动收完也会停止定时器。重置让段数与正文归零，不会重开已关闭的修复开关。

三个区域分别展示**下一段 delta、累计源文、真实渲染**。输入区域使用 JSON 字符串让换行边界可见，累计区域保留真正换行；不是把字面量 `\n` 再作为段落渲染。源码：[输入](examples/fixtures.mjs)、[累加与状态](examples/stream-session.mjs)、[React 生命周期](examples/example.tsx)。

## 实验二：研究摘要与受控外链

**问题：** 同一条回答还会生成表格、任务列表、图片和外链，怎样把它显示成业务内容，同时限定外部资源？

切换业务场景，逐段推进。第 4 段后可见两行研究数据，第 6 段后出现一个已完成、一个待复核的任务。任务列表是 Markdown 展示，checkbox 不可操作，不代表应用已经保存了工作流状态。全部 11 段到达后，在实际渲染区核对：

- “官方说明”保留 `https://streamdown.ai/docs` 链接，新页打开。
- “未知外站”和“危险协议”显示为文字；本例自定义组件不为它们生成可点击链接。
- Markdown 远程图片变为“图片已阻止：远程图片”文字，没有 `<img>` 请求。
- 原始 `<img>` 和 `<script>` 使用 `skipHtml` 忽略；累计源文仍可供检查。

GFM 表格/任务列表来自 Streamdown 的默认 remark 管道。域名白名单、图片占位组件与 `skipHtml: true` 是本例主动配置的**应用策略**，不是 Streamdown 默认只允许这个域名。`markdown-policy.mjs` 在 URL 转换与链接组件两处校验 HTTPS origin，并替换图片组件；自定义 `a` 同时替代了库默认链接组件，因此本例不再使用其默认链接确认弹窗。

本例保留默认 rehype 插件链，没有通过 `rehypePlugins` 覆盖消毒层。官方默认允许更多链接和图片，不能把“默认 sanitize”理解为没有远程请求，也不能把本例域名策略当作通用内容安全审计。迁到产品时，白名单应来自产品允许的资料站点，图片可以继续禁用或改为受控代理。[官方安全说明](https://streamdown.ai/docs/security)解释了默认值与覆盖插件链的影响。

源码：[同源输出策略](examples/markdown-policy.mjs)、[业务输入](examples/fixtures.mjs)。Node SDK 检查读取的正是这两份文件，没有另写一套展示实现。

## 接入目标项目

```sh
pnpm add streamdown@2.6.0
```

React / React DOM 的 peer 为 `^18 || ^19`。将 `examples/` 中的 `example.tsx`、`fixtures.mjs`、`stream-session.mjs`、`markdown-policy.mjs`、对应 `.d.mts` 和 `workshop.css` 一并复制；`demo.tsx` 是 Lab 的薄适配出口，业务项目可以直接引用默认组件。所有导入都为相对路径，不依赖 Lab 宿主 API。

本例的真实调用是：

```tsx
<Streamdown
  key={repairIncomplete ? 'repair-enabled' : 'repair-disabled'}
  {...markdownPolicy}
  mode="streaming"
  parseIncompleteMarkdown={repairIncomplete}
  isAnimating={playing}
>
  {session.markdown}
</Streamdown>
```

`markdownPolicy` 的定义见实际源文件，不要只复制上面 JSX 然后漏掉链接/图片策略。`controls: false` 关闭库内复制/下载等工具，本例聚焦输入到渲染的关系。

样式需要 Tailwind CSS v4 扫描 Streamdown 的 dist。`workshop.css` 的 `@source "../../../node_modules/streamdown/dist/*.js"` 是相对于本仓库该 CSS 所在位置；迁移后按新目录调整。`example.tsx` 还导入 `streamdown/styles.css`，本地 CSS 提供演示布局、表格边框及作用域内设计 token。不要依赖 Lab 的 `.prose` 或全局主题才能看清输出。未使用 Tailwind 的项目需要自行提供覆盖库标记/类的样式，不能预期导入动画 CSS 就获得全部排版。

接真实模型时，用网络回调替换 fixture 的段落来源，按 messageId 累积正文；不要用每次 delta 覆盖旧文本。请求结束与用户取消均更新状态，取消时还需对自己拥有的请求执行 AbortController.abort。本例没有请求，所以只负责自己的定时器，不能证明网络取消或重连已经实现。

## 生命周期和性能边界

计时器只在 `playing` 阶段创建。暂停、提前结束和重置会同步 clearInterval；Effect 的 cleanup 在自动结束、切换场景和组件卸载时清除同一计时器。Reducer 只接受播放阶段的 tick，迟到的 tick 在暂停/结束状态不再改变正文。切换场景会重新挂载独立会话；离开 Demo 页签由宿主卸载，重进从 0 段开始。真实浏览器仍须检查活动计时器归零，不能用重新挂载后的空白界面单独证明清理。

Streamdown 会按 Markdown 块做 memoization，但每次输入仍经过应用的状态更新。真实聊天应按消息粒度更新，给长消息与代码块设大小预算，并按动画帧或固定间隔合并高频 delta。本例 700ms 的教学节奏不是性能基准，也没有测量大上下文吞吐量。

## 官方资料与验证边界

“官方 README”页展示 [vercel/streamdown 的 package README](https://github.com/vercel/streamdown/blob/8a2ac221a878a0fc5839f2035c1e16575cfa3440/packages/streamdown/README.md) 原文快照；tag 是 `streamdown@2.6.0`，语言为英语。已检查该提交的 README 文件列表，没有官方中文 README。来源、日期、SHA-256 见 [source-audit.json](official/source-audit.json)。官网 `https://streamdown.ai` 在本次响应中没有发现 X-Frame-Options / frame-ancestors 限制，但没有从 Lab origin 完成浏览器嵌入确认，因此状态为 unknown，保留官网直达入口。

这份讲解与源码是依据官方资料**独立重建**；原研究材料只有摘要，`SUMMARY_ONLY` / `recreated` 属性继续保留。不是历史 GUIDE / SOURCE / DEMO 原件恢复。

本地浏览器检查已覆盖累计正文与修复开关、暂停和结束、实际 interval 卸载清理、GFM 与资源策略、窄屏布局及固定 README 展示。具体操作和结果见 [local-validation.md](local-validation.md)。这些检查使用本地分段输入；真实模型请求与取消、跨浏览器、读屏与触摸操作、大上下文性能仍需在目标项目中验证。
