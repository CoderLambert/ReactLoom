# react-arborist 3.16.0 — 树形虚拟化和可控拖拽

## 场景与定位
适合 NewsHub 的 RSS 分组、标签树和类似 VS Code 的项目导航。相比普通列表，树需要父子关系、节点展开/焦点、多选拖拽、跨组移动和稳定业务 ID；相比手写虚拟化，react-arborist 已提供这些复杂交互的底层机制。

## 安装和源码
```bash
pnpm add react-arborist@3.16.0
```
真实示例代码 `examples/example.tsx`，Lab 入口 `examples/demo.tsx`。该库的 `Tree` 依赖真实浏览器 DOM 尺寸、React DnD 和滚动容器。Node SDK 测试只验证公开的 `adjustMoveIndex`，不能代替浏览器拖拽测试。

## 三层使用
**入门**：使用 Tree 的默认节点渲染，展开分组，键盘方向键导航与选中。组件有固定的 height/rowHeight，避免列表测量在隐藏容器中得出零尺寸。
**业务**：使用受控 `data`，将 `onMove` 显式应用到业务树数组，`onRename` 与 `onDelete` 分别维护节点。对拖拽目标采用稳定 ID，而不是可变数组下标。
**进阶**：同树包含约1800条技术来源，配置 overscanCount/searchTerm/searchMatch；IME 中文候选阶段不提交查询，选中结果仍用节点 ID 识别。此数量只用于观察虚拟化，**不作为性能吞吐测量**。

## 关键语义：onMove index
`onMove` 的 index 是**删除被拖拽节点之前**的插入槽位。先移除节点，再按原 index 插入，会把同级移动偏移一个位置。官方从 v3.15 提供 `adjustMoveIndex({index,dragIds,siblingIds})`，必须传入目标父节点原来的兄弟 ID 列表。跨父节点目标顺序不能拿源父节点排序替代。

本例的 `moveTree` 先获取目标原有兄弟顺序，再删除所选节点和递归插入，并阻止把父节点插入自身子树。树操作函数可独立迁入业务状态层；宿主只负责回调，不把树数据再保存在隐藏 DOM 上。

## 三组容易出错的实践
1. **index偏移**：同级拖动 b 到 c 后面反而越过 d。使用官方 adjustMoveIndex，测试移动到自身前后及跨父节点。
2. **数组 index 当 ID**：过滤、重排后 React 错将另一节点状态复用。稳定字符串 id，接入后端返回的持久主键。
3. **在受控 data 模式忘写 onMove/onRename**：UI 看起来可拖，但业务数据不变或下次刷新还原。所有操作用不可变更新回写统一 store。

## 搜索、输入法和无障碍
搜索的空结果必须有文字提示；自定义 `searchMatch` 限定 name，避免默认 JSON.stringify 匹配隐藏字段。IME compositionend 之后再提交过滤，不能把空格键或候选键强制解释成树键盘快捷键。不要覆盖 Arborist 自身 ARIA/role 和焦点属性；大屏和窄屏高度/宽度需要实际测试。

## 与其他方案对比
C10 TanStack Virtual 只有低层布局能力，B13 dnd-kit 只有拖放，C09 Virtuoso 擅长长列表。需要真正树关系/拖放时优先评估 Arborist，应用有非常特殊的跨域 DnD 时再考虑组合基础库。

## 许可和当前验证
MIT 许可；需验证 react-dnd 等间接依赖、React19 peer 和生产 worker/SSR 打包。Node 测试仅验证公开 helper，当前 SDK 未真正执行，browser 和 build 仍 NOT_RUN。

官方：https://github.com/jameskerr/react-arborist 。
