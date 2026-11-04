# E10 DOMPurify — 工程手册

## 适用

必须把不可信 HTML 显示成有限富文本。普通 React 文本不要绕道净化。

## 版本

`dompurify@3.4.17`。策略在 `examples/html-policy.mjs`，不要改成默认配置。

## 迁移

`DOMPurify.sanitize(dirty, htmlPolicy)` 整段调用一起带走。允许标签、`href`/`title`、https 正则都要在。不要加 `USE_PROFILES`。

## 不可删的清理

输入变化就重新净化，不要复用旧字符串。预览卸载时丢掉对旧 HTML 的引用。不要把净化前后的原文写进持久日志。

## 反例

- 无配置的 `sanitize(userHtml)`。
- `USE_PROFILES` 和 `ALLOWED_TAGS` 同时开。
- 允许 `style`、事件属性或任意 URL。
- 用正则删 `<script>`。
- 把策略常量测试当成浏览器 XSS 通过。

## 测试断言

- 允许列表不含 `script`、`img`、`iframe`。
- 属性只有 `href` 和 `title`。
- `javascript:`、`data:`、带用户信息的 URL 对不上正则。
- 浏览器里净化后的 DOM 不含这些节点。后一项还没有收据。

## 真实限制

Lab 没有 Trusted Types，也没有 jsdom 服务端净化。正则不是完整 URL 解析器。

## 证据

没有收据不要写 PASS。`html-policy` 单测不 import DOMPurify。
