# Mermaid：让文章处理流程随代码一起演进

团队需要在文档里说明“RSS文章怎样抓取、去重、入库”，每次业务变化都手工重画截图很容易漏改。Mermaid 接收一段文本描述，解析节点和连线，再布局并生成 SVG。文本可以提交到 Git，评审时能看出哪条分支变了；SVG 是显示结果，DSL 才是维护源。

本例使用 `mermaid@12.2.0`，ESM、MIT。它适合文档中的流程、请求时序和状态说明。需要拖动节点并保存坐标时选 React Flow；需要探索大关系网络时考虑 G6。Mermaid 中画出的 Worker 和状态转换不会真的发送请求或执行工作流。

## 从输入到画面

本例的数据流是：React 开关 → 本地函数生成可信 DSL → `parse` 检查语法 → `render` 做布局并返回 SVG → 当前任务把 SVG 交给沙箱 iframe。三种图共用一套渲染器，差别在描述语言和所表达的业务关系。

`examples/diagram-source.ts` 管描述；`examples/example.tsx` 管状态与显示；`examples/render-queue.ts` 管串行任务。React 不接管 Mermaid 的内部 SVG 节点。

最小调用发生在浏览器 effect 中：

```ts
mermaid.initialize({
  startOnLoad: false,
  securityLevel: 'strict',
  theme: 'neutral',
  suppressErrorRendering: true,
})
const parsed = await mermaid.parse(definition, { suppressErrors: true })
if (!parsed) throw new Error('DSL 语法校验未通过')
const { svg } = await mermaid.render(uniqueId, definition)
```

`initialize` 配置这一份模块实例，本查看器只初始化一次，关闭自动扫描。`parse` 成功返回图类型等解析信息，失败在这个选项下返回 `false`；它不会验证文章是否真的重复或API是否存在。`render` 的输入是唯一 id 和 DSL，输出是 `svg` 字符串及可选的绑定函数。此例只使用 SVG，不调用图内交互绑定。

## 实验一：给处理流程加一条去重分支

打开“从流程描述到可视分支”。先看到“RSS源 → 正文抓取 → 文章索引”，下方展示参与这次渲染的实际 DSL。勾选“显示去重分支”，图中出现判断节点、标有“是/否”的边，以及“跳过入库”；取消后回到直线流程。

关键代码 `flowDefinition(showDeduplication)` 先写相同的开头，再根据布尔值拼入两种固定分支。节点 id `A/B/C/D/S` 是程序内定义的标识，中文是显示标签。Mermaid 根据这些节点和边重新布局；开关与分支选择是示例自己的业务逻辑。图外的文本替代也随相同布尔值更新，读图不是理解流程的唯一路径。

迁移到接口数据时，应先把领域对象验证成已知节点与边，再生成内部 id；不要直接把任意用户字符串拼进语法或初始化配置。

## 实验二：消息时序表达不同的业务路径

打开“请求时序与缓存路径”。默认图有浏览器、API、Worker 三个参与者：浏览器向API请求，API向Worker取结果，再逐级返回。勾选“使用缓存命中路径”，API位置出现缓存说明，响应直接返回浏览器；Worker仍是声明的参与者，但不再有消息往返。

`sequenceDefinition(useCache)` 保留参与者声明，替换消息行。`->>` 表示本例的请求消息，`-->>` 表示回复，`Note over API` 给缓存路径增加说明。源文与真实 SVG 应同步变化。这里没有网络、缓存存储或后端fixture，只有对两种业务行为的可视描述，不能据此推导缓存命中率或请求耗时。

流程图关注“走哪些步骤”，时序图关注“谁在何时向谁发消息”。为同一问题选合适的语法，比把所有内容都塞进流程节点更清楚。

## 实验三：失败时清除旧图，再恢复

打开“失败、恢复与渲染所有权”。合法状态图包含 Idle、Loading、Success、Failed，失败可以回到Loading。点击“尝试无效语法”，DSL故意缺少目标，状态区显示解析失败，原来的iframe移除。点击“恢复合法状态图”，重新得到状态图。

effect每次开始先清空旧SVG和错误。`queueMermaidRender` 用模块级 Promise 链串起解析与布局：等待时已过期的任务跳过执行；已经在运行的任务完成后，再检查自己是否仍拥有当前组件。清理函数将 `active` 置为 `false`。这防止换图或卸载之后把旧结果写回，但不会取消正在进行的CPU布局，也没有 `AbortSignal`。Mermaid自身也有渲染调度；这里的队列额外涵盖 `parse` 与本查看器的过期提交规则。

每次render使用递增的 `rl-mermaid-<n>`，避免同一文档内marker、clipPath和临时节点id冲突。离开Demo页签会卸载组件与iframe；没有为已经完成的SVG保留独立渲染实例。

## SVG显示与可访问性

SVG放进 `sandbox=""` 的iframe，没有脚本和同源权限，父页面不会用 `dangerouslySetInnerHTML` 接收图形。`securityLevel: 'strict'` 是库的处理层，沙箱是显示层；它们都不能把任意远程初始化对象变成可信配置。Mermaid在父文档中执行布局和测量，此例也只开放程序预定义的DSL，而非任意访客编辑器。

三份合法DSL均提供 `accTitle`、`accDescr`，库把它们写进SVG；父页面另有文本替代。沙箱阻止父页脚本访问内部DOM，自动化工具仍可借浏览器控制接口观察该frame，不能把跨域限制说成测试工具绝对无法验证。完整读屏顺序、400%缩放和所有浏览器兼容性需要相应环境检查。

iframe宽度随容器变化，内部SVG保持比例。复杂长图的可读字号、滚动与高度预算需要产品按实际图规模设计，本例没有把小图结果当作大图性能证据。

## 迁入React项目

安装匹配的 `mermaid@12.2.0`，复制五个运行文件：`demo.tsx`（仅适配导出，可在业务中省略）、`example.tsx`、`diagram-source.ts`、`render-queue.ts`、`workshop.css`。在客户端组件挂载查看器；SSR不在服务端调用依赖 `document` 的 `render`。Next应用还需将组件放在客户端边界。

初始化配置应由应用统一持有；多个编辑器共用同一Mermaid模块时要协调主题和安全配置。不要在每个业务组件中反复覆盖全局配置。包声明Node至少22.12；安装版本的默认布局为ELK，示例没有固定旧版Dagre外观。需要跨版本视觉基线时应显式确定布局和主题，并按节点/边含义验收，不能要求升级后像素完全相同。

生产接入还应限制DSL长度与图规模、控制允许的图类型、等字体准备好再布局，并为解析/布局失败保留文本。`parse`通过只说明语法有效，权限与业务约束仍由应用判断。此例没有编辑器、HTTP发布、下载或可点击图内操作；若需要这些能力，应分别设计其输入与资源所有权。

## 官方资料

“官方README原文”保存匹配12.2.0发布提交中的官方中文 `README.zh-CN.md`，来源、固定提交、语言和同步摘要见该页签；本篇是本地教学。“官网预览”沿用公共面板，头部检查不足以证明嵌入允许，当前保留未知状态与直达。

- [官方用法与版本门槛](https://mermaid.ai/open-source/config/usage.html)
- [API接口](https://mermaid.ai/open-source/config/setup/mermaid/interfaces/Mermaid.html)
- [无障碍描述](https://mermaid.ai/open-source/config/accessibility.html)
- [12.2.0发布](https://github.com/mermaid-js/mermaid/releases/tag/mermaid%4012.2.0)

在线文档可能随版本变化；本例API和默认配置还按本地12.2.0源码/类型核对。执行日志、静态复核和正式收据边界保存在 `local-validation.md`，不将策略测试当成真实SVG渲染。
