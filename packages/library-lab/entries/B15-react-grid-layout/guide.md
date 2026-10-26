# react-grid-layout 2.3.0：生产仪表盘布局的状态与约束

## 选型
在固定列宽的业务仪表盘里，需要移动、改变模块尺寸、固定某些模块、保存位置时使用 react-grid-layout。只有两个分栏的编辑器用 B16 react-resizable-panels 更轻，单维列表拖放优先 B13 dnd-kit。

## 版本与安装
```bash
pnpm add react-grid-layout@2.3.0 react-resizable@4.0.2
```
```tsx
import GridLayout,{useContainerWidth,verticalCompactor} from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
const {width,containerRef,mounted}=useContainerWidth();
// width 必须传入；v2 使用 layout、gridConfig/dragConfig/resizeConfig
```
**2.x 和 1.x API 并不通用**：v2 引入 TS 类型、width 明确传入、配置对象、受控 layout；旧 `data-grid`/`WidthProvider` 迁移应使用 legacy 子路径，不能混在本例 v2 组件里。

## 三层演示
基础展示静态 NewsHub 三模块看板，强制 `dragConfig.enabled=false`；业务层允许通过 `.lab-grid-handle` 拖动或缩放，并将更新后的布局作为 React state；进阶锁定头部面板，宽度不足自动切换 6 列，提供重置、可序列化 JSON 和键盘位置及宽度调整替代。

## 数据契约
`Layout` 每项使用稳定 `i`，必须与子节点 React key 一致。`x/y/w/h` 是网格单位，不是像素。`minW/maxW` 也为列单位；初始布局应适配当前 cols。来自服务端的用户布局必须验证字段、总列数、唯一 ID、权限和布局版本后再渲染，不能将用户 JSON 直接控制 CSS 选择器或 DOM 内容。

## 容器宽度与响应式
`useContainerWidth()` 在挂载后测量父容器，组件仅在 `mounted && width>0` 渲染。当前示例通过 min/clamp 把单个宽屏布局投影到窄屏，不代表生产的多断点持久化；正式产品需维护每个 breakpoint 的 layouts，或使用响应式 API 并保证不同屏幕之间切换不会覆盖原布局。

## 拖动与键盘交互
只让拖动句柄处理拖动，按钮的点击不能意外开启拖动。`resizeConfig` 的控件需要 CSS 文件，未导入时可能不可见。指针拖动和键盘操作必须产生等价结构状态；如果某项 static=true，则交互按钮也禁用。可配置 compact/碰撞策略，不能认为插入一条数据会保持旧的所有坐标。

## 反例与修复
1. **沿用旧API**：用 v1 `cols`, `rowHeight`, `WidthProvider` 的平铺 props 传给 v2；改用 gridConfig 与 useContainerWidth。
2. **容器宽度零**：Tab 未显示前构建网格，导致布局跳变；必须等 mounted 与 width。
3. **使用数组下标当 i**：新增/移除后布局错乱，改为业务主键。
4. **回调里直接修改只读对象**：clone `onLayoutChange` 参数后存储，不直接赋值。
5. **按钮抢占拖动**：用 handle/cancel 边界并给触摸/键盘替代。
6. **无验证覆盖的 localStorage 恢复**：旧用户字段可能越界；版本化布局 Schema，加迁移/回退。

## 组合
可在单个 Grid item 内放 A01 ECharts，但容器缩放时图表需要自己的 ResizeObserver/resize；看板 layout 只管理位置，数据请求缓存交给 D07 TanStack Query。

## 验证计划（当前 NOT_RUN）
后续由 PLATFORM 统一安装真实依赖、写 pnpm 锁、运行 TS/Vite。浏览器需验证拖动/缩放后的坐标、窄屏、禁止静态块拖动、键盘替代和卸载无残留。当前源码与文档已提交，不称为生产构建通过。

## 官方资料
- [GitHub README 和 2.x 迁移](https://github.com/react-grid-layout/react-grid-layout)
- [npm react-grid-layout](https://www.npmjs.com/package/react-grid-layout)
- [react-resizable 样式和 API](https://github.com/react-grid-layout/react-resizable)

MIT 许可。
