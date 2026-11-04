# B10 Base UI — Agent 开发参考

## 范围与版本

适合构建自有视觉的无样式且语义正确的 React 组件。当前只验证了**基于官方文档编写的 Checkbox API 源码**，实验依赖为 `@base-ui/react@1.9.0`。没有运行SDK，不应声称整个Base UI已通过验收或加载。与 B11 Radix 是替代原语体系，不建议一个组件中并用两套事件/focus owner。

## 最小迁移清单

读取 `examples/example.tsx` + `examples/checkbox.css`；`examples/demo.tsx` 为 Lab 入口。迁移时只复制需要的权限模型、Root/Indicator以及按 checked/indeterminate 显示状态的 CSS。真实服务端授权、审计和 API 需要重新实现。

## 必须保证

- 默认 Root 的包裹 label 模式包含文字标签、受控 checked/onCheckedChange。
- 父级 all/partial 分开计算，不能仅取“第一个孩子”的值。
- 业务 disabled 交给 Checkbox.Root 的真实 disabled 属性，不只是 CSS 灰显；权限后端再验一次。
- Checkbox.Root 的 hidden input 支持原生 FormData；在目标表单测试返回的值集合。
- Label 内不要嵌套额外 button；兄弟 label 使用官方 nativeButton/render API。

## 核验命令与断言

真实SDK import、TS/Vite构建、浏览器键盘Space/Tab、label点击、半选、禁用无法勾选、FormData值精确、Unmount释放；React19多次挂载。无网络和付费服务。不可用 Mock Checkbox 算通过。当前sdk/build/browser为NOT_RUN，不得继承旧报告状态。

文档 https://base-ui.com/react/components/checkbox ；许可 MIT。


## Agent 迁移边界：本轮修复：锁定权限下的父级混合态

原实现总以三个权限计算父级 `checked/indeterminate`，锁定管理权限后只剩两个可选项，即使两项全选也永远显示混合态，父级再次点击无法取消。本轮通过 `examples/permission-policy.ts` 以**当前可选权限集合**计算父级状态和 `n/n 可选`，在状态更新层拒绝锁定 `manage`，而不仅依赖控件 disabled。进入非 advanced 模式不继承隐藏锁定开关。使用真实 Base UI Checkbox，`tests/permission-policy.test.mts` 为纯规则检查；Space/label/FormData 仍需真实 SDK 浏览器验证。
