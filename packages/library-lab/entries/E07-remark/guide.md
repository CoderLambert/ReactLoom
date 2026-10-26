# remark：Markdown 作为结构化数据的工程处理

## 什么时候用

Markdown → **mdast** → 插件/规则 → Markdown。这是 remark 的设计边界。适合新闻/RSS 内容导入整理、GFM 报告规范、标题/链接检查和文档迁移。若只需在 React 页面展示，优先 E06 react-markdown；若目的是 HTML AST 净化，使用 E08 rehype + sanitize。编辑器另用 E04/E05，不要用 AST 处理器替代可编辑文档状态。

## 安装

```bash
pnpm add remark@15.0.1 remark-gfm@4.0.1
```

版本来自研究时官方发行基线，PLATFORM 负责实际 lockfile/peer 校验，未执行前不得标 SDK PASS。

```ts
import {remark} from 'remark'
import remarkGfm from 'remark-gfm'
const processor = remark().use(remarkGfm)
const mdast = processor.parse('# Heading')
const markdown = String(processor.processSync('**bold**'))
```

## 实战三层

**入门**：输入 Markdown，取 mdast 的标题节点数量及规范化结果。**业务**：GFM 表格、任务清单和字段完整性用 AST 进行审计并重新序列化，不能按普通字符串拆行解析复杂表格。**边界**：扫描 link/image 的 URL，标出 javascript: 等危险协议，原始 HTML 作为 raw 文本节点保留而不执行。示例源码为 `examples/example.tsx`，由网站同源显示源码。

## 内容流水线

1. parse：读取 Markdown 字符串，形成结构化语法树；与 HTML DOM 无关。
2. transform：可使用插件修改 mdast、添加 data 或检查节点。多个插件有执行顺序，需固定可信来源。
3. stringify：将 AST 序列化回 Markdown，格式可能变化但语义应保持。行号与源码映射会受改写影响，不能原样引用旧位置。
4. render：另由 react-markdown 或 remark-rehype + rehype-sanitize 渲染，**不得把序列化结果直接当安全 HTML**。

## 生产最佳实践

- **不要用正则操作结构**：嵌套列表、转义、链接和 fenced code 都会误判，应遍历 mdast。
- **插件信任边界**：第三方插件会执行 JS，不能把用户输入当作动态可执行插件。
- **URL 独立审计**：Markdown AST 可以包含 javascript:，即使解析成功也不代表安全可点击。生产应按协议/域名/上下文校验，并限制图片来源。
- **文件规模**：限制输入大小、处理深度和处理时间。频繁逐字符重新 parse 大文档成本高，可在 Worker 或输入停顿后执行。
- **处理器生命周期**：复用配置相同的 Processor，不在每个 React render 中重新组装昂贵插件栈。变化较大的管线要拆分。
- **纯文本结果不执行 HTML**：演示用 React `<pre>` 输出，安全性基于文本节点；生产 HTML 另走 E08/E10。

## 错误模式与修复

错误：以 `String(processSync())` 为 HTML 直接插入 innerHTML；修复：明确序列化 Markdown 与 HTML 两条流程。
错误：把 GFM 表格当 `| ` 切分；修复：remark-gfm AST。
错误：将用户提供的 URL 直接生成点击链接；修复：URL 允许列表和渲染层安全策略。
错误：根据语法通过就把 HTML/脚本当安全；修复：HTML 和代码执行是另一个权限域。

## 验收断言

安装真实 SDK 后，`remark().use(remarkGfm).parse()` 对表格/标题生成预期结构，序列化不执行脚本，恶意协议被审计标出；浏览器直接检查文本与网络。源码当前已写，但 SDK、build 和 Browser 仍 NOT_RUN/BLOCKED。

官方：[remark](https://github.com/remarkjs/remark)、[GFM](https://github.com/remarkjs/remark-gfm)。MIT。
