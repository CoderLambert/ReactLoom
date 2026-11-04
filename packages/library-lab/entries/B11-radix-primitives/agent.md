# B11 Radix Primitives — 给 Agent 的实用手册

## 选型

适合建立**自己拥有样式的可访问 React 控件**；演示具体原语为 `@radix-ui/react-dropdown-menu@2.1.25`。需要完整现成视觉系统时先看 B07 MUI / B08 Mantine / B06 Ant Design。此条目不是“全部Radix组件都已完成”。

## 可迁移实现

读取 `examples/example.tsx` 和 `examples/dropdown.css`，`examples/demo.tsx` 只是 Lab 导出。复制 Root/Trigger/Content/Item 或 Checkbox/Radio/Sub 的需要部分；业务状态、样式 token、权限检查根据目标项目重建。避免把菜单中的模拟“删除”当成真实后端操作。

## 不可删除的边界

- Trigger asChild 时只包含一个真实可聚焦子节点（button），保留 type=button。
- 使用 Radix Root open/onOpenChange 控制显示，不自建全局 document keydown/Escape。
- Portal 中使用自身样式类；highlight/disabled 与可访问状态对应。
- CheckboxItem 的保持打开行为仅在适当的多选任务上 preventDefault；普通选择默认关闭。
- 禁止项必须传 disabled，后端授权仍独立执行。
- 弹窗控制只属于当前组件；卸载 Tab 时不应留下 Portal 或焦点劫持。

## 核心验收

实际SDK键盘 Enter/Space/Arrow/Escape/typeahead；勾选项不关闭菜单，Radio互斥，禁用删除无法执行，焦点返回 Trigger；Tab卸载 Portal 清理、触屏/小窗口定位。用真实原语测试，不 mock @radix-ui SDK 后标 PASS。验证当前为 NOT_RUN，依赖安装和真实浏览器须由 PLATFORM 补验。

许可 MIT，官方 https://www.radix-ui.com/primitives/docs/components/dropdown-menu


## Agent 迁移边界：本轮修复：菜单动作驱动真实本地列表

旧菜单的筛选、排序、删除大多只替换状态提示，不改变可见数据。现由 `examples/feed-policy.ts` 持有确定性可迁移规则：置顶优先、时间/热度排序、仅未读/有收藏筛选、锁定删除防越权。三层示例仍使用真实 Radix Root、Portal、CheckboxItem、RadioItem、Submenu；列表按钮可键盘选择，选择不同筛选时同步选中第一条可见订阅，删除会更新实际本地集合而不访问后端。 `tests/feed-policy.test.mts` 只证明纯数据规则，Portal/Escape/焦点返回需要浏览器验证。
