# B11 Radix Dropdown Menu

## 适用

自有样式、需要菜单键盘、复选、单选和子菜单时用 `@radix-ui/react-dropdown-menu`。对话框、提示条和异步确认不是这个包。完整皮肤组件库另选。不要自己实现焦点陷阱。

## 版本

`@radix-ui/react-dropdown-menu@2.1.25`，React 19.3.0。许可证 MIT。当前文件不要改成未安装的统一包 `radix-ui`，也不要顺手加入 Dialog。

## 迁移

从手写 div 菜单迁过来时删掉 document keydown。`asChild` 子节点必须转发 props 和 ref。若其他条目使用统一包导入，不要在同一组件混用两套入口。

## 不可删的清理

触发器是单个 `button`。CheckboxItem 的 `onSelect` 调用 `preventDefault`。删除同时看 `disabled` 和 `deleteFeed(..., locked)`。筛选后重设选中 id。SubContent 放在 Portal 中。样式只用 data 属性钩子和 `dropdown.css`。

## 反例

吞掉 asChild 的 props。button 嵌套 button。全局 keydown 陷阱。勾选后菜单被关掉。锁定只做样式。用会立刻关闭的 AlertDialog.Action 发异步删除（且本示例并未挂载 AlertDialog）。`display:none` 隐藏对话框标题。

复用时保留这些不变的约定：

- 只导入 `@radix-ui/react-dropdown-menu`，不在本文件添加 Dialog。
- Trigger `asChild` 包单个 button。
- CheckboxItem 的 `onSelect` 调用 `preventDefault`。
- 删除看 `disabled` 和 `deleteFeed` 的 locked 参数。
- 不注册 document 级焦点陷阱。

## 测试断言

`tests/feed-policy.test.mts` 断言 scope 过滤、置顶优先、锁定时 `deleteFeed` 不移除。不证明键盘、typeahead、Portal 或 Esc 回焦。

## 真实限制

已挂载：受控菜单、本地重命名、置顶、排序、子菜单筛选、禁用删除。未挂载：Dialog、AlertDialog、Tooltip、HTTP、IME 字段、触发器被卸载后的焦点回退。

复用检查：

- 版本以该条目 `library.json` 为准，不跟研究稿里的 Vite 脚本或 workshop 目录。
- 未挂载的生产模式留在 `guide.md`，不补进 `examples/`。
- 不修改 `verification.json`。没有匹配 receipt 时 sdk、build、browser 保持 NOT_RUN。

## 证据

sdk、build、browser 为 NOT_RUN，直到 `docs/library-lab/evidence/runs/` 有匹配 receipt。Actions run `41779873259` 是仓库级检查，不是本条目 PASS。文档：https://www.radix-ui.com/primitives/docs/components/dropdown-menu
