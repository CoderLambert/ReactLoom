# E08 rehype — Agent 实施手册

用途：HTML AST 解析/变换/序列化，必须与安全策略配套。不等于 XSS sanitizer 本身；本库示例使用 rehype-sanitize 6.0.0。

最小迁移：`examples/example.tsx` 的 `sanitizeHtml` 和受限预览；生产宿主通常只需要 `rehype().use(rehypeSanitize).processSync(input)`，不要照搬教学 DOM/UI。

必须保留：输入大小限制、sanitize 先于 DOM 注入、明确允许列表及 URL 策略；隔离 iframe 不要同时给 allow-scripts 和 allow-same-origin；远端图片、表单、iframe、JavaScript URL 等必须被独立约束。CSP 是第二道防线。
反例：parse/stringify 后直接 innerHTML；sanitize 后继续追加不可信 HTML；用 regex 删除 script 代替 AST sanitizer；仅依赖 iframe 的同源权限。
验收：真实 rehype 13.0.2 import，通过安全属性用例和真实浏览器网络/CSP检查；SDK Mock 不计入 PASS。
关联 E07 remark、E10 DOMPurify、E06 react-markdown。MIT。 https://github.com/rehypejs/rehype
