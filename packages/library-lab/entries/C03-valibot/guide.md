# Valibot 1.4.2｜按 action 拼起来的 RSS 边界

Lab 锁定 `valibot@1.4.2`（MIT）。研究笔记写的 1.5.0 不是本仓库的 pin。Valibot 用 schema、action、pipe 和 issue 把 `unknown` 收成业务值。它不发请求，不管理光标，也不做 SSRF。

没有收据时 sdk / build / browser 保持 NOT_RUN。Actions 41779873259 不是本条目 PASS。

## Lab 当前示例

[`examples/example.tsx`](examples/example.tsx) 调用真实的 `v.safeParse`，选项是 `{ abortEarly: false }`。`demo.tsx` 只做再导出。没有 `http://127.0.0.1:5173` 的独立 workshop。

- **basic**：`FeedSchema`。`name` 是 `v.pipe(v.string(), v.trim(), v.minLength(2))`。`url` 先 `v.url()`，再 `v.check` 到 [`boundary-policy.mjs`](examples/boundary-policy.mjs) 的 `canonicalHttpsFeedUrl`。`category` 是 `v.picklist(['tech', 'business'])`。
- **business**：`BatchSchema`。`feeds` 至少一条，每条仍是 `FeedSchema`。`owner` 同样 trim 后至少 2 个字符。样例是两条不同主机的 HTTPS 源。
- **advanced**：`WindowSchema`。`start` 先过 `v.isoDate`，再 `v.check(isRealCivilDate)`。`end` 只做 `isoDate`。`v.forward(v.partialCheck(...), ['end'])` 把「结束早于开始」指到 `end`。默认样例故意是 2026-11-05 到 2026-11-02。

`isRealCivilDate` 按公历闰年判断，不用 `Date.UTC` 把 0–99 年折进 1900–1999。年份 0 直接拒绝。URL 策略与 C02 相同：无凭据 HTTPS，丢掉 fragment，不是出站白名单。

挂载示例没有 `v.strictObject`、没有异步 pipe、没有 RHF resolver。那些写在后面，是迁出去之后会踩的坑。

## 什么时候用

前端包体要按 action 引入、schema 以 TypeScript 手写、错误要落到字段时，Valibot 合适。已经有一整套 Zod 4 schema 时，不要只为了宣传体积重写。JSON Schema 是对外合同时用 Ajv。

Valibot 不管权限、速率限制和唯一索引。用户可以改自己的 bundle。服务端要再验一次。

## 数据与模型

一条 schema 是类型加有序 action。`v.pipe` 的顺序就是执行顺序：先 trim 再量长度，空格不会被算进最小长度。转换失败后，后面的 action 可能不再跑。

```ts
import * as v from 'valibot'
const Name = v.pipe(v.string(), v.trim(), v.minLength(2, '名称至少2个字符'))
type NameInput = v.InferInput<typeof Name>
type NameOutput = v.InferOutput<typeof Name>
```

页面用 `v.safeParse`。需要立刻抛错的进程边界用 `v.parse`。含 `v.checkAsync` 或 `v.pipeAsync` 时必须 `await v.safeParseAsync`。

`v.object` 默认丢掉未知键。导入配置、担心 `isAdmin` 被悄悄吞掉时用 `v.strictObject`。需要原样留下未知键时才用 `v.looseObject`。Lab 的三个 schema 都是普通 `v.object`，所以多出来的键不会出现在失败列表里。这是当前 Demo 的行为，不是导入协议的推荐。

`v.partialCheck` 只看列出的路径，其它字段类型不对时仍然能报跨字段问题。`v.forward` 把 issue 指到 `end`，而不是根对象。完整对象上的 `v.check` 在 `typed === false` 时可能根本不执行。

`v.url()` 是格式。`canonicalHttpsFeedUrl` 再拒绝非 HTTPS 和用户信息。`v.isoDate` 的正则不保证 2 月 30 日不存在，所以 Lab 又套了公历检查。不要把 `isoDate` / `isoTimestamp` 当成时区运算。

`abortEarly: false` 让一次点击收集多条 issue。展示时用 `issue.path` 的 `key` 拼字段名，不要把整个 issue 对象打进日志：里面的 `input` 可能是 token。

## 三层示例

### 基本

输入先 `JSON.parse` 成 `unknown`，再 `v.safeParse(FeedSchema, parsed)`。成功输出 `outcome.output`。把 `category` 改成 `news`，应失败在 picklist。把 URL 改成 `javascript:alert(1)` 或 `https://user:pass@example.com/feed`，应失败在 URL check。名称 `"  a  "` trim 后不足 2 个字符。

不要在 `onChange` 里 parse 完再写回 textarea。中文组合期间回写会吃掉光标。Lab 只在按钮和场景切换时更新结果。

### 业务

`feeds: []` 失败在数组最小长度。某一条 URL 非法时，path 应能看出是第几条，而不是只说「数组不合法」。owner 的空白同样先 trim。

研究笔记里的 token 模式、标签上限、刷新分钟数没有出现在 `BatchSchema`。要加就加在 schema 上，并用 `partialCheck` 把错误指到具体键。

### 进阶

默认样例格式都合法，顺序不合法，失败文案在 `end`。把 `start` 改成 `2026-02-30`：格式正则可能放过，`isRealCivilDate` 必须拒绝。`2024-02-29` 可以通过公历检查，`1900-02-29` 不行，`2000-02-29` 可以。`0001-01-01` 这种年份不要交给 `Date.UTC` 去「修正」。

结束字段如果只写 `2026-13-40`，应先死在 `isoDate`，而不是被顺序检查盖住。

## 反例

### 1. 草稿类型用了 InferOutput

年龄框里是 `'23'`，却把 state 标成 `number`。草稿用 `InferInput`，提交成功才保存 `InferOutput`。

### 2. 空串 transform 成数字

```ts
v.pipe(v.string(), v.transform(Number)) // '' → 0
```

先 `trim`，再用正则确认是整数，然后才 `transform`。Lab 的 TTL 不在本条目，但同一陷阱适用于任何计数字段。

### 3. 权限配置用 v.object

未知键被丢掉，拼写错误和越权字段都看不见。用户可控导入用 `strictObject`，服务端再做白名单。

### 4. 只用 v.check 做跨字段

```ts
v.pipe(v.object({ start: v.string(), end: v.string() }),
  v.check(input => input.start <= input.end))
```

`start` 类型就不对时，这段 check 可能不跑，UI 上也没有字段路径。Lab 的 `partialCheck` + `forward` 才是表单该用的形状。

### 5. 异步 pipe 配同步 safeParse

同步函数不会执行 `checkAsync`。改 `safeParseAsync`。网络取消仍要 AbortController 加 generation，Valibot 不会替你丢弃旧结果。

### 6. 把 issue 整包记日志

`issue.input` 是原始值。界面用 `flatten` 的字段消息。生产日志只留计数、字段名和追踪 ID。

### 7. 把 url() 当 SSRF 防护

`https://127.0.0.1/` 可以通过格式和「是 HTTPS」这两关。出站策略在解析 DNS 和重定向之后做。

### 8. 每次渲染 new schema 并发请求

静态 schema 放模块顶层。依赖外部 checker 的 async schema 在提交时创建，并取消上一次。

### 9. 用宣传体积代替测量

官方对比是特定 tree-shaking 场景。本仓库没有把 1.4.2 和 Zod 4.6.5 打进同一个路由再称谁更小。

## 组合

**React Hook Form。** 下面是接口形状，不是本 Demo 已挂载的代码。resolver 版本要和 Valibot 1.4.2 对齐后再装。

```tsx
const form = useForm<v.InferInput<typeof FeedSchema>, unknown, v.InferOutput<typeof FeedSchema>>({
  resolver: valibotResolver(FeedSchema),
  defaultValues: { name: '', url: '', category: 'tech' },
})
```

RHF 管订阅和错误焦点。Valibot 管 DTO。服务端再验一次。不要在每次 `onChange` 上跑非幂等的唯一性检查。

**OpenAPI / Orval。** 生成类型描述合同，`safeParse` 检查这次 JSON。缓存只接收 `output`。手写 schema 和 OpenAPI 并行时要有契约测试。

**i18next。** 字段文案不要依赖库的英文默认句。简单页面把中文写进 action message。多语言用官方 i18n 集成，并把语言放进单次 parse 的配置。SSR 不要在跨请求单例上 `v.setGlobalConfig`，否则中文请求会看到英文请求留下的语言。

## 生产清单

- JSON 先解析再 `unknown`，禁止 `as`。
- 导入协议用 `strictObject`。Lab 当前演示为了教学用的是 `object`，迁出去要改。
- 日期顺序用 `partialCheck` + `forward`。公历用 `isRealCivilDate`，不要只信 `isoDate`。
- 错误列表 `aria-live` 或 `role="alert"`。分字段表单补 `aria-invalid`。
- 大数组在 schema 里写 `maxLength`，服务端再限字节和深度。
- CSP：Valibot 不靠 `new Function` 编译 schema。整站仍可能有别的依赖要 eval，不能用这一点给页面开 `unsafe-eval`。

## 升级

0.31 之前的 `v.string([v.email()])` 已换成 `v.pipe(v.string(), v.email())`。从 Zod 迁过来时，`z.object().strict()` 对 `strictObject`，`refine` 对 `partialCheck` + `forward`，`transform` 要分别断言 input 和 output。锁 1.4.2，不要在指南里写成 1.5.0。

## 练习

1. 给 Feed 加可选 website，拒绝 `javascript:`，空串省略。列出 InferInput 和 InferOutput。
2. 把 `2026-02-30`、`2024-02-29`、`1900-02-29` 放进 start，确认只有真实公历通过。
3. 结束早于开始时，issue 路径是 `end`，不是根。
4. 给 Batch 加重复 URL。错误要落到具体下标，非法 URL 不参与去重。
5. 用同一组负例写一版 Zod 4.6.5 schema，比较未知键和错误路径，而不是比较口号。

## 官方链接

- https://valibot.dev/guides/introduction/
- https://valibot.dev/guides/parse-data/
- https://valibot.dev/api/partialCheck/
- https://valibot.dev/guides/pipelines/
- https://valibot.dev/guides/migrate-to-v0.31.0/
- https://github.com/fabian-hiller/valibot

## 证据

`boundary-policy` 的公历和 URL 单测不是 Valibot SDK 通过。`tests/sdk.test.mjs` 必须真实 import `valibot@1.4.2` 并留下 `docs/library-lab/evidence/runs/` 收据，sdk 才离开 NOT_RUN。build 与 browser 同样等待各自收据。

GitHub Actions 41779873259 是仓库级安装、typecheck、build、52 个 SDK 文件（153 项测试）和 45 项 Playwright 的结果，不是 C03 的条目 PASS。不要改 `verification.json`。
