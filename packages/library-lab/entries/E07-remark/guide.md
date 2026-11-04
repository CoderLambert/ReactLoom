# remark 15.0.1｜mdast 解析、GFM 规范化和链接审计

`library.json` 钉住 `remark@15.0.1` 与 `remark-gfm@4.0.1`，MIT。remark 把 Markdown 变成 mdast，再可以把这棵树序列化回 Markdown。它不创建 React 元素，不执行 HTML，也不是 sanitizer。安全展示用 E06。HTML 树用 E08。浏览器里的 HTML 字符串用 E10。

## Lab 当前示例

真实组件是 [`examples/example.tsx`](examples/example.tsx)。[`examples/demo.tsx`](examples/demo.tsx) 只再导出。审计函数在 [`examples/audit-policy.mjs`](examples/audit-policy.mjs)。

用户点开 Demo 后看到文本框。**解析不会在每个键击发生。** 要点「解析与规范化」。换 level 会清空结果和错误。没有独立工作台，也没有 `localhost:5173`。

`transform` 的顺序：

1. `TextEncoder` 字节数超过 24_000 就抛错。文本框另有 `maxLength={12000}`。
2. `remark().use(remarkGfm)` 得到一个 processor。
3. `processor.parse(source)` 得到一棵树。
4. 同一棵树交给 `auditMarkdownTree`，再 `processor.stringify(ast)`。不解析第二次。
5. 页面展示审计 JSON 和重新序列化的 Markdown 字符串。两者都在 `<pre>` 里，不是 HTML。

审计统计节点数，超过 4096 抛错。标题收集纯文本。`link` 和 `image` 的 `url` 用 `safeReference` 标 `safe: true/false`。危险 URL 仍留在审计结果里，这是信号，不是已经净化的输出。

`safeReference`：空串、超 2048、含控制字符为不安全。页内 `#` 锚用 Unicode 字母数字和 `_. :-`。站内路径必须以单个 `/` 开头，不能是 `//`，不能含反斜杠。绝对地址必须是无用户名密码的 `https:`。

| 层 | 样例 | 挂载行为 |
| --- | --- | --- |
| basic | 标题和列表 | 点按钮后看到标题列表和节点数 |
| business | GFM 表和任务列表 | 规范化 Markdown 仍是 Markdown |
| advanced | https 链接、`javascript:`、`<script>` 文本、远程图片 | 文案写明 remark 不是 sanitizer |

没有挂载：Worker、自动保存、把结果交给 react-markdown、Tiptap 导出质检按钮。

## 1. 一句话选型

要大纲、要统一 GFM 写法、要在入库前列出危险链接，用 remark。要给人看的安全页面，把字符串交给 E06，或把 HTML 交给 E08 / E10。不要用 remark 的 stringify 结果做 `dangerouslySetInnerHTML`。

## 2. 模型

```text
Markdown 字符串
    │ parse（一次）
    ▼
mdast（本示例的审计对象）
    ├─ headings / links / node count
    └─ stringify → 规范化 Markdown 字符串
```

所有权：文本框拥有原文。按钮按下后的结果是只读快照。下一次编辑不会自动更新 `<pre>`，除非再点按钮。这是故意的，避免把半成品和已审计结果混在一起。

插件只加了 `remark-gfm`。表格、任务列表、删除线属于这个插件。不在本文件里写自定义访问者去改树。审计是只读行走。

官方入口：[remark](https://github.com/remarkjs/remark)、[remark-gfm](https://github.com/remarkjs/remark-gfm)。

## 3. 三层怎么操作

在 Library Lab 打开 E07，运行 Demo，编辑，再点按钮。

### 基本

预期标题数组里有文档标题和 “Getting started”。节点数大于 1。序列化结果仍可阅读，空行和标记可能被规范成 remark 的写法。不要把格式化差异当成解析失败。

### 业务

样例表格里的 PASS / NOT_RUN 是文章文字。规范化输出里应仍能看到表格结构。这不是从 RSS 服务器拉来的数据，没有请求。

### 进阶

审计 JSON 里应同时出现安全的 https 和不安全的 `javascript:`，后者 `safe: false`。原始 HTML 在 mdast 里通常是 html 节点，本审计不把它删掉。页面上的说明要求下一步走 E08 或 E10。看到危险 URL 被列出来，不等于 XSS 已测。

## 4. 反例（带代码）

### 反例 1：把 stringify 当 HTML

```tsx
<div dangerouslySetInnerHTML={{ __html: String(processor.stringify(ast)) }} />
```

stringify 的产物是 Markdown。要 HTML 得走 rehype，并且先净化。

### 反例 2：解析两遍导致审计和输出不一致

```ts
const audit = auditMarkdownTree(remark().parse(source))
const normalized = String(remark().use(remarkGfm).processSync(source))
```

插件不同、解析两次，审计的链接集合可能和最终字符串不一致。Lab 对同一 `ast` 做审计和 stringify。

### 反例 3：在键击时 parse 大文档

```tsx
onChange={e => setAudit(auditMarkdownTree(remark().parse(e.target.value)))}
```

大文档和半截粘贴会卡住输入。Lab 用按钮。生产若要实时，放到可取消的任务里，并保留 24KiB 这类上限。

### 反例 4：审计通过就插入链接

```ts
if (audit.links.every(link => link.safe)) save(source)
```

`safe: false` 的链接仍然在原文里。审计没有改写树。入库要么拒绝，要么另写一个会改 URL 的插件，并说明改了什么。本示例不改写。

### 反例 5：用正则找链接代替 mdast

```ts
source.match(/https?:\/\/\S+/g)
```

会漏掉角括号自动链接、漏掉图片，也会把代码块里的例子当真实链接。用节点类型 `link` 和 `image`。

### 反例 6：不限制节点数

恶意嵌套可以让递归访问爆栈。Lab 用显式栈，超过 4096 节点抛错。不要改成无上限递归。

### 反例 7：把相对协议当成站内路径

`//evil.example` 不是以单个斜杠开头的站内路径。`safeReference` 拒绝它。不要为了「支持 CDN」放宽成任意协议。

### 反例 8：html 节点当成已删除

remark 默认会保留原始 HTML 节点。`skipHtml` 是 react-markdown 的渲染选项，不在这里。advanced 文案就是这个边界。

## 5. 和其他库的边界

| 库 | 责任 |
| --- | --- |
| E07 remark | mdast、规范化、列出链接 |
| E06 | React 预览，`skipHtml` 与 URL 变换 |
| E08 | HTML → hast → 允许列表 |
| E04 | 编辑原文 |
| E01 | 富文本 JSON，不是 Markdown |

组合方案都没有挂成 Demo：

**E04 + remark + 预览。** 编辑器拥有源码。按钮或防抖把字符串交给 remark 做审计，再交给 E06 显示。审计失败不阻止本地编辑，但阻止发布。

**E01 导出 Markdown。** Tiptap 导出是有损的。remark 质检只能看导出结果，不能证明编辑器 JSON 完整。发布前仍要 rehype 或 DOMPurify，如果下一步是 HTML。

**Query + 归档。** 服务器原文进入 remark 之前先卡字节数。Query 的缓存键包含 schema 版本。不要把审计 JSON 当成第二份正文。

## 6. 故障

| 现象 | 原因 |
| --- | --- |
| 点了没反应 | 看 alert 区。超过 24KiB 或节点过多会抛错 |
| 表格消失 | 没有 `remark-gfm` |
| 输出和手写空行不同 | stringify 会规范化 |
| 危险链接还在输出里 | 审计不删除。这是信号 |
| 换层后还显示上一份结果 | effect 应清空。若你删了 effect，结果会串层 |
| 中文标题统计奇怪 | 标题文本来自节点 value 拼接，不含标记符号 |

## 7. 升级核对

- `remark@15` 与更早主版本的插件签名不同。锁定 15.0.1。
- `remark-gfm@4.0.1` 与 E06 保持同一版本，避免同一仓库两套 GFM。
- 自定义插件若改树，必须仍用同一棵树做审计，或明确审计发生在改写之前。
- 不要为了通过样例而把 `javascript:` 从审计里过滤掉不显示。

## 8. 练习（未挂载）

1. 写一个只读插件，把不安全的链接改成纯文本节点，并保留原文在日志里。验收：输出 Markdown 不再含该 URL，审计发生在改写前的树上一份、改写后的树上一份。
2. 对 10 篇带表格和脚注的样本做往返，记录 stringify 改变了哪些空行。不要把差异叫数据丢失，除非节点类型变了。

## 9. 验收

1. basic：标题数量与肉眼标题一致。
2. business：输出仍是 Markdown 表格，不是 HTML table。
3. advanced：`javascript:` 的 `safe` 为 false，https 为 true，页面没有执行脚本。
4. 超限输入显示 `role="alert"`，不留下半份结果。

这些是待浏览器和 SDK 执行的清单。`examples/audit-policy.test.mjs` 只跑纯函数。

sdk、build、browser 保持 **NOT_RUN**。没有 `docs/library-lab/evidence/runs/` 的 E07 收据就不能写 PASS。Actions `41779873259` 是仓库级运行，不是本条目通过。

## 10. 资料

- https://github.com/remarkjs/remark
- https://github.com/remarkjs/remark/tree/main/packages/remark
- https://github.com/remarkjs/remark-gfm
- https://github.com/syntax-tree/mdast
