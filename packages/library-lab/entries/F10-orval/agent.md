# F10 Orval — Agent 使用说明

**任务**：从已审核的OpenAPI文件生成而不是手写TS客户端。检查Node >=22.18、`orval@8.44.0` peer依赖、应用使用的HTTP协议与框架。Orval是**开发时代码生成器**，不是生产运行时代理。

## 迁移文件
先读 `examples/openapi/news.json` 的path/operationId/状态码，再读 `examples/orval.config.ts` 三项目配置。仅迁移你需要的项目；严格限定input来自已审查本地契约、output进入隔离的generated目录。命令行见 `examples/basic.mjs` / `business.mjs` / `advanced.mjs`。文件复制后必须更新目标路径，不将示例 localhost 硬编码产品。

## 不可删除的工程约束
- 生成物是派生代码，生成器运行必须在 CI/构建前完成并可重现。
- 工具只有静态类型承诺，服务端实际payload、错误码/权限和分页仍需真实契约与运行时校验。
- TypeScript的Query hooks依赖正确Provider，缓存Key、取消/竞态和无效化归业务层所有。
- 不可将私有契约上传在线代码生成服务或自动运行未知远程spec。
- 输出目录不得容纳手写业务代码；避免`--clean`影响无关路径。
- 旧SDK或旧API配置不得照搬；版本与许可确认后才能锁定。

## 必要验收
`node examples/spec-check.mjs`只验证fixture，不是目标SDK测试。必须真正运行`pnpm exec orval --config ... --project basic/business/advanced`，检查生成产物、React Query hooks、错误响应类型、重复生成 diff稳定性和tsc。CI runner无法执行则状态NOT_RUN/BLOCKED，不能把spec-check PASS当Orval PASS。

官方：<https://orval.dev/docs/>
