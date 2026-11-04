# E08 rehype — 工程手册

## 适用

不可信 HTML 要进允许列表，并且用 hast 流水线而不是手写正则。Markdown 用 E06 或 E07。浏览器 DOM 净化器的字符串 sink 用 E10。代码着色不要走 HTML 解析。

## 版本

`rehype@13.0.2`、`rehype-sanitize@6.0.0`，MIT。schema 只存在于 `examples/sanitize-policy.mjs`。不要改用 sanitize 的默认导出而不传 `strictHtmlSchema`。

## 迁移

保持按钮触发的 `processSync`：先卡 25_000 字节，再 `rehype().use(rehypeSanitize, strictHtmlSchema)`。净化字符串先进 `<pre>`，再进 `sandbox=""` 且带全拒绝 CSP 的 `srcDoc`。不要先渲染原始 HTML。`examples/demo.tsx` 只是再导出。产品若要 href，先改 schema 和负例，不要在 JSX 里拼接。

## 不可删的清理

换 level 清空输出和错误。iframe 不得加入 `allow-scripts` 或 `allow-same-origin`。`protocols.href` 保持空数组，`a` 的属性列表里不要擅自加回 `href`。`strip` 里的脚本、样式、iframe、表单、svg、math 保持剥离。卸载后不得把旧结果写入 state。

## 反例

- `srcDoc={source}` 使用原始输入。
- 默认 `rehypeSanitize()` 不传 schema。
- 正则删 `script`。
- 净化后把用户字符串拼进 `href`。
- sandbox 加脚本令牌，再用 CSP 自我安慰。
- 父页面读取 iframe 文档并插回主 DOM。
- 渲染路径里对大文档无上限 `processSync`。
- 宣称 iframe 看起来正常就是 XSS 已测。

## 测试断言

- advanced 样例的输出文本不含 `script`、事件属性、`javascript:` 和 `iframe`。
- business 样例不保留 `href`。
- 超过 25KiB 抛错且不更新预览。
- iframe sandbox 为空，CSP 为 `default-src 'none'` 这一组拒绝指令。
- Node 场景测试不是浏览器 XSS 收据。

## 真实限制

同步 `processSync` 会占主线程。schema 比「能看的富文本」窄，链接不能导航。没有远程图片代理。Playwright 未跑。与 E10 的允许列表不是同一份配置。

## 证据

sdk、build、browser 保持 NOT_RUN，直到 `docs/library-lab/evidence/runs/` 有 E08 收据。Actions `41779873259` 是仓库级运行，不是本条目 PASS。

资料：https://github.com/rehypejs/rehype 与 https://github.com/rehypejs/rehype-sanitize 。
