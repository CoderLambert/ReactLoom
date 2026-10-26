# Valibot 1.4.2 — Schema 作为边界合同

## 为什么在前端使用
RSS、OPML 和第三方 JSON 都是不可信输入。TypeScript 接口只负责开发时提示，运行时仍需要解析、收窄并拒绝错误字段。Valibot 将 schema/action 设计为可独立导入的函数，适合体积敏感且追求显式组合的项目。它并不负责网络请求、表单输入状态或安全沙箱。

## 安装和代码位置
```bash
pnpm add valibot@1.4.2
```
真实 React 示例见 `examples/example.tsx`，三个 level 分别调用同一个文件中的 schema；`examples/demo.tsx` 仅导出 Lab 入口。源码 Tab 由实际文件生成。

## 入门：unknown → safeParse
读入用户输入时先用 `JSON.parse` 转为 unknown；声明 `v.object`、`v.string`、`v.pipe` 及 `v.trim`；执行 `v.safeParse` 并区分 `result.success`。成功后只使用 `result.output`，避免携带原对象中的额外敏感字段。结构错误不是 JS 类型错误，应返回可读信息。

## 业务：RSS 批量导入
`BatchSchema` 使用 `v.array(FeedSchema)`、`v.minLength`，同时限定 URL 的合法语法和 HTTPS 协议。输入有效不意味着 URL 可访问、XML 有效或存在订阅权限；这些必须由后端单独校验。不能把客户端 Schema 作为 SSRF 保护。

## 进阶：跨字段约束
`WindowSchema` 使用 `v.partialCheck` 在字段有效时验证开始/结束日期，并用 `v.forward` 将错误分配给 `end`。这与仅调用 `v.check` 的执行时机不同。日期先限定 YYYY-MM-DD 格式，再作字典序比较；仅在 ISO 同格式民用日期时成立，不能用于带时区的绝对时刻比较。

## 生产最佳实践
- 保留 `unknown` 到解析边界；禁止 `JSON.parse(...) as DTO`。
- 将共同的来源字段抽成 schema，按场景组合；不要在 React render 内重复定义昂贵 schema。
- `object` 默认只输出声明的字段；若需要保留未知字段，应明确采用其他 object schema 并审计风险。
- 校验 UI 可返回字段路径、消息与原始值；日志对令牌和 PII 必须脱敏。后端需要再次独立校验。
- 可在构建中观察 tree shaking，但不要凭官网微基准自行宣布体积或速度收益。

## 三组反例
1. **只有 TS 类型**：导入后直接断言 payload 类型 → 在运行时漏过非法 URL；修复为 safeParse。
2. **只验证 URL 字符串**：`v.url` 并不强制 HTTPS → 在业务规则中追加协议检查，服务端仍拒绝内网/保留地址。
3. **把格式等同日期有效性**：YYYY-MM-DD 字符串格式检查不足以表达时区和真实日期业务 → 与日期库明确分层校验。

## 组合与迁移
与 C01 React Hook Form 组合时采用 resolver 或 submit 边界显式转化错误；与 C02 Zod 二选一时重点比较既有生态、API 熟悉度和实际构建报告；C05 Ajv 更适合外部 JSON Schema 作为事实源的项目。练习：构造坏 RSS、重复 feed、跨字段日期三套 fixture，并在导入前返回定向提示。

## 证据边界
`tests/sdk.test.mjs` 直接引入官方 Valibot，验证结构收窄、无效 URL 和跨字段错误。此轮未完成目标包安装/SDK 执行/浏览器验收，见 verification.json。该文档不引用历史研究测试为 PASS。

## 官方一手资料
- https://valibot.dev/guides/introduction/
- https://valibot.dev/guides/parse-data/
- https://valibot.dev/api/partialCheck/
- https://github.com/fabian-hiller/valibot

许可：MIT。示例数据为本项目 fixture。
