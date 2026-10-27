# C02 Zod — Agent 使用规范

## 决策条件

需要运行时数据契约、输入规范化、判别联合、跨字段验证时适合使用 Zod。仅有静态 TS 类型、现成 JSON Schema 管线或纯 HTML 净化时不要机械引入。研究版本 `zod@4.6.5`（与当前 SPA 模板对齐），MIT。

## 复制路径

从 `examples/example.tsx` 提取 `FeedSchema`、`ImportEventSchema`、`BatchPolicySchema`，放到目标项目 domain/schema；React 页面、示例 JSON 与展示适配层无需复制。下游使用 `z.input` 与 `z.output` 明确处理转换前后类型。遇到不可信数据，保留 `unknown` 直到解析成功。

## 不可删除的语义

`strictObject` 当前用于拒绝额外键；`HttpsUrl` 禁止 javascript/file 协议；`TTL` 先 .min(1) 再 coerce；`superRefine` 的 path 必须指向重复来源 URL；JSON.parse 语法错误与 Zod issues 分开报告。

## 不要这么做

- 未校验就 `as User`。
- 异步 refinement 用同步 safeParse。
- 空字符串直接强制 number 并将 0 当合法。
- 把合法 URL 当作可安全抓取的许可，服务端 SSRF 单独防护。
- 在每次中文 composition 事件里规范化并替换 DOM 文本。

## 最小测试集合

正常 RSS/OPML；额外字段；不允许的协议；TTL 空字符串；TTL "15" 解析成 number 15；重复 URL 错误位于 `sources[1].url`；畸形 JSON 不崩溃 UI。运行 `pnpm --filter @reactloom/library-lab typecheck && pnpm --filter @reactloom/library-lab build`，再针对真实SDK用例验证，浏览器结果独立记录。当前 SDK/构建/浏览器均为 NOT_RUN。

## 参考

https://zod.dev/ · https://github.com/colinhacks/zod

## 迁移注意

带走 `boundary-policy.mjs` 和其 `.d.mts`，不要跨条目依赖。URL path/query 大小写不能抹平；不能接受凭据。拒绝 OPML 路径名以及 `1e1` 等不符合产品输入合同的 TTL。输入变化后旧 PASS 必须失效；纯策略测试不能冒充真实 Zod SDK。
