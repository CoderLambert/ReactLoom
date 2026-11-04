# B16 react-resizable-panels

## 适用

相邻窗格要拖动边界、约束最小最大、并用键盘调分割条时使用 v4。二维仪表盘用 B15。不调整尺寸的页面用 CSS。本库不保存文章数据。

## 版本

`react-resizable-panels@4.14.1`，React 19.3.0。许可证 MIT。组件名是 `Group`、`Panel`、`Separator`，属性是 `orientation`。百分比用 `"25%"` 这种字符串。研究笔记中的 4.14.8 不是当前锁。

## 迁移

v3 的 `PanelGroup`、`PanelResizeHandle`、`direction`、`autoSaveId` 不要留在新代码里。数字 `30` 不是 30%。升级补丁版本前先改锁文件，不要把更新日志里的修复提前写成已包含。

## 不可删的清理

`useId` 隔离 id。容器有高度且 `minWidth: 0`。分割条有 `aria-label` 和 `touch-action: none`。方向或复位用 `key` 重挂默认尺寸。只把 `onLayoutChanged` 的结果写入状态，不在拖动中间回调里发请求。

## 反例

v3 组件名。`defaultSize={30}`。用 div 冒充 Separator。固定 id 导致多实例串扰。`onLayoutChange` 里 PUT。面板和正文共用一个权威对象。声称有 collapse 或服务器恢复。

复用时保留这些不变的约定：

- 组件是 Group、Panel、Separator；尺寸百分比用字符串。
- 锁是 4.14.1，不要把 4.14.8 的修复写成已包含。
- id 来自 `useId`；复位靠 key 重挂。
- 只读 `onLayoutChanged`，不在拖动中回调里 PUT。
- 没有 collapse、usePanelRef 或服务器布局。

## 测试断言

本目录没有 policy 测试。不要把布局 JSON 的出现写成测试通过。浏览器里应断言分割条角色、方向键和最小尺寸，但那些检查尚未形成 receipt。

## 真实限制

已挂载：两栏和三栏、纵向切换、复位、结束时的布局字符串。未挂载：`usePanelRef`、折叠、`useDefaultLayout`、嵌套 Group、预览模式、HTTP。刷新丢失尺寸是当前边界。

复用检查：

- 版本以该条目 `library.json` 为准，不跟研究稿里的 Vite 脚本或 workshop 目录。
- 未挂载的生产模式留在 `guide.md`，不补进 `examples/`。
- 不修改 `verification.json`。没有匹配 receipt 时 sdk、build、browser 保持 NOT_RUN。

## 证据

sdk、build、browser 为 NOT_RUN，直到 `docs/library-lab/evidence/runs/` 有匹配 receipt。Actions run `41779873259` 是仓库级检查，不是本条目 PASS。文档：https://github.com/bvaughn/react-resizable-panels
