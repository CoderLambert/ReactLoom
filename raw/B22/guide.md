# 保留列表形状，把历史 RBD 迁到 React19 替代库

已有频道设置页用了DragDropContext、Droppable、Draggable，现在宿主要升React19。直接保留旧依赖不能解决peer和生命周期问题：历史react-beautiful-dnd13.1.1已被npm标记deprecated，官方仓库当前archived=true；其React/DOM peer是^16.8.5 || ^17 || ^18。这里的可运行目标只有 **@hello-pangea/dnd18.0.1**，peer支持React18/19，Lab使用19.3.0。两者运行时均Apache-2.0，不是MIT。

本例不加载原库，也没有原库PASS。它展示保留RBD列表形状的迁移路径，不把fork的API运行结果冒充归档SDK验证。需要自由坐标/网格或跨类型DOM目标时，应比较dnd-kit或Pragmatic并接受更大的改造；这里保留单列列表、手柄和业务顺序。

## 最小模型：库移动画面，应用写顺序

```text
DragDropContext：收集/分发传感器与响应器
  Droppable：真实列表DOM + innerRef + droppableProps + placeholder
    Draggable：稳定id + 当前位置index + 真实行DOM/位移style
      手柄：独立dragHandleProps
onBeforeDragStart → 应用快照 {ids,revision,level}
onDragStart / onDragEnd → 真实SDK回调读数
onDragEnd → reducer再次校验 → 业务顺序
```

这是库自己的鼠标/触摸/键盘传感器，不是HTML5原生DragEvent。不能拿HTML dragTo或伪造DataTransfer当迁移验收。mode为FLUID连续移动或SNAP步进，本例默认传感器分别用鼠标和键盘演示；它不是通用设备检测器。

key与draggableId是稳定item.id，index只是当前可见位置。Droppable/Draggable的innerRef必须落在真实DOM；行保留全部draggableProps与style，手柄单独接dragHandleProps，其他上下按钮不在手柄内。placeholder代码始终保留，实际DOM占位在拖动期间出现，防止拖出行后容器塌高。CSS不覆盖SDK的transform/position。

```tsx
import {DragDropContext, Draggable, Droppable} from '@hello-pangea/dnd';

<DragDropContext onDragEnd={handleEnd}>
  <Droppable droppableId="channels">{provided => (
    <ol ref={provided.innerRef} {...provided.droppableProps}>
      {items.map((item, index) => (
        <Draggable key={item.id} draggableId={item.id} index={index} disableInteractiveElementBlocking>
          {drag => <li ref={drag.innerRef} {...drag.draggableProps}
            style={drag.draggableProps.style}>
            <button type="button" {...drag.dragHandleProps}>{item.label}</button>
          </li>}
        </Draggable>
      ))}
      {provided.placeholder}
    </ol>
  )}</Droppable>
</DragDropContext>
```

这段展示迁移后的绑定骨架；真正的取消、状态写入和业务约束在[实际组件](examples/example.tsx)与[顺序模型](examples/pinned-order.ts)。只换import是开始，不能删掉占位、ref、style或把id改成index。

## 实验一：替代SDK的键盘与鼠标路径

基础层显示AI、前端、RSS三项。聚焦“拖动 AI 模型研究”，Space提起、ArrowDown移动、Space放下；顺序应成为frontend → ai → rss，SDK回调显示SNAP、source.index=0、destination.index=1、reason=DROP。

再从手柄用真实鼠标拖动，观察行的SDK位移、拖动中的placeholder和FLUID回调。只点上下按钮也能改序，但那是应用回退，不会伪造SDK响应。下方JSON的id/mode/source/destination/reason来自实际响应器；phase和snapshotRevision是本例标注，不能当SDK内建属性。

基础层只重排前三项，再拼回隐藏global/notes；data-all-order是实际完整数组。不要拿可见三项覆盖整个数据集。指针与键盘真实传感器仍需浏览器验证，SSR标签或纯规则不证明它们工作。

## 实验二：固定槽位与手柄分工

业务层显示五项，国际时事固定在第四位。它的isDragDisabled让SDK不启动该行，手柄/上下按钮也禁用。AI拖到前端可以成功；拖到深度阅读会跨越固定槽，SDK可以提出该落点，但reducer拒绝写入，顺序保持原样。

所以“画面可拖到那里”不是业务许可。canReorderAroundPinned同时检查源、目标和闭区间内的fixed/locked项，鼠标、SDK键盘和上下按钮最终复用同一写入边界；没有仅靠灰色样式阻止操作。当前只有一列，无服务器持久化、跨列或权限接口。

## 实验三：取消、撤销和旧drop

高级层先拖动一次，再“撤销上次排序”，恢复上一份数组；撤销只保留一步。Escape取消一次真实SDK拖动时，回调reason=CANCEL，顺序和revision均不变；同位放下也不制造新顺序或撤销点。

“恢复原序”是本地事务，会增加revision并使在途快照过期。已是原序时只失效会话，保留已有撤销点，不凭空开启撤销。若确实重置了顺序，可以撤销这次顺序变更。

18.0.1的 **onBeforeDragStart同步调用，而onDragStart延后调度**。因此快照在前者捕获，后者只记录真实响应，不允许晚到的start重新建立已经作废的会话。手工上移、撤销、重置会立刻清空活动快照，场景变化在layout effect清空并以key重挂SDK context。

即使组件在回调处做过判断，reducer还要在真正写入时检查当前state：取消/无落点不写；快照的level、revision、可见id序列、source.index上的draggableId都必须匹配；最后再检查固定区间。这能拒绝“先检查通过，后被其它更新改了数组，再排队写旧index”的动作。本地revision不是HTTP ETag。

真实鼠标拖动中途的重置，浏览器提案用明确标注的程序化UI刷新fixture触发真实恢复按钮；鼠标与SDK回调仍真实，不伪造DropResult。它验证异步业务更新接线，不冒充手指同时点击两个按钮。规则测试单独覆盖最终reducer的旧动作拒绝。

## 迁移、所有权与边界

复制四必要源：[demo.tsx](examples/demo.tsx)、[example.tsx](examples/example.tsx)、[pinned-order.ts](examples/pinned-order.ts)、[styles.css](examples/styles.css)，安装匹配替代包与React/DOM。没有Lab alias、外部资产或新共享依赖。旧的resetServerContext不在18.0.1公开导出中，不能把原库SSR经验直接搬来；真实SSR结构测试也不证明完整hydration。

SDK拥有传感器、内部注册、公告、拖动样式与焦点恢复，React context卸载时由SDK清理。应用只清自己的快照，不手工删全站监听或style。四必要源必须一起迁移，CSS只负责行/控件外观，SDK位移style留给库。用法说明已中文化，默认事件公告及真人读屏没有完整本地化验收；触摸/滚动/真实设备也未覆盖。

祖先transform/缩放或CSS覆盖fixed位移会改变坐标，复杂portal/虚拟列表需要按匹配版本另行设计。服务器保存还需要权威版本、失败恢复与取消边界，本例没有HTTP，不堆一个未实现的看板。

## 官方原文与可复核结果

主快照是实际运行替代库18.0.1：hello-pangea/dnd固定commit `410173402853654f64436d116d68e3f89359d496`的README.md，10875B；完整tree只有英文README候选。历史原库13.1.1另存official/legacy-readme.md，绑定npm gitHead `1a380855d0d008c5d6ef8e34c7c8ffb96c66a881`，只做迁移背景，不展示成当前运行API手册。npm弃用、React peer与当前归档标记分开记录。

官方声明站点https://dnd.hellopangea.com实际GET200，未发现强制跨源frame限制，但没有从Lab origin确认iframe内容，所以unknown，保留直达/重试。完整最终响应头、原始/最终URL、候选、版本、时间和SHA在official/source-evidence.json；服务器匿名会话cookie值脱敏并保留属性/hash，未使用或发送凭据。

真实SDK局部检查只运行替代库的React19 SSR绑定与双context身份；17项policy验证本地规则。真实传感器/位移/占位/取消/焦点/清理需主控按[完整浏览器提案](validation/browser-proposal.txt)运行。六项、实际cwd/命令/exit/日志见[local-validation.md](local-validation.md)；正式三项NOT_RUN，更不能由替代库局部通过推导原库PASS。

- [匹配替代库原文](https://github.com/hello-pangea/dnd/blob/410173402853654f64436d116d68e3f89359d496/README.md)
- [匹配响应器时机说明](https://github.com/hello-pangea/dnd/blob/410173402853654f64436d116d68e3f89359d496/docs/guides/responders.md)
- [原库弃用说明](https://github.com/atlassian/react-beautiful-dnd/issues/2672)

- [历史13.1.1固定原文（未运行）](https://github.com/atlassian/react-beautiful-dnd/blob/1a380855d0d008c5d6ef8e34c7c8ffb96c66a881/README.md)

手柄使用真实 button 时，要给 Draggable 设置 `disableInteractiveElementBlocking`：18.0.1 默认拒绝从交互元素启动，缺此选项会令鼠标与 Space 都不提起。它只解除 SDK 的交互元素过滤，dragHandleProps 仍只放在专用手柄；旁边上下按钮不具有该属性，不成为拖动目标。候选15三条实际传感器失败已保留，补齐后沿用相同验收断言复验。
