# B10 Base UI

## 适用

已有视觉系统、需要无样式复选框语义时用 `@base-ui/react` 的 Checkbox。完整后台皮肤用 B06/B07/B08。不要把勾选结果当成服务端授权。

## 版本

`@base-ui/react@1.9.0`，从 `@base-ui/react/checkbox` 导入。React 19.3.0。许可证 MIT。不是 `@mui/base`，不是 Uber `baseui`，没有 Radix `asChild`。

## 迁移

从 `@mui/base` 迁移时重写 Root/Indicator 和 CSS，并回归混合态与禁用。不要把 Dialog 教程贴进当前只挂载 Checkbox 的示例。

## 不可删的清理

外层 `<label>`。父级 `indeterminate` 来自可选集合而不是写死的 3。锁定 `manage` 时 Root `disabled`，策略函数再拒绝一次。子项保留 `name` 和 `value`，提交读 `FormData`。样式留在 `checkbox.css`。

## 反例

用 div 模拟勾选导致表单为空。父级分母忽略锁定。只加灰色 class 而不 `disabled`。提交只读可能过期的 React 数组。从错误的包导入。Indicator 代替状态文字。

## 测试断言

`tests/permission-policy.test.mts` 断言可选 id、部分选择为混合、锁定后全选不含 manage、对锁定 id 的写入被拒绝。不证明键盘、隐藏 input 或浏览器 FormData。

## 真实限制

已挂载：受控 Checkbox、批量选择、混合态、禁用和本地 FormData。未挂载：Dialog、Popover、Field、HTTP 冲突。遮罩焦点和异步关闭不在本文件里。

## 证据

sdk、build、browser 为 NOT_RUN，直到 `docs/library-lab/evidence/runs/` 有匹配 receipt。Actions run `41779873259` 是仓库级检查，不是本条目 PASS。文档：https://base-ui.com/react/components/checkbox
