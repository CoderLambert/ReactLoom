# C05 Ajv — 工程手册

## 适用

已经有可信 JSON Schema、要和别的服务共用 draft-07 合同时使用。手写 TypeScript 转换用 Zod 或 Valibot。不要编译用户粘贴的 schema，不要用校验通过代替抓取授权。

## 版本

`ajv@8.20.0`，MIT。实例选项保持 `strict: true`、`allErrors: true`（仅此小示例）、`coerceTypes: false`、`useDefaults: false`、`removeAdditional: false`。未安装 `ajv-formats`。

## 迁移

带走 `examples/example.tsx` 的三个 schema 和 `examples/rss-policy.mjs`。Ajv 实例留在模块顶层，按 schema 编译一次。域名规则留在 schema 通过之后。服务端若面对大请求，把 `allErrors` 改回 false，并在外面限制体积。

## 不可删的清理

失败时立刻复制 `validate.errors`。不要在 await 之后读它。不要对不可信 schema 做无限缓存。组件卸载不需要销毁这个纯函数校验器，但任何随后的 setState 仍要有 generation。

## 反例

```ts
new Ajv({ coerceTypes: true, removeAdditional: 'all', strict: false })
validate(payload)
await save()
use(validate.errors)
```

- 用 `uniqueItems` 代替规范化 URL 去重。
- pattern `^https://` 当作拒绝了用户名密码。
- `instancePath.split('/')` 后直接写入对象。
- 校验通过就 `fetch(userUrl)`。
- 未注册 format 却写 `format: 'uri'`，再用关 strict 来消错。

## 测试断言

- 未知属性失败，而不是被删掉。
- `http://` 能过 pattern，不能过 `canonicalHttpsFeedUrl`。
- 只差 fragment 或主机大小写的两条 URL，Schema 可能通过，域名规则必须失败。
- `enabled: true` 且 `maxConcurrent: 0` 失败；`enabled: false` 可以不带并发数。
- 策略单测没有 `new Ajv`，不能写成 sdk PASS。

## 真实限制

示例不发 HTTP，没有 standalone 构建，没有 `ajv-formats`。`allErrors: true` 不适合原样搬到无上限的服务端输入。CSP 与浏览器编译未在本条目单独验收。

## 证据

没有 `docs/library-lab/evidence/runs/` 收据不要写 PASS。Actions 41779873259 不是本条目。不要改 `verification.json`。
