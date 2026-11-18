# 用原生拖放重排频道，并保留业务约束

频道设置页已有 DOM 和样式，现在要加拖动排序，固定频道还必须保持原位。`@atlaskit/pragmatic-drag-and-drop` 提供浏览器原生拖放的源、目标和事件观察器，业务数组、锁定规则、撤销以及键盘操作由应用拥有。它适合希望保留现有组件树、愿意自己组织交互的工程；若希望直接得到传感器和键盘排序预设，可先比较 dnd-kit。

本例固定核心包 **1.8.1 / Apache-2.0**。核心不依赖 React，本例用 React19.3.0 管理节点和状态。没有外部资源、网络保存或服务端版本。官方当前文档/主分支可能更新，导入与关键模型按安装1.8.1的公开类型和实际源码核对。

## 四个接口怎样形成一个实验

```text
DOM行/手柄 → draggable → source.data {scope,type,id}
                        ↓ 浏览器原生drag事件
DOM目标行 → dropTargetForElements → location.current.dropTargets
                        ↓
列表monitor → 当前scope/会话校验 → 业务锁定规则 → SDK reorder → React数组
```

`draggable` 让整个行成为原生源，`dragHandle` 把允许起拖的位置限制为左侧⠿。上移/下移按钮在手柄之外，不需要展开一组 `provided.*` 属性。

目标用 `canDrop` 过滤其它列表的来源。`monitorForElements` 在列表层观察当前体验，`canMonitor` 也检查 scope/type；`onDrop` 取最内层目标 `dropTargets[0]`。本例只有一层行目标，未来嵌套区域必须重新决定哪层代表排序。

适配器告诉我们源/目标 **ID**；应用用当前可见数组计算索引，先执行 `canReorderAroundPinned`，再调用实际 SDK：

```ts
const next = reorderList({ list: visible, startIndex: source, finishIndex: target });
```

`reorder` 返回新数组，保留行对象身份，不负责锁定权限。固定频道及跨越固定位置的移动被应用拒绝；浅绿目标提示说明 SDK 接收这个目标，最终业务规则仍可能拒绝此次变动。

## 实验一：把拖放接到真实 DOM

基础实验只有 AI、前端、开源三行。抓住 AI 左侧手柄，拖到开源行中部后松手，目标行浅绿，下面顺序变为 `frontend → opensource → ai`。从标题或列表外松手不会作为有效目标排序。

再聚焦“上移 AI / 模型”并按 Enter，数组通过同一条重排路径更新。上下按钮是本例自建的键盘回退，核心没有自动提供“空格提起、箭头拖动”的交互。它也不代表真实读屏或触摸设备已验收。

基础实验重排前三项后拼回隐藏尾部；隐藏的固定频道和深度阅读仍在内存原位，没有用当前显示的三行覆盖整个数据集。

## 实验二：固定位置是业务规则

业务实验显示五行，国际资讯固定在第4位：它不注册拖放源或目标，上下按钮禁用。把 AI 拖到前端可以成功；拖到末尾“深度阅读”会跨过固定行，状态说明拒绝，顺序不变。键盘按钮也使用同一个区间检查，不能从另一条交互路径绕过。

`ItemRow` 在 effect 中注册；`item.id`、锁定状态或 scope 变化时先清理再绑定。数组重排保留稳定 `key={item.id}`，不因位置变化重建节点。浅绿目标、拖动源底色由 SDK 回调更新，不用手写一套 drop 事件冒充库。

## 实验三：两套实例、撤销和过期会话

高级实验挂载“频道排序主列表”和“隔离对照列表”，两者使用同一组件和原始数据，但分别有自己的 `useId` scope、数组和 monitor。

1. 在主列表重排，点击“撤销排序”，恢复上一份数组；再点一次撤销不可用。
2. 将主列表手柄拖到对照列表：两个数组都不应变化。接着在对照列表内部拖动，只有对照列表改变。这是同页真实两个实例，不是复制一份结果文字。
3. 主列表“重置频道”恢复原始顺序，并让当前拖动会话过期。未发生顺序变化时不制造新的撤销点；已有一次撤销快照保留。

原生拖动开始时记录 `{activeId, revision, level}`，松手时同时检查它们。键盘改序、撤销、重置会递增 revision，场景切换会清空会话，因此旧 drop 不能覆盖后来数据。revision 是本地防旧回调机制，不能当成服务端并发协议。

## 为什么清理分成行和列表

每行返回 `combine(draggable(...), dropTargetForElements(...))` 的清理函数；列表 effect 返回 monitor 的 detach 并清空会话。React 负责 effect 何时结束，SDK 清理自己注册的资源；应用不在模块顶层建立 monitor，也不清除其它列表的注册。

事件回调通过 ref 读取最新数组/重排函数，避免把首次渲染的顺序固化到长期 monitor。ref 不是第二个数据仓库：`commit` 同步更新 ref 和 React state，并保存一次撤销快照。移动、撤销和重置共享这条状态边界。

复制 `demo.tsx`、`example.tsx`、`pinned-order.ts` 即可；样式在组件内，数据原创，无 Lab alias。安装固定核心包，保留 `/element/adapter`、`/combine`、`/reorder` 这些1.8.1公开子路径。注册发生在 effect，实际拖放要求浏览器 DOM；服务端输出静态列表不等于拖放已运行。

## 实际取舍与验证入口

原生拖放不等于逐帧手势引擎，不适合用它追求弹簧跟手轨迹。大量数据的虚拟滚动、自动滚动和跨列移动需要另外设计，本例没有这些行为。移动端滚动/拖动冲突也需要设备验收；仅手柄设置 `touch-action: none`，不阻断整个页面滚动。

Node SDK 检查只验证真实 `reorder` 的新数组/行身份和 `combine` 的清理调用，不证明 DOM 绑定。12项业务规则测试只覆盖固定区间与会话。真实浏览器需核对原生事件、手柄限制、锁定、双实例隔离、撤销和卸载；实际命令与结论在 `local-validation.md`，正式收据独立记录。

npm1.8.1发布记录没有gitHead，也未找到对应tag；按其2026-04-22发布时间定位官方公开镜像commit `1287861b7c77439f906dc108c21f6236b34c8f53`，固定packages/core/package.json确为1.8.1。这是匹配版本公开源码，不冒称已证明npm发布构建的精确commit。该提交完整README候选无中文，目标包packages/core/README.md原文216B，保持短原文不拼接项目介绍。

官方原文与固定提交/语言/同步时间/摘要在 `official/` 和 `library.json`，原文未改写，中文讲解单独维护。官网面板按真实响应依据记录允许/禁止/未知，不能从 iframe load 推定成功。

- [官方核心说明](https://atlassian.design/components/pragmatic-drag-and-drop/core-package/)
- [元素适配器](https://atlassian.design/components/pragmatic-drag-and-drop/core-package/adapters/element)
- [隔离体验](https://atlassian.design/components/pragmatic-drag-and-drop/core-package/recipes/isolating-experiences/)
- [官方可访问性说明](https://atlassian.design/components/pragmatic-drag-and-drop/accessibility)
