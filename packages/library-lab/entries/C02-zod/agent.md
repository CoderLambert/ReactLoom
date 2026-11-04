# C02 Zod — 工程手册

## 适用

不可信 JSON、表单提交和导入配置的运行时边界。单个布尔不必用。不要把 Zod 当成 HTTP 客户端、表单状态或 SSRF 防护。

## 版本

`zod@4.6.5`，MIT。研究笔记中的 4.6.7 不是本仓库的 pin。v4 用 `z.strictObject`、`z.discriminatedUnion`、`z.input` / `z.output`。空串必须先挡住再 `z.coerce.number<string>()`。

## 迁移

带走 `examples/example.tsx` 的三个 schema 和 `examples/boundary-policy.mjs`（含 `.d.mts`）。`demo.tsx` 只是再导出。用项目的 API client 替换本地 JSON 文本框。异步查重另加 `safeParseAsync`、AbortSignal 和 generation，不要把按钮上的同步 `safeParse` 说成已经防了竞态。

## 不可删的清理

schema 放在模块顶层。未知导入用 `strictObject`。URL 必须经过 `canonicalHttpsFeedUrl`，非法 URL 不能当去重键。TTL 的 pipe 保持「先正则、再数值范围」。卸载或草稿被替换时，尚未返回的 async parse 不得写回。

## 反例

```ts
const data = (await res.json()) as Feed
z.coerce.number() // '' → 0
schema.safeParse(input) // schema 含 async refine 时不会等待
z.compile(schema) // 未经 CSP 和热点证据不要默认开
```

- 用 `z.url()` 放行抓取。
- 用 `z.object` 导入可能带 `isAdmin` 的配置。
- composition 期间把 parse 结果写回受控输入。
- 日志打印 `issues` 或原始 token。
- 把 `z.toJSONSchema` 当成 `superRefine` 的双向合同。

## 测试断言

- `javascript:`、带用户信息的 URL、控制字符失败；`https` 主机大小写与 fragment 被规范化。
- path 大小写保留，不能因此被当成重复。
- OPML 文件名不能含 `/` 或 `\`。
- TTL `''` 不是 0；`'15'` 的 output 是 number。
- 重复 URL 的 path 是 `sources` 下标加 `url`。
- 策略单测不是浏览器里跑过 `safeParse` 的证据。

## 真实限制

示例不发网络，没有 RHF resolver，没有 `z.compile()`。中文 IME 只在「不要在输入过程中回写」这条原则上被遵守，没有在真实输入法里验收。`canonicalHttpsFeedUrl` 不解析 DNS。

## 证据

没有 `docs/library-lab/evidence/runs/` 收据就不要写 PASS。仓库级 Actions 41779873259 不能抄到本条目。不要改 `verification.json`。
