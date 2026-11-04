# B16 react-resizable-panels — Agent 工程笔记

适用于有一个方向分割的 IDE/邮箱/知识工作台；不适合自由二维摆放内容（B15）或拖动卡片排序（B13）。使用 `react-resizable-panels@4.14.1`，MIT。

直接阅读 `examples/example.tsx` 与独立 `library.json`。迁移时复用 `Group > Panel / Separator / Panel` 结构，而不是复制整个 Library Lab 页面。业务侧仅保留必要的方向开关、样式和回调。

### 关键约束

- v4 组件是 `Group, Panel, Separator`，不能照旧导入 `PanelGroup`。
- 数值 size 按像素解释；% 必须写成字符串，避免不可控的30px侧栏。
- Separator 提供真实焦点与键盘调整，不自己仅实现 mousemove。
- minSize/maxSize 设置合理可访问的上下界，并验证极窄窗口。
- 持久化用官方 `useDefaultLayout` 等契约，命名空间专有；本示例只观察`onLayoutChanged`，未实现存储。
- 区分 onLayoutChange（持续）与 onLayoutChanged（稳定保存），不要每个 pointer move 做昂贵同步更新。
- 与dnd-kit/react-grid-layout组合时先明确手势竞争。

### 迁移验收

实际SDK import+typecheck+build、浏览器拖动和键盘、纵向切换、最小约束、重置与卸载。业务布局数据可以自造，但不能mock Panel库后标 SDK PASS。现 verification.json 尚无真实 SDK/浏览器通过证据。

官方 https://github.com/bvaughn/react-resizable-panels 。

## wave14 响应式约束

把示例复制到多面板业务前保留 `useId` 实例命名空间，防止跨实例重复 Group/Panel/Separator ID；容器不得设置固定大于实际手机可视区域的 `minWidth`。只对分割条设置 `touchAction:'none'`，不要禁用整个编辑器面板的触摸滚动。需要真实触摸和键盘回归；现 SDK/build/browser NOT_RUN。
