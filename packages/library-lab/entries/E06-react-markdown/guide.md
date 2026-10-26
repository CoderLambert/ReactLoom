# E06 · react-markdown：安全 Markdown 组件与可扩展渲染链

## 适合什么问题

在 React 内显示经过审查的 Markdown 内容、项目 README、新闻笔记和工具说明，不必自己解析 AST。它并非 MDX 执行器，也不是富文本编辑器。Lab 自身的文档 Tab 同样复用它，但本条目的 Demo **独立演示真实包**，不伪造 Markdown 结果。

## 安装和源码

```sh
pnpm add react-markdown@10.1.0 remark-gfm@4.0.1 rehype-sanitize@6.0.0
```

实现 `examples/example.tsx`：实际渲染原文，传入 GFM 插件、HTML 清理插件、`skipHtml` 和自定义 URL 策略。`examples/demo.tsx` 仅导出同一文件供 Lab 动态加载。

## 三个真实场景

1. **basic**：标题、粗体、行内代码与官方链接。观察 React 输出是元素树，不需要自己调用 `innerHTML`。
2. **business**：GFM 表格和任务清单，适合显示 CI/验收说明。用户可编辑 Markdown 原文，结果同步改变。
3. **advanced**：特意输入 JavaScript 协议链接、script 标签、事件属性和远程图片，验证安全渲染策略。这里图片仅展示 alt 提示，不请求外部资源。

## 管道与可扩展性

原文 Markdown → remark 解析 MDAST → remark-gfm 扩展 → remark-rehype 转 HAST → rehype-sanitize 清理 → React 元素组件映射。不要把 `rehype-raw` 与未经适配的插件直接引入不可信文档，否则可能改变 HTML 的解析和清理边界。必要的 HTML 支持应有专门 allowlist 与安全测试；没有需求时优先 `skipHtml`。

`urlTransform` 是最终 URL 策略，本示例仅允许 `https:` 与页内锚点。用户生成的文档如果要支持本地相对链接、图片资源或 GitHub 链接，必须单独建立以文档源路径为基准的解析器，防止 `../` 跳转和资源滥用，不能一律放行。React 自带字符串转义不等于自定义 renderer/plugin 安全。

## 常见反模式

- 使用 `dangerouslySetInnerHTML` 直接承载用户 Markdown：绕开 AST 层面的组件控制与 XSS 防护。改用 React 元素输出。
- 插件顺序随意调整并引入 `rehype-raw`：新 HAST 语义可能绕过已有规则。必须复核 sanitizer 与 HTML 支持策略。
- 允许任意 `data:`、`javascript:`、`file:`：不能靠 `rel=noreferrer` 补救危险协议；渲染前拒绝。
- 将所有图片直接变为远程 `<img>`：增加跟踪和大流量加载风险，应有允许域、代理或延迟策略。
- 每次编辑都同步执行昂贵语法高亮：应按需加载 Shiki，高频输入合并更新，避免阻塞主线程。

## 生产建议

长文档保留 DOM 语义、浏览器查找与锚点；按需处理代码块、重型图表、数学插件，不要无脑全文虚拟化。编辑器与预览应合理分离；动态插入自定义 React 组件要确保 props 被校验，不能把 Markdown 的任意字段解释为权限或执行参数。代码复制操作从原始代码文本获取，避免把 HTML 高亮节点内容误认为原始字符串。

## 组合与练习

- `remark` 处理 Markdown AST，`rehype` 决定 HTML AST 的变换和安全；`Shiki` 负责代码高亮并按需加载。
- 练习：将一篇新闻 Markdown 渲染为目录、引用、表格；添加恶意 URL 单测，确认无实际请求。
- 练习：添加局部的代码块复制按钮，复制内容与原 Markdown 一致，并保证键盘可操作。

## 当前验证

本条使用现有平台依赖版本，尚未执行带安装依赖的类型/构建/浏览器验收。静态示例与文档不能标 SDK PASS。请以 `verification.json` 为准。

## 官方参考

- https://github.com/remarkjs/react-markdown
- https://github.com/remarkjs/remark-gfm
- https://github.com/rehypejs/rehype-sanitize
