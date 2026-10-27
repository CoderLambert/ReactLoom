# Ajv 8.20.0：让 JSON Schema 成为运行时合同

## 适用任务与边界
在接收外部 RSS 导入清单、第三方 OpenAPI 响应、插件配置或版本化 JSON 时，TypeScript 的 `as` 不能防止恶意或错误数据进入业务状态。Ajv 将**受信任的 Schema** 编译为校验函数，兼容 JSON Schema 的多种草案。本例使用默认 draft-07；跨项目切换 draft-2020-12 时需要按对应入口创建 Ajv 实例，不能混合版本。

## 安装与真实源码
```bash
pnpm add ajv@8.20.0
```
示例来自 `examples/example.tsx`，入口 `examples/demo.tsx`；测试文件 `tests/sdk.test.mjs` 直接导入官方 Ajv。代码面板只展示这两份运行文件，不维护手抄副本。

## 三层场景
**入门：**用 `type/properties/required/additionalProperties` 校验 RSS 源对象，拒绝错误类型和未知字段。**业务：**验证含多个来源的分组，限制数组长度和条目格式。**进阶：**使用 `if/then` 强制启用任务时提供合法并发数；`allErrors: true` 汇报所有 schema 错误。

用户可修改 JSON，观察 `instancePath`、`keyword` 和 `message`。语义错误展示通过文本，而非只变颜色。每层对同一个 schema 编译一次，编辑输入时复用 validate 函数。

## 必须理解的运行机制
`compile(schema)` 产出会执行的 JS 校验逻辑，并将错误存于当前 `validate.errors`。这意味着不应在无信任边界的环境中编译用户任意 Schema；严格 CSP/不允许动态代码生成的环境，需要单独预编译独立校验器，而不是关闭全部安全策略。默认 `coerceTypes:false`、`removeAdditional:false`、`useDefaults:false`，**拒绝**而不是静默修改业务输入。

## 五个常见生产错误
1. **把远程 schema 直接交给 compile：**schema 不等同于可信输入，需来源审核、大小/深度限制及版本白名单。
2. **假定 Ajv 自带 email/url/date format：**v8 的标准 formats 通常需 `ajv-formats`；本实验刻意只用内置关键字与 HTTPS 前缀模式，不能冒充 URL 安全校验。
3. **校验失败后再调用同一个 validate：**`validate.errors` 可能被后一次调用覆盖；应立即快照错误后再异步处理。
4. **假定 JSON Schema 等于 SSRF 防护：**服务端必须重新检查解析后的域名/IP/跳转及最终访问目标。
5. **关闭 strict 逃避未知关键字：**优先修正规范和关键词；严格模式帮助发现拼错或未支持的 Schema。

## 组合、测试与替代
C04 JSON Forms 负责根据 JSON Schema 渲染控件，Ajv 负责值校验。C02 Zod 与 C03 Valibot 更适合 TS-first 数据合同；API-first 系统若上游已生成标准 JSON Schema，则 Ajv 避免重复手工维护类型定义。业务输入变化应配置 schema 版本迁移，不直接覆盖旧配置。

至少断言：合法数据通过；错误类型和额外字段均失败；条件必填正确；服务端仍做独立权限/URL 安全校验。Node SDK 测试验证上述函数，不证明浏览器 CSP 或复杂 schema 规模性能。

## 事实与来源
- [官方文档](https://ajv.js.org/guide/getting-started.html)
- [严格模式](https://ajv.js.org/strict-mode.html)
- [npm v8.20.0](https://www.npmjs.com/package/ajv)

授权 MIT。源码写入不等于已安装/通过，执行状态以 `verification.json` 和具备源码指纹的日志为准。
