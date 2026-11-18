# Zod：让订阅导入的 JSON 成为可信 DTO

订阅导入拿到一段 JSON：标题可能只有空格，URL 可能带凭据，批次 TTL 来自文本框。TypeScript 类型只检查编译时的代码，不能证明这份运行时输入有效。这里用 `zod@4.6.5` 定义边界：输入先当 `unknown`，通过 `safeParse` 后才使用 `result.data`。

适合用它把前后端 TypeScript 类型、表单提交和导入数据的规则放在一起维护。如果合同已经是 JSON Schema，先考虑 Ajv；如果主要目标是较小的客户端校验代码，可比较 Valibot。Zod 不管理表单焦点，也不解析 RSS/OPML XML；本页的 RSS/OPML 是本地 JSON 导入描述。

## 核心模型：输入和输出可以不同

Schema 同时描述运行时约束和静态类型。`safeParse` 返回 `{ success, data }` 或 `{ success, error }`；错误的 `issues` 含字段路径。`trim` 和数值转换会改变成功输出，必须使用 `data`，不能验证后又提交原始输入。

[`schemas.ts`](examples/schemas.ts) 是页面和真实 SDK 测试共同导入的实现。最小接入是：

```ts
import { FeedSchema } from './schemas'

const input: unknown = JSON.parse(raw)
const parsed = FeedSchema.safeParse(input)
if (parsed.success) {
  // parsed.data.title 已 trim；这里只消费验证后的 DTO。
  saveFeed(parsed.data)
} else {
  showErrors(parsed.error.issues)
}
```

`saveFeed` 和 `showErrors` 是接入位置，完整可运行的本地展示在 [`example.tsx`](examples/example.tsx)。JSON 语法解析失败和 Schema 规则失败分别处理。三个 Schema 都使用 `strictObject`，所以未知键会报错；通常的 `z.object` 会剥离未知键，选择哪种行为应由导入合同决定。

## 实验一：字段约束和真正的输出

运行「安全 RSS 数据解析」，点「运行 safeParse」。标题从 `"  前端实战  "` 变成 `"前端实战"`，页面展示的是实际 `parsed.data`。点「加载失败样例」再验证，会看到短标题、URL 和根对象未知键的错误。手动修改文本会清掉旧结果，直到再次明确验证。

`FeedSchema` 先检查字符串并 trim，再校验 URL 语法和业务规则。业务 helper [`canonicalHttpsFeedUrl`](examples/boundary-policy.mjs) 拒绝非 HTTPS、凭据、控制字符等输入，返回供去重使用的身份键。**Schema 只 trim URL 字段，没有把该身份键写回输出 URL。** 主机大小写、默认端口和 fragment 的处理影响身份比较，不能说成输出字段已被重写。

这份 URL 规则是示例自建策略。它不检查 DNS、目标内网地址或跳转，实际抓取仍需要服务端出站控制。输出作为 React 文本展示，不代表 Zod 会净化 HTML。

## 实验二：按 kind 选择业务结构

切到「RSS/OPML 判别联合」，验证默认的 OPML 元数据。`discriminatedUnion('kind', …)` 先按 `rss` / `opml` 选分支，再检查字段：RSS 需要 URL；OPML 需要不含目录的 `.opml` 文件名和至少一个非空分组。它不读取文件，也不导入订阅。

点「加载失败样例」会看到 `filename` 和 `groups` 错误。把 `kind` 改成 `csv` 会在判别字段失败；把输入改成 `{ "kind": "rss", "url": "https://example.com/feed" }` 会进入另一个分支。跨分支夹带 `filename` 会因为严格对象报错。业务新增一种导入格式时，应新增分支及样例，而不是扩大类型断言。

## 实验三：TTL 转换与跨行去重

切到「TTL 转换与来源去重」并运行。输入 `ttlMinutes` 是 `"15"`，输出是数字 `15`。[`schemas.ts`](examples/schemas.ts) 先以字符串非空和正则拒绝空值、前导零及指数格式，再 `pipe` 到整数 1–60：直接 `coerce.number()` 会把空字符串变成 0，不能代替明确的输入合同。

```ts
type BatchInput = z.input<typeof BatchPolicySchema>   // TTL 是 string
type BatchOutput = z.output<typeof BatchPolicySchema> // TTL 是 number
```

点「加载重复来源」再验证：两个 URL 只差主机大小写、默认端口和 fragment，身份键相同，错误落在后出现的 `sources.1.url`。将第二个路径改成 `/feed`（与 `/Feed` 不同）则不重复；路径和 query 大小写不折叠。`superRefine` 是跨字段规则，逐个检查并为每个后续重复项添加精确路径，规则和提示均由示例编写，Zod 提供校验执行和 issue 模型。

「加载失败样例」的空 TTL 与「加载重复来源」分开观察，避免基础字段失败阻止后续规则时误以为已经验证了去重。数组限制 1–5 项，生产导入还应在 JSON.parse 之前根据业务限制原始字节数。

## 迁入项目

带走源码面板的五个文件：React 入口、组件、`schemas.ts`、业务 helper 和其声明，安装 `zod@4.6.5`；组件没有额外 CSS、资源或网络依赖。Schema 放模块顶层；React 状态只保存草稿、当前错误和成功输出。切换场景、编辑、加载反例和重置都会清掉旧输出，示例没有定时器或外部订阅。

接分字段表单时，可让 React Hook Form 管输入状态，Zod 管规则；草稿用 `z.input`，提交用 `z.output`。本例没有异步规则；若接入异步可用性检查，改用 `safeParseAsync` 并由调用方取消请求、拒绝过期结果。不要把同步按钮示例当成已实现的网络查重。

## 官方资料与验证入口

- [Zod 官方 API](https://zod.dev/api) 与 [v4 迁移说明](https://zod.dev/v4/changelog)。文档站随上游更新，当前代码事实以安装的 4.6.5 和固定源码为准。
- 「官方 README」保存匹配 4.6.5 包目录的原文；官方中文候选在 `docs-v3`，不适合作为当前 v4 包快照。固定提交、候选审查和响应头在 [`source-audit.json`](official/source-audit.json)。
- 「官网预览」使用公共面板，根据已保存的响应头证据记录状态；未从 Lab origin 实测不能只凭无禁止响应头声称允许嵌入。
- 本地真实 SDK、业务 helper、浏览器与独立复核分别在 [`local-validation.md`](local-validation.md) 记录。正式 sdk/build/browser 收据仍由 `verification.json` 独立管理。
