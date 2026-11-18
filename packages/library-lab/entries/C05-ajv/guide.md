# Ajv：把 JSON Schema 合同变成可执行的导入边界

团队已经用 JSON Schema 描述订阅配置，希望浏览器和服务端按同一份合同拒绝缺字段、错类型和未知键。Ajv 把可信 Schema 编译成可重复调用的校验函数；它不会替你决定两个订阅是否指向同一来源。本页用 `ajv@8.20.0` 把结构合同与这层业务规则分开观察。

已有 JSON Schema、需要与其它语言或表单生成器交换合同时适合 Ajv；以 TypeScript 推断为中心的应用可以比较 Zod / Valibot。Schema 应来自经过审查的应用代码，不能让用户在这个文本框提交任意 Schema 进行编译。文本框只接受待校验数据。

## 模型与最小接入

[`schemas.ts`](examples/schemas.ts) 保存三个实际合同及 `createValidators`；React 页面和 SDK 测试导入同一实现。`new Ajv(options)` 创建编译器，`compile(schema)` 生成函数，`validate(data)` 返回布尔值，失败原因在该函数的 `errors` 中。不要每次输入都重编译。

```ts
import { createValidators } from './schemas'

const validators = createValidators() // 可信合同，一次编译、重复使用
const value: unknown = JSON.parse(raw)
const validate = validators.basic
if (validate(value)) {
  // 继续执行项目的业务校验，再提交 value。
} else {
  const messages = (validate.errors ?? []).map(issue =>
    `${issue.instancePath || '/'} · ${issue.keyword} · ${issue.message}`,
  )
}
```

`validate.errors` 会被下一次调用替换，应立即提取需要的字段，而不是把它当作不变的历史引用。本例使用 `strict:true`、`allErrors:true`，关闭 `coerceTypes`、`useDefaults` 和 `removeAdditional`：验证不会把字符串变数字、补字段或删掉未知键。输出仍是原数据，不像带 transform 的 Schema 自动生成另一个 DTO。

## 实验一：结构通过与业务许可是两件事

运行「最小 JSON 合同」，点「调用 Ajv.validate」，默认订阅通过。`feedSchema` 要求 id/title/url，id 只允许小写字母、数字和短横线；标题有长度范围，未知键不允许。

点「载入字段反例」再验证，会同时看到 id、title、url 和额外属性错误。URL 的 Schema 正则明确要求 **HTTPS 前缀**，所以 HTTP 在第一阶段已经失败，不能用它证明后续业务检查有效。

改点「载入结构通过但业务失败」：带 `reader:secret@` 的虚构 URL 满足该结构合同，但页面应明确显示「JSON Schema 已通过，RSS 业务规则不通过」。[`rss-policy.mjs`](examples/rss-policy.mjs) 的实际 URL 解析拒绝凭据。前缀匹配不是完整 URL 验证；这层自建策略也不是 DNS、内网地址、重定向或抓取权限控制。本实验不发请求。

## 实验二：uniqueItems 不等于订阅身份唯一

切到「批量 RSS 配置」。合同约束 team、1–5 个订阅，每个订阅复用 Feed Schema，`uniqueItems:true` 比较完整 JSON 对象。

先验证默认两条来源。然后载入「结构通过但业务失败」：id 和标题不同，所以两对象不相等，Ajv 允许它们；URL 仅差主机大小写、默认 443 端口和 fragment，经示例 helper 生成的身份键却相同，错误落在 `/feeds/1/url`。

将第二个 URL 的路径从 `/Feed` 改成 `/feed`，再次校验应通过，路径大小写不会被折叠。helper 只用规范化结果比较身份，没有改写输出 URL。把两条记录完全复制成同一个对象则应由 `uniqueItems` 在第一阶段拒绝；结构失败时不会继续调用业务规则，页面会显示具体阶段。

这些规则只描述当前批次，不检查服务端已有订阅。若改成异步服务端查重，应另加请求取消和提交版本控制，不要把同步 helper 当成网络事务。

## 实验三：条件必填与错误聚合

切到「条件规则与失败聚合」，初始反例故意包含 `enabled:true`、`maxConcurrent:0` 和未知字段。运行后可同时看到 minimum、additionalProperties 等错误；`allErrors` 让校验继续收集，不是把非法字段自动修复。

点「载入合法输入」后，`enabled:true/maxConcurrent:3` 通过。手动删除 maxConcurrent 应触发 then 的 required；改成 `{ "enabled": false }` 则不需要该字段。但即使 enabled 为 false，只要仍提供 maxConcurrent，它也必须是 1–8 的整数，因为范围放在公共 properties 中。字符串 `"3"` 不会转成数字。

`if/then` 位于已有 `type:'object'` 的合同内；Ajv 的 strictTypes 会读取祖先类型上下文，并不要求每个 if/then 都机械重复 type。本例没有关闭 strict 来绕过错误。修改条件时应同时审查「字段何时必填」和「字段一旦存在时的范围」，二者不是同一条规则。

## 迁移与取舍

带走源码面板六个文件：入口、组件、`schemas.ts`、业务 helper、声明和必要样式，安装 `ajv@8.20.0`。textarea 有实例独立 label/error id、局部盒模型和焦点样式；编辑、切场景或载入样例都会清掉旧输出。状态仅保存在 React，无网络、定时器或外部订阅。

Schema 校验发生在 JSON.parse 之后；大输入应先限制字节数，服务端仍需独立执行合同和权限检查。运行时编译使用动态函数生成，严格 CSP 项目可选择构建时生成 standalone validator；不要为运行演示弱化自己的 CSP。此页只展示同步运行时编译，没有声称已提供预编译、XML解析或持久化。

## 官方资料与验证

- [官方入门](https://ajv.js.org/guide/getting-started.html)、[strict mode](https://ajv.js.org/strict-mode.html)、[standalone](https://ajv.js.org/standalone.html)。文档站会更新，代码事实以安装的 8.20.0 与固定源码为准。
- 「官方 README」保存 ajv-validator/ajv 固定 npm gitHead `0fba0b8e649909613cfce0999b149cd08f4a4987` 的完整原文。完整 tree 五个 README 候选没有中文，未把自译冒充官方中文；版本、原文摘要和实际 GET 头见 [`source-audit.json`](official/source-audit.json)。
- 官网 GET200 没有禁止嵌入头，但没有 Lab-origin 实测允许证据，公共面板保持 unknown 和直达入口。
- 实际共享合同 SDK、纯业务策略、类型、真实浏览器和独立复核分别记录于 [`local-validation.md`](local-validation.md)，正式三项收据仍独立保持 NOT_RUN。
