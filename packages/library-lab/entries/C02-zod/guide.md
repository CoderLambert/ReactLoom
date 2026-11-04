# Zod 4：把不可信输入转换为经过验证的业务数据

> C02 · 固定演示版本 `zod@4.6.5`，与现有 ReactLoom SPA 模板一致；MIT。此处为重新编写的教学实现，SDK 测试、构建和浏览器验证尚未执行。

## 何时使用

从 API、URL、配置、OPML、localStorage、消息队列接收到的值即使声明为 TypeScript 类型，在运行时仍是 **unknown**。Zod 用 schema 提供运行时校验和规范化；**不负责**网络安全、权限、HTML 净化、数据库一致性或 SSRF 防护。现有业务以 JSON Schema 为唯一契约时可对比 C05 Ajv；主要目标是 bundle 极小可对比 C03 Valibot。

## 安装与代码

```bash
pnpm add zod@4.6.5
```

```ts
import * as z from 'zod';
const RSS = z.strictObject({
  title: z.string().trim().min(2),
  url: z.string().url().refine(value => value.startsWith('https://')),
});
const parsed = RSS.safeParse(JSON.parse(jsonText) as unknown);
if (!parsed.success) console.log(parsed.error.issues);
else console.log(parsed.data);
```

实际可执行 schema 与交互见 `examples/example.tsx`；`examples/demo.tsx` 只重新导出，因此站内代码视图与运行源码完全一致。

## 三层教学场景

### 入门：`safeParse`、`strictObject`、trim

编辑 RSS JSON 并点击“运行 safeParse”。成功结果中的 `title` 已 trim。把 `title` 改为一个字符、`url` 改为 `javascript:`，或者增加未知字段，都会形成可展示的结构化错误。Zod `z.object` 默认有不同的未知字段策略，本例选择 `z.strictObject` 明确拒绝额外键。

### 业务：判别联合

`z.discriminatedUnion('kind', ...)` 表达 rss/opml 两类输入。opml 必须有 filename 和 groups；rss 只接受 url。相比手写 `if (kind)`，schema 保留明确错误路径，避免把类型断言当作验证。

### 边界：跨字段重复与输入/输出差异

TTL 从字符串进入，使用 `z.string().trim().min(1).pipe(z.coerce.number().int().min(1).max(60))`。这样空字符串不会被 JS `Number('')===0` 误处理。多来源 `superRefine` 检测重复 URL，错误路径精确至 `sources[n].url`。可比较 `z.input<typeof Schema>`（TTL 字符串）和 `z.output<typeof Schema>`（TTL 数字）。

## 生产边界

- 永远在不可信边界校验 `unknown`，不要 `as Feed` 绕过。
- `parse()` 失败抛异常；交互表单推荐 `safeParse()` 结果分支，不要吞掉 `issues`。
- 涉及异步 refinement 使用 `safeParseAsync()`，不能以同步校验处理异步规则。
- `z.coerce.number()` 单独用于金额可能产生精度损失；金额/结算应采用十进制库 D05 decimal.js。
- `z.url()` 和字符串前缀只能证明形式，不证明目标地址可安全抓取；服务端 DNS / 私网 / 重定向策略单独处理。
- 中文 IME 期间保留原始输入，避免每键解析并覆盖 textarea 光标位置。
- schema 复杂度与错误对象成本应在真正的批量热路径测量，不能照抄第三方基准作为本项目性能结论。

## 错误反模式

1. `const x = response as User`：只改静态类型，运行时毫无保证。正确：`safeParse(response)`。
2. `z.coerce.number().min(0)` 直接接收空输入：可能意外变成 0。正确：先拒绝空白再转换。
3. `safeParseAsync` 场景却调用 `safeParse`：异步约束未正确执行。正确：依据 refinement 模型选择异步入口。
4. 验证完 URL 就让服务器 fetch：SSRF 风险仍然存在。

## 与其他库组合

C01 RHF 管表单字段、焦点和 dirty；Zod 管值/结构校验。集成时应选与当前 Zod 版本兼容的 `@hookform/resolvers`，明确字段路径映射。C05 Ajv 优先使用已存在 JSON Schema 的工程；C03 Valibot 可以做 bundle 大小比较。

## 练习与验收

1. 把第三方 RSS JSON 作为 unknown 输入后做 strict schema 校验，断言非法 URL 和未知字段被拒。
2. 测试 OPML/r​​ss 判别联合错误路径、两个重复订阅源、空 TTL、变换后数值 TTL。
3. 使用真实官方 SDK 执行，记录失败与环境；再运行生产浏览器，检查 textarea 可编辑、错误 aria-live。

当前 `verification.json` 均未声明真实 PASS。

## 官方一手资料

- [Zod 官网](https://zod.dev/)
- [Zod 仓库](https://github.com/colinhacks/zod)
- [Zod 4 迁移指南](https://zod.dev/v4/changelog)

## 已加固的 URI、OPML 与结果所有权

演示真实导入 `examples/boundary-policy.mjs`：主机名/默认端口经 URL 规范化，path/query 保持大小写，忽略 fragment，拒绝凭据、非 HTTPS、控制符。不得把整串 URL 转小写以判断重复；错误定位到第二条 `sources[n].url`。OPML 元数据仅允许单独文件名，不允许路径；TTL 不接受指数记数法。修改 JSON 或切换 level 会清除旧验证结果。此处并不是服务端 SSRF/重定向/DNS 防线。

无依赖策略测试：`node --test packages/library-lab/entries/C02-zod/tests/boundary-policy.test.mjs`；真实 Zod SDK 需独立执行 `tests/sdk.test.mjs`。
