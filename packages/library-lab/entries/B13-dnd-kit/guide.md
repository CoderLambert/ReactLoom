# dnd-kit：把拖动预览变成受约束的频道顺序

RSS首页需要让用户调整频道优先级：有的人拖动手柄，有的人用键盘，有的频道又必须固定。dnd-kit负责感知输入、测量元素和计算拖动预览；应用仍拥有频道ID、数组顺序、锁定规则和撤销历史。本例围绕同一组频道，依次理解**拖拽排序 → 受限提交 → 撤销与过期拖动**。

这里使用 `@dnd-kit/core@6.3.1` 和 `@dnd-kit/sortable@10.0.0` 的经典API（官方文档现标Legacy），真实调用DndContext、SortableContext和useSortable。当前其他包的DragDropProvider等接口是另一套API，不应与这份源码混用；本页不推断新包的版本、迁移成本或默认推荐。它适合React内自定义排序，不提供操作系统文件拖入、后端保存或多人冲突合并。

## 先分清ID、数组与屏幕位置

| 对象 | 本例的职责 |
| --- | --- |
| `items` | React拥有的完整频道数组；ID唯一，标题可重复但ID不能重复 |
| `SortableContext.items` | 与当前可见DOM顺序一致的ID列表；basic仅前三项 |
| `useSortable({ id })` | 为同一业务ID注册可拖/可放节点，给出transform、transition及手柄属性 |
| `PointerSensor` / `KeyboardSensor` | 指针超过6px激活；键盘用sortableKeyboardCoordinates定位候选 |
| `closestCenter` | 选最接近拖动矩形中心的放置候选；不表达业务权限 |
| `reorderVisible` | 按稳定ID查位置，拒绝非法/重复身份/跨固定项，再不可变更新数组 |

拖动过程中的transform是视觉预览，**不会每帧重写items**。松手后onDragEnd给出active和over，本例先验证拖动会话和业务规则，成功才写新数组。React再按相同ID重排DOM，下面的可见顺序与完整数组同步变化。把DOM节点手动insertBefore并不能替代这条数据流。

源码：[真实React实现](examples/example.tsx)、[数组和会话规则](examples/pinned-order.ts)。

## 实验一：三个频道，用指针和键盘排序

basic初始显示“技术快讯、AI 新模型、开源趋势”，顺序是`tech → ai → oss`。

1. 按住“拖动 技术快讯”的手柄，移动超过6px并拖到第二项附近后放下。观察列表和可见顺序一起改变；仅点击或很小移动不应立即拖动。
2. 键盘聚焦手柄，Space或Enter抓起，ArrowDown/ArrowUp移动，再Space或Enter放下，Escape取消。使用的是实际KeyboardSensor和sortableKeyboardCoordinates，不是上下按钮伪装键盘拖动。
3. “上移/下移”提供额外的不依赖拖动的操作，仍调用同一个数组规则。到顶/到底的方向按钮禁用。
4. 展开“查看完整数据与提交轮次”，检查隐藏的`news → read → later`后缀仍存在；取消拖动不改变数组或提交轮次。

手柄使用setActivatorNodeRef，listeners和attributes只展开在这个可聚焦按钮上；整行的setNodeRef用于测量。touch-action:none也仅放在手柄，避免整行阻断列表滚动。PointerSensor能接收支持Pointer Events的触控输入，但真实触控滚动/长按仍需设备验证，本例没有单独TouchSensor或触摸延迟策略。

## 实验二：固定频道是数据规则

business显示六项，“国际资讯”(news)固定在第4位。它的手柄被禁用，但这还不足以保证固定：别的项也可能被放到它另一侧。

在锁定项上方，把技术快讯移到AI附近应成功；在下方，把稍后阅读移到深度阅读之前也应成功。尝试将技术快讯直接拖到深度阅读附近，松手后应保留原数组并提示不能变更顺序；news的ID与位置保持。相邻的上移/下移按钮也受同一边界限制。

`canReorderAroundPinned`检查源和目标之间包含端点的整个区间，遇到locked/fixed就拒绝；`reorderVisible`对**完整数组**检查唯一ID，隐藏后缀也不能与可见行重复。否则basic暂时看起来正常，切到完整列表就可能出现重复拖动身份。

这是提交时的业务约束。Sortable的临时transform仍可能显示拖动预览，不应把它描述成屏幕上的物理障碍。最终是否允许更新，以数据规则为准。

## 实验三：撤销与过期drop

advanced保留固定频道，另提供“撤销”和“恢复默认”。先做一次合法排序，再撤销：数组与DOM回到上次提交前，撤销按钮失效；这里只保存一层历史，不是无限undo栈。

每次成功排序、方向按钮操作、撤销或恢复默认都增加dataRevision。拖动开始记录`{ activeId, revision, level }`，结束时三者仍一致才允许提交。若拖动过程中通过其他入口恢复了数组，迟到的旧drop不能把新顺序覆盖。取消和组件卸载也会丢弃本例会话引用。

展开检查区看数据轮次，结合“当前没有拖动/正在拖动”观察状态。恢复默认本身作为一次可撤销的提交；它不会清空完整后缀。真实浏览器还需覆盖拖到一半时的取消、恢复与离开页签，Node的纯会话测试不能证明传感器事件顺序。

## 最小接入与迁移

```sh
pnpm add @dnd-kit/core@6.3.1 @dnd-kit/sortable@10.0.0
```

在React项目复制example.tsx、pinned-order.ts和workshop.css，保持相对路径；demo.tsx只是Lab重导出。容器与行需要可测量的非零尺寸，样式都限定在.b13-workshop。代码不依赖Lab内部组件；频道与历史只保存在当前组件内存。

核心配置与实际文件一致：

```tsx
const sensors = useSensors(
  useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
)
```

把sensors交给DndContext，传closestCenter和起止/取消处理；SortableContext的items必须与渲染顺序一致。行节点接setNodeRef，手柄接setActivatorNodeRef、attributes和listeners；transform/transition直接来自useSortable。本例手写translate3d/scale字符串，没有额外要求@dnd-kit/utilities直接依赖。

更换真实数据时保持永久唯一的业务ID，不用当前数组下标，也不随每次render重新生成ID。需要只显示部分数据时，定义好可见子集如何合并回完整数组；本例只支持前缀，不声称支持任意过滤/跨列。滚动长列表、DragOverlay、虚拟化或多列需要额外设计和对应环境验证。

## 生命周期与服务端边界

DndContext和传感器拥有SDK监听；应用拥有items、previous和拖动会话。传感器结束/取消有内部detach逻辑，PointerSensor还会延迟清除文档click/selection监听，不能在同一同步瞬间要求全局监听归零。本例在level变化/卸载丢弃会话引用，不遍历或清除其他应用监听；离开后不得再提交本例排序，仍须真实浏览器检查。

提交后保存到服务器属于另一层：使用ID顺序/锚点和数据版本，定义失败、409冲突与远程刷新策略。在拖动中替换数据之前先使当前会话失效。本例没有请求、持久化、跨设备同步、万行性能或操作系统文件拖入；transform也不应和另一套动画库同时写到同一节点。

## 官方资料与可核实结果

官方README原文取自core6.3.1 tag解引用的固定提交 `e9215e820798459ae036896fce7fd9a6fe855772`，目标文件是`packages/sortable/README.md`。该提交实际package.json同时声明core6.3.1与sortable10.0.0；sortable自己的release tag另指向较早提交，来源记录已分开。完整README候选中没有官方中文，保留英文原文，不自行翻译冒称官方。

[经典Sortable文档](https://dndkit.com/legacy/presets/sortable/overview/)、[经典KeyboardSensor文档](https://dndkit.com/legacy/api-documentation/sensors/keyboard/)与已安装版本类型/源码共同核对。官网GET本次成功但未从Lab origin实际嵌入，保留unknown和官网直达。

局部SDK检查真实执行DndContext/useSortable等SSR hooks和给定矩形的closestCenter；纯策略检查锁定、隐藏后缀、完整身份和过期会话。SSR没有真实指针、键盘或DOM测量，也不能证明触控体验。实际命令和状态独立记录，正式sdk/build/browser收据仍遵守项目协议。
