# Ajv 8.20.0｜可信 JSON Schema 与 RSS 域名规则分开

Lab 锁定 `ajv@8.20.0`（MIT）。Ajv 编译 JSON Schema 并校验数据。它不画表单，不发请求，也不判断一个 HTTPS 地址能不能被服务器抓取。

没有收据时 sdk / build / browser 保持 NOT_RUN。Actions 41779873259 不是本条目 PASS。

## Lab 当前示例

[`examples/example.tsx`](examples/example.tsx) 在模块顶层创建唯一实例：

```ts
const validator = new Ajv({
  strict: true,
  allErrors: true,
  coerceTypes: false,
  useDefaults: false,
  removeAdditional: false,
})
```

`useMemo` 按 level 编译 `feedSchema`、`batchSchema` 或 `windowSchema`。这些 schema 是源码常量，不是远程下发的可执行文档。`demo.tsx` 只做再导出。没有单独的 `npm run demo:business` 端口。

- **basic**：对象必须有 `id`、`title`、`url`，`additionalProperties: false`。`id` 只允许小写、数字和连字符。`url` 的 pattern 只要求以 `http://` 或 `https://` 开头（大小写不敏感）。Ajv 通过后再跑 [`rss-policy.mjs`](examples/rss-policy.mjs) 的 `validateFeedBoundaries`。
- **business**：`feeds` 1 到 5 条，`uniqueItems: true`。Ajv 的 unique 比较整份对象，不比较规范化 URL。重复身份由 `canonicalHttpsFeedUrl` 再查。
- **advanced**：`enabled === true` 时 `if/then` 要求 `maxConcurrent` 为 1–8 的整数。样例故意带 `maxConcurrent: 0` 和未知键 `unreviewed`。这一层 `validateFeedBoundaries` 直接返回空数组，因为窗口 schema 没有 URL。

`canonicalHttpsFeedUrl` 拒绝非 HTTPS、用户信息和空主机，丢掉 fragment。它不是 SSRF 白名单。

## 什么时候用

OpenAPI 或已发布的 JSON Schema 是合同、要和 JSON Forms 共用同一份文件时用 Ajv。TypeScript 手写对象、需要 input/output 转换时用 Zod 或 Valibot。Ajv 的 `coerceTypes` 会改写数据，本示例关掉了。

不要编译用户上传的 schema。官方把 schema 视作应用代码：恶意 `pattern`、深层 `$ref` 和 `uniqueItems` 都能吃掉 CPU。

## 数据与模型

一次校验的顺序是：`JSON.parse` → 已编译的 `validate(value)` → 若通过再跑域名规则。失败时立刻读 `validate.errors` 并写成字符串。这个数组会被下一次调用覆盖，不能在 `await` 之后再读。

`allErrors: true` 适合这个小示例把多条错误一次显示出来。服务端面对不可信大文档时用 `allErrors: false`，并在 Ajv 之外限制字节、深度和数组长度。客户端的 `maxItems: 5` 不是防 DoS。

`removeAdditional` 会改对象，和 `oneOf` / `anyOf` 叠在一起时结果难测。Lab 用 `additionalProperties: false` 拒绝未知键，而不是默默删掉。

`if/then` 里的子 schema 在 strict 模式下要自带 `type`。缺了会在编译期报错，不要关掉 `strict` 来消警告。

默认草案是 draft-07。不要在同一个实例里混 draft-2020-12。`format: 'uri'` 从 Ajv 7 起不在核心里，本示例没有装 `ajv-formats`，也没有使用 format 关键字。需要时显式注册，并单独看正则是否有 ReDoS。

浏览器里编译通常需要 `script-src 'unsafe-eval'`。强 CSP 应在构建期用 standalone 生成校验函数，而不是给生产站加 eval。本 Demo 没有做 standalone。

## 三层示例

### 基本

合法样例先过 Ajv，再过 HTTPS 规则，输出 PASS 和原对象（没有类型强制）。把 `url` 改成 `http://example.org/rss`：pattern 能过，域名规则失败，路径是 `/url`。加上 `"role":"admin"`：Ajv 因未知属性失败。`id` 写成 `Frontend` 会失败在 pattern。

### 业务

两条 feed 的 URL 规范化后相同（主机大小写、默认端口或 fragment 不同）时，Ajv 的 `uniqueItems` 仍可能成功，随后 RSS 规则报「规范化后的 RSS URL 已存在」。两条对象完全一样才由 `uniqueItems` 拒绝。不要用前者代替后者。

`feeds` 超过 5 条、空数组、team 缺失都是 Schema 错误。研究笔记里的 HTTP 201/409/422 服务没有挂在这里。那些状态码是生产合同，要由服务端在 Ajv 之后用数据库唯一索引实现。

### 进阶

`enabled: true` 且 `maxConcurrent: 0` 应失败在范围。`unreviewed` 应失败在 additionalProperties。把 `enabled` 改成 `false` 并删掉 `maxConcurrent`，条件分支不再要求并发数。错误行包含 `instancePath`、`keyword` 和 `message`。不要 `eval` 路径，也不要把 `message` 插进 HTML。

## 反例

### 1. 每次输入都 new Ajv().compile

编译进渲染热路径。Lab 把 `new Ajv` 放在模块顶层，只按 schema 身份编译。

### 2. coerceTypes 开着还当输入没变

```ts
new Ajv({ coerceTypes: true })
```

`'30'` 会变成数字，React 草稿和审计日志都被改写。生产默认关闭。要转换就先克隆，再显式解析。

### 3. removeAdditional: 'all' 当安全过滤

未知的 `role` 消失，审查看不见。用 `additionalProperties: false` 拒绝，通过后再映射白名单 DTO。

### 4. await 之后读 validate.errors

```ts
validate(a)
await something()
console.log(validate.errors) // 可能已经是 b 的结果
```

失败当帧复制出来。

### 5. 用 uniqueItems 当 URL 去重

它比较 JSON 值。`https://Example.com/a` 和 `https://example.com/a` 不是同一对象。域名规则另做，且仍不是 SSRF。

### 6. if/then 只藏表单字段

隐藏的 `url` 还在对象里。条件 schema 要拒绝错误分支的字段，提交时构造新对象。JSON Forms 那一侧的 HIDE 同样不算删除。

### 7. 用户上传的 schema 直接 compile

只编译构建期审核过的文档。`$id` 不是自动下载。远程 `$ref` 要走固定白名单和 `loadSchema`，并限额。

### 8. instancePath.split('/') 当属性访问

`~0` 和 `~1` 是转义。把指针当展示用的字段 ID。写入时用显式映射表，不要把路径拼进对象。

### 9. 校验通过就开始抓取

`https://127.0.0.1/` 可以满足字符串 pattern。抓取层检查解析后的 IP、重定向每一跳和云元数据地址。本示例从不请求输入的 URL。

### 10. format 当邮箱已安装

未装 `ajv-formats` 时 `format: 'email'` 在 strict 模式下会编译失败。不要为了这个关掉 strict。

## 组合

**JSON Forms。** 渲染用 C04 的同一份 Schema。Ajv 实例仍由应用拥有时，避免每个控件再 `new Ajv`。隐藏字段用 DTO 函数删，不用 `removeAdditional` 碰用户正在编辑的对象。

**React Hook Form。** 把 `instancePath` 映射到已知字段名再 `setError`。不要按指针动态赋值。IME 期间不要每个按键都跑整份 schema。

**Zod。** 新应用内部 DTO 可以用 Zod。已经发布给别人的 JSON Schema 继续用 Ajv，避免两套规则悄悄分叉。

## 生产清单

- `strict: true`，`coerceTypes: false`，`useDefaults: false`，`removeAdditional: false`。
- 错误立刻快照。服务端默认 `allErrors: false`。
- 入站字节、深度、数组上限在 Ajv 外面。
- 排序字段和 URL 协议用白名单，不把 schema 通过当成授权。
- 错误用文本节点。字段控件另加 `aria-invalid`。本 Demo 把多行结果放在 `aria-live="polite"` 的 `<output>` 里。
- 中文长度不要假设 `minLength` 等于屏幕字数。需要字素时另定规则，合同不要因此漂移。
- 禁止 eval 的页面改用 standalone 产物。

## 升级

从 Ajv 6 上来：`dataPath` 改成 `instancePath`，format 外移，`id` 改成 `$id`，strict 默认更严。用金样本比接受集，不要搜索替换完就上线。JTD 的 `compileSerializer` 不校验输入，不能拿来代替 `validate`。

`allErrors: true` 让这个小文本框一次看到未知属性和范围错误。把它拷到没有字节上限的服务端，等于让校验器把所有分支都跑完。那里改回 `allErrors: false`，并在读 body 时限制长度。客户端示例不能代替那一层。

编译发生在 `useMemo` 里，依赖是 level。三个 schema 是常量，所以每个 level 只会编译一次。若把 schema 对象写进组件函数，每次渲染都是新身份，`compile` 会跟着跑。不要为了消掉这个成本去关 `strict`。

## 练习

1. 为 rss / web 两个互斥来源写 `if/then` 或判别字段。双 URL、缺 URL、`pollMinutes: "30"` 都要失败，且不能靠类型强制变成数字。
2. 构造两条只差 fragment 的 feed。`uniqueItems` 通过，域名规则失败。
3. 连续调用两次 `validate`，确认第一次的 errors 在第二次之后不可再读。
4. 若要上 standalone，在没有 `unsafe-eval` 的页面加载生成函数，而不是放宽 CSP。

## 故障排查

| 现象 | 先看 |
| --- | --- |
| `unknown format` | 没装 `ajv-formats` 却写了 format。不要为此关掉 strict |
| `strict mode: unknown keyword` | 关键字拼错或草案不对。修正 schema |
| `missing type` | `if/then` 的子 schema 在 strict 下要自己写 `type` |
| 缺字段的路径在父对象 | `required` 的 `instancePath` 常常是父级，配合 `params.missingProperty` |
| 错误一会儿对一会儿错 | `validate.errors` 被下一次调用覆盖。当帧复制 |
| 通过了却抓到内网 | pattern 只看字符串。SSRF 在解析之后 |
| 隐藏字段仍在对象里 | UI 隐藏不是 `additionalProperties`。构造新 DTO |
| CSP 拒绝编译 | 浏览器动态编译需要 eval。改 standalone，不要放宽生产 CSP |

`oneOf` 在两个分支同时通过时失败。分支要互斥。`anyOf` 只需一个通过。不要用 `removeAdditional: 'all'` 在这些组合旁边偷偷改数据。

JTD 的 serializer 不校验。先 `validate` 再序列化。`JSONSchemaType` 对复杂联合有表达限制，类型通过不等于运行时已经拒绝了金样本之外的字段。

## 官方链接

- https://ajv.js.org/guide/getting-started.html
- https://ajv.js.org/strict-mode.html
- https://ajv.js.org/security.html
- https://ajv.js.org/guide/modifying-data.html
- https://ajv.js.org/standalone.html
- https://github.com/ajv-validator/ajv

`feedSchema` 的 url pattern 写成大小写不敏感的 http(s) 前缀，是为了让「Schema 通过、域名规则失败」这种分层看得见。若把 pattern 改成完整的 URL 语法，就测不出 `canonicalHttpsFeedUrl` 还在起作用。两层都要留。

`uniqueItems` 用 JSON 比较。两条 feed 只差标题、URL 相同，Ajv 认为它们不同。域名规则仍应报重复。相反，两条完全相同的对象会先死在 `uniqueItems`，走不到域名规则。测试要覆盖这两种，不能只留一种。`windowSchema` 在 advanced 不跑 URL 规则。给它一条 feed 并期待 `/url` 错误，是测错了 schema。条件失败应出现在 `maxConcurrent` 或根上的 additionalProperties。

## 证据

`rss-policy` 单测不是 Ajv 编译通过。sdk 要真实 `import Ajv from 'ajv'` 并在 `docs/library-lab/evidence/runs/` 有收据。build 与 browser 保持 NOT_RUN，直到各自收据存在。

GitHub Actions 41779873259 是仓库级安装、typecheck、build、52 个 SDK 文件（153 项测试）和 45 项 Playwright 的结果，不是 C05 的条目 PASS。不要改 `verification.json`。
