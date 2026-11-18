# C02 Zod 接入指南

使用已安装的 `zod@4.6.5`（MIT），边界输入为 `unknown`，消费 `safeParse` 成功后的 `data`。场景是订阅导入 JSON 描述，不解析 RSS/OPML XML，不发请求。

## 迁移文件与模型

源码面板的 `examples/demo.tsx`、`example.tsx`、`schemas.ts`、`boundary-policy.mjs`、`boundary-policy.d.mts` 都需保留。UI 与 SDK 测试导入同一组 Schema；`example.tsx` 保持 React 实验的唯一实现并再导出 Schema/type，避免复制规则。

- `FeedSchema`：strictObject 拒绝未知键；title/url trim；HTTPS、无凭据等是 helper 的自建业务约束。
- `ImportEventSchema`：按 kind 选择 RSS URL 或 OPML 文件名/分组；文件名只是元数据验证。
- `BatchPolicySchema`：TTL 先拒绝空串/非标准正整数再转换到 1–60，input:string、output:number；superRefine 给每个后续重复项添加 sources.index.url。
- `canonicalHttpsFeedUrl` 产生去重身份键，主机/default443/fragment 会影响比较，path/query 大小写保留。Schema 仅 trim 输出 URL，不将身份键替换到字段中。该 helper 不是 SSRF 控制或 HTML 净化器。

## 页面行为

编辑、切场景、载入反例、重置均失效旧输出。JSON.parse 错误与 issues 分开；textarea 有 label、aria-invalid/describedby，错误用 role=alert。Schema 在模块顶层，无网络/定时器/订阅清理。异步规则需另接 safeParseAsync 和调用方取消/代次控制，不要声称当前已覆盖异步竞态。

## 验证

`tests/sdk.test.mjs` 使用实际 Schema；`tests/boundary-policy.test.mjs` 只证明自建 helper。先检查 [`local-validation.md`](local-validation.md) 的命令、输入摘要及范围，再检查独立 review / browser 记录。正式 verification 与本地运行分开，未满足正式记证条件保持 NOT_RUN。官方英文原文、docs-v3 中文候选审查、固定版本与首页响应头见 official/source-audit.json。
