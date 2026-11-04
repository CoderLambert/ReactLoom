# C03 Valibot — 工程手册

## 适用

TypeScript 手写的运行时边界，尤其是要按 action 裁剪包体、把跨字段错误指到具体键的表单和导入。不要把它当成鉴权或 SSRF。已有 Zod 4 契约时先测量再决定是否重写。

## 版本

`valibot@1.4.2`，MIT。研究笔记的 1.5.0 不是 pin。v1 的写法是 `v.pipe(v.string(), v.trim(), …)`，不是 `v.string([actions])`。

## 迁移

带走 `examples/example.tsx`、`examples/boundary-policy.mjs` 和声明文件。`demo.tsx` 留下。提交边界继续 `v.safeParse(..., { abortEarly: false })`。导入协议如果不能容忍未知键，把 `v.object` 换成 `v.strictObject`，并补负例。异步规则改 `safeParseAsync`，不要沿用按钮上的同步调用。

## 不可删的清理

URL 继续走 `canonicalHttpsFeedUrl`。公历继续走 `isRealCivilDate`，不要改成 `Date.UTC` 解析 0–99 年。日期顺序保持 `partialCheck` + `forward` 到 `end`。issue 不要整包写入日志。组件卸载后，尚未完成的 async parse 不得 `setState`。

## 反例

```ts
v.pipe(v.string(), v.transform(Number)) // '' → 0
v.pipe(schema, v.check(input => input.start <= input.end)) // 类型失败时可能不执行
v.safeParse(asyncSchema, input) // 异步 pipe 不会在这里跑
```

- 草稿 state 用 `InferOutput`。
- `v.object` 导入可能带越权字段的配置。
- 把 `v.url()` 或 `v.isoDate()` 当成安全或历法的全部。
- 在组合输入期间把 trim 结果写回控件。
- 在 SSR 单例上 `setGlobalConfig` 切换语言。

## 测试断言

- 非 HTTPS、带用户信息、控制字符的 URL 不能通过。
- `2026-02-30` 失败，`2024-02-29` 通过，`1900-02-29` 失败。
- 结束早于开始时，路径键是 `end`。
- `abortEarly: false` 时可以同时看到多条 issue。
- 策略单测没有执行 `v.safeParse`，不能冒充 SDK。

## 真实限制

示例不发网络，没有 resolver，没有 `strictObject` 演示。当前 `v.object` 会丢掉未知键，这和导入场景的推荐相反，迁移时要改。中文 IME 未在真机验收。

## 证据

没有收据不要写 PASS。Actions 41779873259 是仓库级结果，不是本条目。不要改 `verification.json`。
