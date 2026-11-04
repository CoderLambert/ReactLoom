# Zod 4.6.5｜把 unknown 收成可提交的 RSS DTO

Lab 锁定 `zod@4.6.5`（MIT）。研究笔记里的 4.6.7 不要写进依赖。Zod 把 `unknown` 收成受约束的数据，不负责发请求、管表单焦点、净化 HTML，也不负责 SSRF 或权限。

没有收据时 sdk / build / browser 保持 NOT_RUN。Actions 41779873259 不是本条目 PASS。

## Lab 当前示例

[`examples/example.tsx`](examples/example.tsx) 在模块顶层声明真实 schema，按钮点击时 `schema.safeParse`。没有 `src/App.tsx`，也没有独立 Vite 5173。三个 level 共用这一个组件，由 Lab 传入 `level`。

- **basic**：`FeedSchema = z.strictObject({ title, url })`。标题 `trim().min(2)`。URL 先 `z.string().trim().url()`，再 `refine` 到 [`boundary-policy.mjs`](examples/boundary-policy.mjs) 的 `canonicalHttpsFeedUrl`。有效样例带前后空白；失败样例是短标题、`javascript:` 和多余的 `admin`。
- **business**：`ImportEventSchema = z.discriminatedUnion('kind', …)`。`rss` 分支只要 HTTPS URL；`opml` 分支用 `isSafeOpmlFilename`（不能含目录）和至少一个分组。挂载样例是 OPML。
- **advanced**：`BatchPolicySchema`。TTL 先拒绝空串和前导零，再 `pipe(z.coerce.number<string>().int().min(1).max(60))`。`superRefine` 用规范化 URL 去重，issue path 是 `sources.{index}.url`。`z.input` 里 TTL 仍是字符串，`z.output` 里是 number。

`canonicalHttpsFeedUrl` 只接受无用户名密码的 `https:`，丢掉 fragment，主机按 URL 解析规范化，path 和 query 保持原样。这不是 DNS、重定向或内网地址检查。`duplicateFeedIndex` 在 URL 非法时跳过，让字段校验自己报错。

下面仍写异步 refine、RHF resolver、`z.compile()` 和 IndexedDB 迁移。当前 Demo 不挂载它们。

## 什么时候用

表单提交、JSON 导入、`localStorage`、跨窗口消息和第三方 RSS 的边界。多人接口如果以 TypeScript 为契约，Zod 能在运行时拦住缺字段和多字段。

一个布尔开关不必上 schema。OpenAPI 已经是唯一合同时先看 Ajv。包体极敏感时比较 Valibot，并在同一 schema 上测体积，不要引用「小 95%」当本仓库结论。热路径先 profile，再决定要不要 `z.compile()`。

| 场景 | 谁负责 |
| --- | --- |
| 输入光标、脏状态、焦点 | React Hook Form |
| unknown → DTO | Zod |
| 已有 JSON Schema | Ajv |
| 抓取目标是否允许 | 服务端出站策略 |

## 数据与模型

TypeScript 的 `as User` 在运行时消失。网络 JSON 先当 `unknown`。

```ts
import * as z from 'zod'
const TTL = z.string().trim().min(1).regex(/^[1-9]\d?$/u).pipe(
  z.coerce.number<string>().int().min(1).max(60),
)
type TTLInput = z.input<typeof TTL>   // string
type TTLOutput = z.output<typeof TTL> // number
```

`z.coerce.number()` 对 `''` 得到 `0`，因为 `Number('') === 0`。Lab 先用非空正则挡住，再 pipe。金额不要进这条管道。

`safeParse` 返回判别联合，适合按钮提交后列错误。`parse` 抛错，适合你打算让边界失败直接中断的地方。带异步 refine 的 schema 必须 `safeParseAsync`；同步 `safeParse` 接不住。

`z.strictObject` 拒绝未知键，用于导入和权限相关 DTO。`z.object` 剥掉未知键，适合允许服务端加非关键字段的响应。`z.looseObject` 会把未知键留下来，只有透传时才用。Lab 的三个 schema 都是 strict。

`z.url()` 只说明它能被当成 URL。`javascript:` 也能通过格式检查。协议、凭据和 fragment 要另写 refine，而且仍不构成 SSRF 防护。

## 三层示例

### 基本

文本框里是未可信 JSON。点「运行 safeParse」。有效样例的标题空白被去掉，输出是 `result.data`，不是原文。点「加载失败样例」应看到标题太短、URL 被拒，以及 `admin` 触发的未知键。错误列表用 `issue.path` 加 `issue.message`，放在 `role="alert"`。改文本只把状态改成「需要重新校验」，不会在每个按键上 parse 再回写 textarea。

### 业务

切到 OPML 样例。`feeds.txt` 和空 `groups` 失败。`kind` 必须是互斥判别字段。生产里如果 token 模式要进联合，输出进日志前先遮蔽，不要开 `reportInput: true`。

研究笔记里的文章/视频 `ContentSchema`、刷新间隔 5–1440、`fullText` 跨字段，以及「服务端响应用 loose object 剥掉 extra」都没有挂进这个组件。需要时另写 schema，不要假装当前按钮已经覆盖。

### 进阶

空 TTL 不能变成 0。两条相同 `https://example.com/feed` 的错误要落在第二条的 `sources.1.url`。把 path 改成不同大小写，按 Lab 策略它们不是同一个键；把主机改成大小写或默认端口，则算重复。

研究笔记的 `LatestOnly`、380ms 可用性查询和 `safeParseAsync` 不在本示例里。接上真实查重时，schema 不会取消 fetch。调用方保存 AbortSignal 和 generation，回包前再对**当前**输入 `safeParse`。

## 反例

### 1. 用断言代替 parse

```ts
const user = (await response.json()) as User
```

编译器被骗过，运行时什么都没查。先 `unknown`，成功后再把 `result.data` 放进状态。

### 2. 空串直接 coerce

```ts
z.coerce.number() // '' → 0
```

TTL、年龄、配额都要先拒绝空白。Lab 的 pipe 是对的。

### 3. 用 z.url() 当抓取白名单

`https://127.0.0.1/` 和带用户信息的 URL 都可能通过格式检查。`canonicalHttpsFeedUrl` 只去掉凭据和 fragment。DNS、重定向和内网 IP 在服务端做。

### 4. 导入配置用 z.object

未知的 `isAdmin` 会被静默丢掉。导入和事件用 `strictObject`。响应兼容才用会剥离未知键的 `z.object`。

### 5. 异步 refine 配同步 safeParse

同步 API 不会等 Promise。改 `safeParseAsync`，并把 signal 交给真正的 fetch。

### 6. composition 期间把 parse 结果写回输入

拼音会被 trim 或规范化打断。Lab 的 JSON 文本在提交时才解析。真实输入框同样等到 blur 或明确提交。

### 7. 把 issues 或原始 JSON 打进日志

默认 issue 不一定带原文，但你自己的 `console.log(raw)` 会。token 字段先遮蔽。页面只渲染 path 和固定文案。

### 8. 全站打开 z.compile()

```ts
const compiled = z.compile(FeedSchema)
```

它走 `new Function`，CSP 禁止 eval 时失败，还会带上编译器体积。异步 refine 和部分递归 schema 会降级。Lab 没有调用它。热点确认后再考虑，或 `z.config({ jitless: true })`。

### 9. 把 toJSONSchema 当成可逆合同

`superRefine` 和自定义 refine 没有忠实的 JSON Schema 等价物。对外合同用独立 DTO 和金样本，双向转换用 `z.codec` 并写测试。

## 组合

**React Hook Form。** RHF 拿 `z.input` 做草稿，resolver 成功后提交 `z.output`。`@hookform/resolvers` 的 Zod 4 类型要和 4.6.5 对过再装。本示例没有 resolver。字段组件不要再写一套矛盾正则。

**Query。** `queryKey` 使用规范化后的 URL，不使用用户原始空白。409 映射到字段 path。缓存里只放 `result.data`。

**OpenAPI。** 生成类型不代替运行时校验。MSW 要有缺字段、多字段和错误体三种。Zod 通过也不等于后端鉴权通过。

**Dexie。** 缓存带 `schemaVersion`。先用旧 schema 读，再迁移，再用新 schema 验证，最后在事务里写。不要用 `.catch(() => 默认值)` 盖掉读失败的用户数据。

## 生产清单

- 模块顶层建 schema。不要在每次渲染里 new 一套再发请求。
- 交互用 `safeParse`。错误用 path，不用堆栈。
- 每个输入有 label。失败区域 `role="alert"`。能定位到字段时设 `aria-invalid` 和 `aria-describedby`。Lab 目前是整份 JSON 的列表，迁到分字段表单时补上。
- 大 JSON 在 parse 前限制字节数。客户端上限不是服务端防 DoS。
- 富文本通过 schema 也不要丢进 `dangerouslySetInnerHTML`。
- ISO 日期格式通过，不等于夏令时计算正确。时间交给 C14–C16。

## 升级

Zod 3 的 `object().strict()` / `.passthrough()`、`ZodError.flatten()` 在 4 里改成 `strictObject` / `looseObject` 和 `z.flattenError`。嵌套数组用 `z.treeifyError`。升级时为未知键、空串 coerce、判别联合和异步 refine 各留一条负例。不要只改版本号。

`z.string().min` 近版本按码点计长，不等于屏幕上的字数。中文标题如果要按字素限制，另定规则。

## 练习

1. 给 Feed 增加可选 `website`。`''` 变成省略，`javascript:` 失败，`https://example.com` 通过。写出 `z.input` 和 `z.output`。
2. 把 TTL 改成 `''`、`'0'`、`'05'`、`'15'`、`'99'`，确认只有 1–60 的十进制正整数能变成 number。
3. 两条 URL 只差 path 大小写时不报重复；只差主机大小写或默认 443 时报到具体下标。
4. 接上查重时连续改 URL。旧的 `safeParseAsync` 结果不能覆盖新草稿。卸载要 abort。
5. 若引入 `z.compile`，在禁止 `unsafe-eval` 的页面上确认失败路径，而不是默认打开。

## 官方链接

- https://zod.dev/
- https://zod.dev/v4/changelog
- https://zod.dev/api
- https://github.com/colinhacks/zod

## 证据

`boundary-policy` 单测不渲染 Zod，也不能写成 sdk PASS。`tests/sdk.test.mjs` 只有在真实 import `zod@4.6.5`、命令与指纹和 `docs/library-lab/evidence/runs/` 里的收据一致时才算 sdk。build 与 browser 同样保持 NOT_RUN，直到各自的收据存在。

GitHub Actions 41779873259 是仓库级安装、typecheck、build、52 个 SDK 文件（153 项测试）和 45 项 Playwright 的结果，不是 C02 的条目 PASS。本页不改 `verification.json`，也不写 PASS。
