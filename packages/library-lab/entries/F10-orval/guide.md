# F10 Orval — OpenAPI 契约到可用客户端

## 场景
让前端只管理一份经过评审的 OpenAPI 契约，通过生成器产生类型和请求函数，减少手写接口漂移。生成客户端**不自动处理**业务权限、服务端错误映射、缓存Key策略、认证和服务端实际兼容性。

## 安装和重现
```bash
pnpm add -D orval@8.44.0
pnpm --filter @reactloom/library-lab exec orval --config entries/F10-orval/examples/orval.config.ts --project basic
pnpm --filter @reactloom/library-lab exec orval --config entries/F10-orval/examples/orval.config.ts --project business
pnpm --filter @reactloom/library-lab exec orval --config entries/F10-orval/examples/orval.config.ts --project advanced
node packages/library-lab/entries/F10-orval/examples/spec-check.mjs
```
其中 **Orval 8 需要 Node >=22.18**；ReactLoom README声明Node>=22.14并不等于满足该CLI，PLATFORM必须在独立CI Job/环境使用兼容Node。依赖由平台维护，本条目只提交本地契约与配置。代码生成 CLI 需要在包工作目录执行，不能从用户任意路径直接传入未审查URL。

## 三层真实例子
**basic**：`client:'fetch',mode:'single'`，由本地 `openapi/news.json` 生成强类型 GET/POST API。
**business**：`client:'react-query',httpClient:'fetch'`，在既有 TanStack Query 应用生成 hooks；需要应用层 Provider、QueryClient、权限与缓存失效策略。
**advanced**：`mode:'tags-split'` 按 Tag 拆分生成模块；必须检查目录中生成物的 import 路径以及是否出现意外清理。

三个配置是真正传给 `orval --project` 的项目，示例不将固定字符串冒充已生成TS源码。

## 重要边界
OpenAPI响应必须真实声明所有成功和错误状态；本契约包含200、201、404、409、422及URL字段。类型是编译期接口契约，不代表运行时响应已校验。生成输出只写 `examples/generated/`，该目录属于可清理的产物，**不能将手写源文件放进去**。本教程绝不生成远程OpenAPI，避免供应链或泄漏风险。

## 错误案例
- OpenAPI遗失操作ID或重复：生成 API 名字不可预测。保持唯一ID并对文档lint。
- 将服务器URL直接硬编码生产：这个localhost URL仅用于隔离示例，真实项目使用有治理的环境连接。
- 认为Hook自动处理所有HTTP错误/认证：明确自建 API Client、Query错误转换及授权。
- 把任意远程 OpenAPI 与代码生成器一起当可信输入：先审核schema与依赖版本，避免覆盖手写目录。
- 仅安装依赖不执行CLI就宣布集成通过：必须检查真实生成产物和 TypeScript 类型。

## 组合实践
D07 TanStack Query、F11 MSW、C02 Zod。Orval生成接口函数与类型，Mock只模拟业务后端，不允许冒充 Orval 已真实执行；运行时验证与Node进程输出各有验收记录。

## 资料与状态
<https://orval.dev/docs/quick-start/> · <https://orval.dev/docs/guides/basics/>。MIT / 8.44.0。尚未运行SDK CLI/构建，原因见 verification.json。
