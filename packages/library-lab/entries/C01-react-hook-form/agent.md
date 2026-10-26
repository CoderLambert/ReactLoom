# C01 React Hook Form — Agent 工程实施手册

## 任务识别

适用：多字段编辑、动态行、表单校验、受控 UI 集成、服务端字段错误。简单静态输入先评估原生 `<form>`；JSON Schema 自动构建表单考虑 C04。

## 版本与可用性

当前研究版本 `react-hook-form@7.89.0`，MIT，与仓库 SPA 模板对齐。不自动追新 major；v7 字段数组使用 `field.id`。条目 `verification.json` 当前为 NOT_RUN，不能当经过生产测试的可复制模块。

## 可迁移实现

- 唯一可复制入口：`examples/example.tsx`；`examples/demo.tsx` 仅供 Lab 适配。
- 目标项目引入 RHF 并复制真实业务字段类型、useForm defaultValues、register、useFieldArray、handleSubmit、setError。
- 保留 `field.id` 作为 key、字段级 ARIA 错误提示、组合输入态保护。
- 将示例的 `delayWithSignal` / local 409 fixture 替换为项目真实 API Client，**不要**复制成生产请求实现。
- 请求 ID 与 AbortSignal 的所有权必须在表单卸载/取消时清理。
- 若数据来自 Query/Loader，必须明确 reset/dirty 策略；不能无条件把服务器新数据刷到正在编辑的表单。

## 不可忽视的反例

1. 不要混用 `Controller` 与同一字段 `register`。
2. 不要给动态字段用数组索引 key。
3. 不要把 `setError` 当持久服务器状态，也不要把 RHF 验证当作服务端授权。
4. 不要将未知服务器字段路径传给 `setError`。
5. 不要在 IME composition 过程中强制 trim/替换输入值。

## 必跑断言

入门：必填/HTTPS 错误正确提示并聚焦；业务：新增/删除字段仍保留字段值与稳定 key；进阶：409 错误回填到准确字段、取消/卸载不会旧结果覆盖。无障碍检查 label、aria-invalid、role=alert，真实浏览器验证键盘和 IME。

可执行的仓库命令：`pnpm --filter @reactloom/library-lab catalog:check`、`typecheck`、`build` 和定向 `test:e2e`。本条未真实执行前不得声明 PASS。

## 官方依据

https://react-hook-form.com/docs/usefieldarray
https://react-hook-form.com/docs/useform/seterror
https://react-hook-form.com/docs/useform/reset
