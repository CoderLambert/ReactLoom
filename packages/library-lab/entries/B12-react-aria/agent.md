# B12 React Aria Components — Agent 移植指南

## 选型

需要多语言、键盘和读屏兼容的 React Headless 交互时选 React Aria Components；此示例基线 `react-aria-components@1.21.0`，Apache-2.0。不要把某个库的 ComboBox 与 Radix/Floating UI 的独立焦点管理直接叠加。

## 源码与最小迁移

`examples/example.tsx` 真实调用 ComboBox/Input/Label/Popover/ListBox/ListBoxItem；`examples/combobox.css` 提供局部样式；`examples/demo.tsx` 只是 Lab 入口。复制到目标项目时需改写 CHANNELS 为真实数据源，异步查询联动后端安全过滤和取消；不要将本地 240ms timer 称为真实远程请求。

## 不可删的语义

- `selectedKey` 是对象 ID，`inputValue` 是用户正在输入的字符串，互不替代。
- 保留 name 属性与服务端 ID 校验；禁用选项用 `isDisabled`，而不是 CSS。
- 由 React Aria 处理组合键/IME/Popover，避免全局 Enter handler、重复焦点 trap。
- 异步建议更新需 AbortSignal 与 generation，卸载清理旧结果。
- 列表条目使用稳定 ID 和 textValue，确保过滤、读屏和提交映射准确。
- 维护无结果、加载状态文本，支持读屏与离线失败恢复。

## 真实验收

实际导入和构建、Chromium 中文合成输入、Up/Down/Enter/Escape、禁用项、FormData ID、异步竞态与卸载、键盘焦点和读屏。若 SDK 未安装或Runner不可用，填 NOT_RUN/BLOCKED，不可把静态语法/fixture结果写成 PASS。

官方 https://react-aria.adobe.com/ComboBox ，源码 https://github.com/adobe/react-spectrum
