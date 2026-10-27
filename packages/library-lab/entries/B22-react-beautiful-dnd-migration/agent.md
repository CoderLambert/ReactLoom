# B22 react-beautiful-dnd（历史迁移） — Agent 迁移卡

**典型任务**：把废弃react-beautiful-dnd的Droppable/Draggable列表低风险迁移为React19兼容替代库。当前参考依赖：@hello-pangea/dnd@18.0.1。

**定位** 旧react-beautiful-dnd迁移。当前实际运行替代包`@hello-pangea/dnd@18.0.1`（Apache-2.0，支持React19）；**不是**历史SDK本身已在React19运行通过。

**最小改动映射**：依赖名与import从react-beautiful-dnd改为@hello-pangea/dnd，保留DragDropContext/Droppable/Draggable、onDragEnd、provided.innerRef、draggableProps、dragHandleProps、placeholder。别把旧历史源码混进现代主Bundle。

**数据所有权**：React items state为单一源，业务id稳定；onDragEnd只接受目标存在、索引合法且权限可移动的操作，排序持久化应异步处理冲突与回滚。拖动输入之外必须有键盘操作路径，StrictMode与SSR相关行为重新验证。

**反例**：用index作为ID、忘记provided.placeholder、onDragUpdate连发写后端、只换import就承诺React19通过、dragHandle放在整行导致输入冲突、没有定位目标Drop范围。

**测试**：Space→Arrow→Space、Escape取消、触摸拖动、固定项、删除中途、撤销、重新排序后的id不变、并发提交409回滚。SDK和浏览器未实测标NOT_RUN。

**可信边界**：`examples/example.tsx` 是真实示例源码，`examples/demo.tsx` 只负责重导出；`library.json` 是元数据，`verification.json` 的 NOT_RUN 不能自动升级为PASS。执行目标仓库的具体类型、构建、SDK、浏览器验证并记录证据后才能复用。

**迁移流程**：先读条目用途和版本→判断业务状态与React/UI元素所有权→提取最小代码→接入目标项目的依赖/许可证/样式→测试触摸、键盘、IME、快速重挂载和异常回滚→记录源码指纹。不要把演示输入或未经验证的安装版本视为生产承诺。

官方：[Hello Pangea DnD](https://github.com/hello-pangea/dnd) / [v18 React19发布](https://github.com/hello-pangea/dnd/releases/tag/v18.0.0) / [历史react-beautiful-dnd](https://github.com/atlassian/react-beautiful-dnd)。

## 固定槽位回归合同
固定项不仅自己不能拖，也不能被其他项目跨越后挤走。必须在业务 reorder/onDragEnd/onDrop 的最终提交处检查 `canReorderAroundPinned(items, from, to)`；不可只禁用 handle 或仅检查 source/target。拖拽与键盘上下按钮调用同一业务约束，按钮用它计算 disabled。
提取 `examples/pinned-order.ts` 与单测 `tests/pinned-order.test.mjs`。检查双向跨越、索引边界、非固定段内操作与撤销；真实 SDK/browser 仍须单独验收。旧验证证据应随源码指纹变化降级为 NOT_RUN。
