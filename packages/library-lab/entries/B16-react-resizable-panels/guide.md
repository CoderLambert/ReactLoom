# B16 react-resizable-panels — 面板布局和键盘缩放

## 适用边界

IDE、知识库、邮件工作台和仪表盘的左右/上下分栏。它解决连续面板分割，不负责二维自由拖拽、内容排序或虚拟列表。与 B15 react-grid-layout 和 B13 dnd-kit 的交互所有权不同。

## 安装与准确的 v4 API

```bash
pnpm add react-resizable-panels@4.14.1
```

```tsx
import {Group, Panel, Separator} from 'react-resizable-panels';
<Group orientation="horizontal">
  <Panel defaultSize="30%" minSize="16%">左边</Panel>
  <Separator aria-label="调整两侧面板尺寸"/>
  <Panel defaultSize="70%">右边</Panel>
</Group>
```

**重大迁移点：** v4 使用 `Group / Panel / Separator` 而不是旧 `PanelGroup / PanelResizeHandle`；**数字尺寸代表 px**，例如 `defaultSize={25}` 不是百分比，`defaultSize="25%"` 才是。

## 三层实际 Demo

基础：项目资源与详情预览双栏，最小尺寸阻止区域完全不可操作。业务：资源、编辑器、检查器三栏，三个面板尺寸总和按 100% 设置。进阶：横向/纵向切换、最小约束、手动重置，在键盘 Tab 后使用方向键控制 Separator。

示例源码：`examples/example.tsx`。Lab `examples/demo.tsx` 只重导出；源码展示由生成器读取实际文件。

## 生命周期和布局数据

Group 负责拖动事件与尺寸分配，业务可订阅 `onLayoutChanged` 在交互结束后保存布局。当前演示仅显示实际回调数据，不跨页面写 localStorage；不能据此宣称“持久化功能已实现”。

对于正式产品，按官方 v4 方案使用 `useDefaultLayout` 和有命名空间的 storage（或 SSR cookie），明确 schema/version 与失效策略。不要将旧版 `autoSaveId` 直接复制到 v4。

## 专属反例

1. **旧版组件名直接升级包**：`PanelGroup`/`PanelResizeHandle` 已不再是 v4 推荐 API；按 changelog 迁移。
2. **数字误认为百分比**：`defaultSize={30}` 实际是 30px；统一显式传 `30%` 或 `300px`，回归不同窗口大小。
3. **每次鼠标移动都写 localStorage**：频繁持久化和主线程竞争；使用 `onLayoutChanged` 或防抖策略保存最终布局。
4. **只用 pointer 拖动**：漏掉键盘用户；应使用真正的 Separator 而非 div 加鼠标监听。
5. **边界没有 minSize**：窗口缩小时面板变得不可用；设置合理最小尺寸并测试小屏布局。
6. **Separator CSS 指针命中区域过窄**：触摸设备难以操作，至少提供可接受的 hit target。
7. **在自由拖拽控件内嵌分割条却不定义事件边界**：B13/B15 拖动与本库可能抢指针，明确 handle 目标和事件传播。

## 生产校验

浏览器真实拖动、键盘方向键、最大/最小约束、三栏总分配、从纵向切回横向、重置后无旧数据污染。当前实现尚未安装本库运行或浏览器测试，SDK/build/browser 保持 NOT_RUN。

## 官方依据

- [v4 官方接口与示例](https://github.com/bvaughn/react-resizable-panels)
- [CHANGELOG v3→v4 迁移](https://github.com/bvaughn/react-resizable-panels/blob/main/CHANGELOG.md)
- MIT，未包含第三方媒体素材。

## 第14轮：窄容器和多实例冲突

修复包内 Demo 固定 `minWidth:270` 导致小于 270px 的实际容器横向溢出。用 `minWidth:0` 保持布局随容器缩放（实际不可读宽度由 Group/Panel 自身 minSize 约束，生产应考虑小屏改纵向或折叠）。Group、Panel、Separator 的 DOM ID 使用 React `useId()` 生成实例前缀，避免多个 DemoHost 同时挂载时发生重复 ID / ARIA 指向冲突。仅 Separator 的触控手柄禁用默认手势，使面板滚动区域保持正常滚动。

仍须实际安装 react-resizable-panels v4，用 Chromium 验证 240px 宽容器、两个同时挂载的实例、键盘方向键、触摸分割条及重置焦点；本轮没有把源代码修改标为浏览器 PASS。
