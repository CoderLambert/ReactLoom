# E07 remark — 工程手册

## 适用

入库前解析 Markdown、抽标题、规范化 GFM、列出危险链接。给人看的页面用 E06。HTML 净化用 E08 或 E10。remark 的 stringify 不是 HTML。

## 版本

`remark@15.0.1`、`remark-gfm@4.0.1`，MIT。与 E06 的 gfm 版本保持一致。不要用 remark 12 的教程改 15 的 processor 调用。

## 迁移

复制 `transform`：先卡 24_000 字节，再 `remark().use(remarkGfm)`，`parse` 一次，同一棵树交给 `auditMarkdownTree` 和 `stringify`。策略只放在 `examples/audit-policy.mjs`。按钮触发，不要在 onChange 里解析。结果放文本节点。`examples/demo.tsx` 只是再导出。

## 不可删的清理

换 level 必须清空结果和错误。节点行走有 4096 上限，用显式栈。审计不改树；危险 URL 留在报告里并标 `safe: false`。不要把 Markdown 字符串写入 `dangerouslySetInnerHTML`。超限抛错后不要保留上一次成功结果冒充本次。

## 反例

- stringify 结果当 HTML。
- 审计和序列化各 parse 一次。
- 每个键击 parse。
- 正则抽取 URL。
- 全部 `safe: true` 才保存，但从不删除不安全链接，调用方以为原文已干净。
- 无上限递归。
- 把 `//host` 当成站内路径。
- 以为 remark 会丢掉原始 HTML 节点。

## 测试断言

- `javascript:`、协议相对 URL、带用户名的 https、超长 URL 为不安全。
- 无凭据 https、单个斜杠的站内路径、合法 hash 可以为安全。
- 超过 4096 个节点抛错。
- 页面输出是 Markdown 字符串。advanced 不执行 script。
- 纯函数测试不是 remark SDK PASS。

## 真实限制

示例不改写 AST，不渲染 React Markdown，不访问网络。24KiB 是字节上限，文本框还有 12_000 字符上限。GFM 样例里的 PASS 字样不是验收结论。

## 证据

sdk、build、browser 保持 NOT_RUN，直到 `docs/library-lab/evidence/runs/` 有 E07 收据。Actions `41779873259` 是仓库级运行，不是本条目 PASS。

资料：https://github.com/remarkjs/remark 与 https://github.com/remarkjs/remark-gfm 。
