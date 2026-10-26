# B15 react-grid-layout — Agent 实施指南

## 何时采用
二维固定网格、模块尺寸/位置编辑、仪表盘布局持久化选 react-grid-layout；普通 split pane 选 B16，单维拖放选 B13。当前基线 react-grid-layout@2.3.0 和 react-resizable@4.0.2（MIT）；与 1.x API 不兼容。

## 迁移路径
依次看 library.json / examples/example.tsx / guide.md / verification.json。核心代码为 `Layout` 状态、`useContainerWidth`、GridLayout 配置与响应式投影；Lab 的固定新闻示例数据应替换为目标项目 schema。

## 必须保留
- 真实宽度测量；width 不能在隐藏容器读取零。
- 稳定业务 ID 对应 `layout[i]` 和 React key，进入 store 前做 Schema 校验与版本化。
- v2 `gridConfig`/`dragConfig`/`resizeConfig`，明确 `layout` 与 `onLayoutChange` 的所有权，克隆回调数据。
- 样式导入 react-grid-layout + react-resizable；只拖句柄，不让卡片按钮被视为拖动。
- 屏幕尺寸变化时避免不可逆压缩用户已保存布局；正式系统使用多断点布局。
- 对不能依赖指针的用户提供 keyboard 操作，并对 static 项禁用全部移动控件。

## 禁忌
不要混用 `react-grid-layout/legacy` 的 `WidthProvider` 与本例 v2；不要把旧 localStorage 当可信 schema；不要在每次渲染重置 layout；不要引入未验证的碰撞策略或在回调中直接修改 readonly 输入。

## 实测清单
真实 SDK import、typecheck/build、拖动和调整尺寸、状态和 JSON 一致、窄屏6列、锁定、键盘可用、卸载无 ResizeObserver 泄露。尚未实际运行：sdk/build/browser 保持 NOT_RUN。官方 https://github.com/react-grid-layout/react-grid-layout
