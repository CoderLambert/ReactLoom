# C05 Ajv — Agent 工程指南

**推荐任务：**外部 JSON Schema 合同、第三方 API 配置验证、动态表单值校验。**不要用：**替代后端权限/SSRF 检查、在前端执行用户提供的任意 Schema、伪装 TypeScript 运行时类型守卫。

## 读取与迁移
先看 `library.json` 和 `verification.json`，再读 `examples/example.tsx` 及 `tests/sdk.test.mjs`。保留受信任的静态 Schema、`strict:true`、`allErrors:true`、`coerceTypes:false`、`removeAdditional:false`；不要复制 Lab 的状态按钮到目标项目。

## 真实 API
`import Ajv from 'ajv'; const ajv = new Ajv(...); const validate = ajv.compile(schema);`。解析外部 JSON 为 `unknown`，编译在组件外或 memo 生命周期内，`validate(data)` 失败立即保存 `validate.errors`。多草案和 format 插件不可乱混；字段校验不是访问目标白名单。

## 工程底线
禁止全局禁用 strict，禁止将未经审查的外部 schema 直接交给编译器。遇严格 CSP 请采用 build-time standalone 方案并独立验证；不得通过放宽 CSP 解决。性能评估需要真实 schema 与输入；不能凭“最快校验器”宣传作结论。

## 验收断言
合法 payload、缺字段、额外字段、类型混淆、条件必填、schema 编译失败都要验证；SDK Node 与 Browser CSP 分别记证据。运行 `node --test entries/C05-ajv/tests/sdk.test.mjs`、`pnpm --filter @reactloom/library-lab typecheck` 和生产预览 E2E。当前状态 NOT_RUN，不得继承历史报告 PASS。

官方： https://ajv.js.org/ 。替代方案：C02 Zod / C03 Valibot；互补 C04 JSON Forms。
