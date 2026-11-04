# C04 JSON Forms — 工程手册

## 适用

字段随类型变化、需要和 JSON Schema 一起维护的配置表单。固定少量字段用 React Hook Form。只校验 payload、不画控件时不要引入渲染器。

## 版本

`@jsonforms/core@3.8.0`、`@jsonforms/react@3.8.0`、`@jsonforms/vanilla-renderers@3.8.0`，以及 `ajv@8.20.0`。三个 JSON Forms 包一起升级。本条目没有 Material 渲染器。

## 迁移

带走 `examples/example.tsx` 和 `examples/submission-policy.mjs`。用项目的 API client 替换 `abortableDelay` 和本地 `duplicate`。保留 `toSubscriptionPayload`：UI 的 HIDE 不能决定 POST 体。`additionalErrors` 继续用状态保存，而不是写在 JSX 字面量里。

## 不可删的清理

数据变化、取消、重置、卸载都要增加 generation 并 abort。回包写入前比较 generation。服务端错误只在数据真正变化时清除。`toServerError` 只接受 `name` 和 `url`。组合输入期间不要提交。

## 反例

```tsx
onChange={() => save(data)}
<JsonForms additionalErrors={[{ instancePath: '/name', message }]} />
```

- 认为 `effect: 'HIDE'` 会删除 `url`。
- 只在 UI 写必填，Schema 没有 `if/then`。
- `pattern: '^https://'` 当作拒绝了用户名密码。
- 自定义控件不调用 `handleChange(path, value)`。
- 编译租户提交的任意 Schema。
- abort 之后向用户声称服务器没有保存。

## 测试断言

- manual 的 payload 没有 `url`；rss 保留 trim 后的地址。
- `https://user:pass@host` 和带 fragment 的地址被 `validateSubmission` 拒绝。
- 未知字段不能变成 `instancePath`。
- 旧 generation 的 409 不能写回。
- 策略测试不是浏览器里点过 Vanilla 控件的证据。

## 真实限制

保存是内存延迟，不是 HTTP。没有自定义 renderer，没有 i18n adapter，没有 SSR。中文输入法只在提交门闩上处理，没有真机记录。Ajv 的 CSP 行为未在本条目单独验收。

## 证据

没有收据不要写 PASS。Actions 41779873259 不是本条目。不要改 `verification.json`。
