# A08 Mermaid 12.2.0：受控 DSL、串行 render 与 SVG 隔离

Mermaid 把文本变成图：解析、布局、输出 SVG。权威数据是 DSL，适合 README、架构说明和可 diff 的流程，不适合自由拖节点。所见即所得编排用 React Flow，大关系图用 G6，统计图用 ECharts，白板用 Excalidraw 或 tldraw。不要把渲染后的 SVG 当持久源。

Library Lab 钉 `mermaid@12.2.0`（MIT，ESM）。官方内核可商用。Mermaid Chart 的协作和订阅是另一个产品，不能从 MIT 推出免费。包名是 `mermaid`，不是 `@mermaid-js/mermaid`。

## Lab 当前示例

`examples/demo.tsx` 导出 `examples/example.tsx`。队列在 `examples/render-queue.ts`。

已挂载：

- 模块级 `initialized` 保证 `mermaid.initialize` 只发生一次：`startOnLoad: false`、`securityLevel: 'strict'`、`theme: 'neutral'`、`suppressErrorRendering: true`。配置是常量，不展开远程对象。
- basic 是 `flowchart LR`：RSS源 → 正文抓取 → 文章索引。business 是 `sequenceDiagram`：浏览器、NewsHub API、Worker。advanced 默认 `stateDiagram-v2`：Idle、Loading、Success、Failed。
- advanced 按钮把源换成 `stateDiagram-v2\n  ThisIsNot -->`。非法时 `parse(..., { suppressErrors: true })` 得到假值，抛错，状态区写「图形无法渲染」。effect 一开始就把 `svg` 和 `error` 清空，所以旧图不保留。
- `mermaid.render('rl-mermaid-' + id, diagram)` 使用递增 id，减轻 clipPath 和 marker 冲突。
- `queueMermaidRender` 把任务串到同一条 Promise 链上。排队期间 `isCurrent()` 为假就跳过 `parse`/`render`。完成后再次检查，才 `setSvg` 或报错。卸载或换图把 `active` 设为 false。
- 成功的 SVG 放进 `iframe`，`sandbox=""`，没有 `allow-scripts`，也没有 `allow-same-origin`。srcDoc 里只有样式和这段 SVG。不把 SVG 写进 React 树的 `dangerouslySetInnerHTML`。
- 页面同时展示 `<pre><code>` 源文，以及一句固定的无障碍说明。DSL 里没有写 `accTitle` / `accDescr`。

没有挂上：可编辑文本框、450ms 防抖、HTTP revision、409/503、`bindFunctions`、显式 `layout: 'dagre'` 或 ELK 切换、40 节点上限、SVG 文件下载。v12 默认布局从 Dagre 改为 ELK 的视觉变化仍然适用：本示例没有钉死 `layout` / `look`，升级后同一段 flowchart 的折线位置可能变。要对照旧截图，应显式写 `layout: 'dagre'`、`theme: 'default'`、`look: 'classic'`，并接受仍非像素级一致。[12.0.0 说明](https://github.com/mermaid-js/mermaid/releases)。

`bindFunctions` 能把交互绑回 DOM。strict 模式下本示例故意不调用它。不要为了点击把 `securityLevel` 改成 `loose`。

## 运行模型

```text
受信任的常量 DSL
  -> initialize 一次
  -> 队列等待
  -> parse(suppressErrors: true)
  -> render(唯一 id) 得到 svg 字符串
  -> 仍是当前任务才提交
  -> sandbox iframe 展示
```

`parse` 只查语法，不验证业务 DAG、权限或是否该收费。`render` 返回字符串，不会自己挂进 React。[Mermaid 接口](https://mermaid.ai/open-source/config/setup/mermaid/interfaces/Mermaid.html)。

`mermaid.init` 从 v10 起弃用。静态页用 `run({ nodes })`。受控 React 用 `parse` + `render`，避免库去扫整份 `document` 和 React 抢节点。

服务端渲染不能调用依赖 `document` 的 render。放在 effect 里。若要预渲染，用隔离的浏览器服务，不要假设 `new Worker(import('mermaid'))` 能搬走 DOM。

包要求 Node >= 22.12，v12 面向 ES2024，Safari 基线大约 17.4。这是上游兼容门槛，不是本 Lab 已经在那些浏览器里点过的证据。

## 三层

### 01 流程图

三节点 flowchart。源码可见、可复制。图在 iframe 里，脚本不能跑。容器最小高度 280。

### 02 时序

四步 sequence：请求、Worker、摘要、列表。参与者名称写在源码常量里，不是用户输入。研究稿的 6 节点 RSS 链路、`GET /api/flow`、revision 7、POST 发布和 409，都还是生产教学：同一份领域模型生成 DSL，服务端用修订号，Abort 不能代替乐观锁。Lab 没有这条 API。

### 03 状态图与失败

合法状态图和非法片段切换。非法路径只留错误文本。队列保证后一次渲染不会被先排队的慢任务覆盖。生产还应限制源长度、节点数和边数（研究稿用过 40 节点、100 边、12000 字符，那是应用预算，不是官方上限）。

## 从业务对象生成 DSL

不要把接口返回的 `node.id` 直接拼进语法。生成 `n0`、`n1`，用户可见文字放进引号并限制长度和分隔符。状态用白名单。边必须引用已知节点，拒绝自环和重复。这不能代替 HTML 消毒。若文章里允许原始 HTML，还要 rehype 和 DOMPurify，`remark-gfm` 不负责这件事。

```ts
// 错：业务 id 和标签直接拼接
const bad = `flowchart LR\n  ${userId}[${userLabel}] --> ${other}`;
// 对：内部 id，标签来自经过清洗的常量或白名单
const good = `flowchart LR\n  n0["RSS源"] --> n1["正文抓取"]`;
```

## 反例

| 错误 | 正确 |
|---|---|
| 每次 render `initialize` | 模块里一次，`startOnLoad: false` |
| `mermaid.init()` 扫描文档 | `parse` + `render`，或静态 `run({nodes})` |
| `dangerouslySetInnerHTML` 灌用户 DSL | DSL 是数据。只展示 `render` 的 SVG，并放进 sandbox iframe |
| `securityLevel: 'loose'` 换点击 | 保持 strict。交互放到受控数据层 |
| 固定 `id="mermaid"` | 每次唯一 id。Lab 用递增前缀 |
| 每敲一字就布局 | 防抖或显式应用。Lab 源是常量，没有输入框 |
| 慢请求直接 setState | 序号或 `isCurrent`。Lab 队列已做后半句 |
| 失败仍留着上一张 SVG | 先清空。Lab 在 effect 开头 `setSvg('')` |
| 只靠 `parse` 当发布校验 | 另做领域规则 |
| v11 升 v12 不看布局 | 钉 `layout/theme/look` 再比截图 |
| 下载后立刻 `revokeObjectURL` | 稍等浏览器开始下载再释放。Lab 没有下载 |
| 把带外链的 SVG 当纯文本托管 | CSP 和净化。本 iframe 去掉脚本权限 |
| 用 Mermaid 拖一万个节点 | 改 React Flow 或 G6，DSL 只做只读导出 |
| 只靠颜色区分状态 | 文字说明。Lab 用段落，不是 `accTitle` |

## 组合

**Mermaid + react-markdown。** `language-mermaid` 代码块交给查看器，其它语言仍是 `<code>`。限制块大小和允许的图类型。Lab 没装 `react-markdown`。组件结构随该库版本变化，不要假设永远是 `code` 这一个插槽。

**Mermaid + TanStack Query + React Flow。** 领域节点和边是唯一事实。Query 按 pipeline id 取修订；Flow 做编辑；`toMermaidDefinition` 做只读文档。409 后失效缓存。不要把 Flow 的 SVG 拷进 Mermaid，也不要假设任意自定义节点能无损变回 DSL。

## 性能、安全、移动端

ELK 布局、长标签、连续更新都会占主线程和 DOM。先限制图的规模，再谈优化。本条目没有布局耗时数字。

`securityLevel`、`maxTextSize`、`maxEdges` 不要让文章内容覆盖。先鉴权再生成图。SVG 在别的查看器里仍可能带外链。研究稿的 Mock 曾限 64KiB，那是服务端预算；Lab 源码常量远小于此。

窄屏上复杂 SVG 要能横向滚动，并保留文本替代。iframe 没有同源权限，父页面脚本也碰不到里面的 DOM，这是隔离，不是无障碍树的完整替代。读屏顺序、400% 缩放和暗色都还要浏览器复测。

## 生产清单

1. `initialize` 一次，strict，不接收远程配置对象。
2. `parse` 失败不保留旧 SVG。
3. render id 唯一。
4. 全局渲染队列，过期任务不提交。
5. SVG 进 sandbox iframe，而不是页面 innerHTML。
6. 不调用 `bindFunctions`，除非有独立的可信交互设计。
7. 业务 id 不直接进入语法。
8. 文本说明与图同时存在。
9. v12 布局策略写进配置，不靠默认值冻结视觉。
10. SSR 不 render。

## 升级与练习

**v11 视觉迁移。** 先满足 Node 和 Safari 门槛，用 classic/dagre 对照旧图，再打开 ELK，记录折线变化。验收看节点和边是否仍对应同一业务 id，而不是像素一致。

**从 `init` 迁到受控查看器。** 两张图同时挂载、快速切换非法语法、卸载后队列不得 `setState`。验收：无跨实例覆盖、无 `loose`、错误可读。

练习：给 flowchart 加上 `accTitle` 和 `accDescr`，确认它们出现在生成 SVG 里，同时页面段落仍然在。把队列改成可取消的 generation，与 HTTP 409 分开测试。

## 故障排查

`document` 为空：在服务端调用了 render。图空白：id 冲突、容器高度、过期任务把结果清掉、worker 或字体被 CSP 拦住。`Invalid diagram`：先 `parse`，不要用正则代替解析器。标签被裁：等字体，给宽度，不要只改 viewBox。升级后折线全变：默认布局已换。Vite 构建失败：确认 ESM 和编译目标。

## 官方链接

- [Releases](https://github.com/mermaid-js/mermaid/releases)
- [用法](https://mermaid.js.org/config/usage)
- [API](https://mermaid.ai/open-source/config/setup/mermaid/interfaces/Mermaid.html)
- [安全级别](https://mermaid.js.org/config/usage)
- [无障碍](https://mermaid.js.org/config/accessibility)
- [GHSA-c4c3-pg64-4m4v](https://github.com/mermaid-js/mermaid/security/advisories/GHSA-c4c3-pg64-4m4v)
- [npm mermaid](https://www.npmjs.com/package/mermaid)

安全公告要按 12.2.0 再核对一次，不要用旧教程的 v11 默认配置解释现在的布局。

## 证据

sdk、build、browser 在 `docs/library-lab/evidence/runs/` 有本条目收据之前为 **NOT_RUN**。`queueMermaidRender` 的测试只证明过期任务不提交，不证明 `parse`/`render` 或 iframe。Actions run `41779873259` 是仓库级 install、typecheck、build、52 个 SDK 文件（153 个测试）和 45 个 Playwright，不是 A08 的 PASS，不要写入 `verification.json`。
