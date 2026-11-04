# E06 react-markdown — 工程手册

## 适用

把完整 Markdown 字符串渲染成 React 元素：报告、知识库、RSS 预览。编辑源码用 E04。结构审计用 E07。已是 HTML 的字符串用 E08 或 E10。流式半截标记不要直接当本库的已完成场景。

## 版本

`react-markdown@10.1.0`、`remark-gfm@4.0.1`、`rehype-sanitize@6.0.0`，MIT。三包按 `library.json` 一起锁定。不要从 v9 教程删除 `skipHtml` 或 `urlTransform`。

## 迁移

复制 `examples/example.tsx` 的 `remarkPlugins`、`rehypePlugins`、`skipHtml`、`urlTransform` 和 `components`。URL 与链接、图片组件以 `examples/render-policy.mjs` 为唯一实现，不要在 JSX 里再写一套正则。`examples/demo.tsx` 只是再导出。产品数据用 Query 传入字符串，不要把预览 DOM 存回数据库。

## 不可删的清理

`skipHtml` 必须留下。`rehypeSanitize` 必须留下。`safeMarkdownURL` 只接受无凭据 `https:` 和有限页内锚，失败返回 `''`。`components` 禁止展开未知 props。`img` 不读取 `src`。level 变化时若组件不卸载，effect 要重置原文。文本框保持上限。

## 反例

- `rehype-raw` 或去掉 `skipHtml`。
- 默认 `urlTransform` 或自己用正则删 `<script`。
- `a: (props) => <a {...props} />`。
- `<img src={src}>` 打开展示跟踪图。
- 把 `innerHTML` 当存储。
- 每个键击写入全局 store。
- 用 advanced 样例的视觉正常宣称 XSS 已在浏览器测过。
- 把 GFM 样例表格里的 PASS 文字写成条目验收。

## 测试断言

- `javascript:`、带用户名的 URL、含控制字符的地址变成空，链接降级为 `span`。
- 页内锚字符集以外的 hash 被拒绝。
- 图片组件不输出 `src`。
- 浏览器里 advanced 样例的 DOM 没有 `script`、事件属性或可导航的危险 href。没有收据就保持未测。
- 策略模块与渲染组件必须继续引用同一文件。

## 真实限制

`rehype-sanitize` 在这里是默认调用，不是 E08 那份更窄的 schema。12_000 字符是文本框限制。示例不拉远程文章，不做 Shiki，不做流式重解析。SSR 水合未测。

## 证据

sdk、build、browser 保持 NOT_RUN，直到 `docs/library-lab/evidence/runs/` 有 E06 收据。Actions `41779873259` 是仓库级运行，不是本条目 PASS。不要把未跑的 XSS 观察写成通过。

资料：https://github.com/remarkjs/react-markdown 与 https://github.com/rehypejs/rehype-sanitize 。
