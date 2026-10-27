# B14 Pragmatic drag and drop — Agent 迁移卡

**典型任务**：原生DOM拖放适配器、drop targets、监视器与严格事件作用域。当前参考依赖：@atlaskit/pragmatic-drag-and-drop@1.8.1。

**适用** 原生DOM和框架无关复杂拖放、看板、跨容器；**不适用** 不愿维护可访问性/排序算法的简单列表（考虑B13）。

**必须保留** draggable/getInitialData、dropTargetForElements/getData、monitorForElements/canMonitor、combine cleanup和React数据数组的stable id。useId scope阻止跨示例误拖。onDrop校验source/target属于同scope、未锁定且存在于当前数据，再提交一次排序；不从DOM顺序直接持久化。

**反例** 在render直接注册dropTarget、监听整个window后不卸载、只提供鼠标拖动、用索引做拖动identity、假设该库自带KeyboardSensor、在onDrag每一帧写服务端。

**验收** 指针拖拽、键盘上下按钮、拖出容器不提交、固定条目不接受、撤销、卸载后monitor不再收到本示例事件；缺SDK运行与浏览器证据只能NOT_RUN。

**可信边界**：`examples/example.tsx` 是真实示例源码，`examples/demo.tsx` 只负责重导出；`library.json` 是元数据，`verification.json` 的 NOT_RUN 不能自动升级为PASS。执行目标仓库的具体类型、构建、SDK、浏览器验证并记录证据后才能复用。

**迁移流程**：先读条目用途和版本→判断业务状态与React/UI元素所有权→提取最小代码→接入目标项目的依赖/许可证/样式→测试触摸、键盘、IME、快速重挂载和异常回滚→记录源码指纹。不要把演示输入或未经验证的安装版本视为生产承诺。

官方：[Atlassian Core](https://atlassian.design/components/pragmatic-drag-and-drop/core-package/) / [Element adapter](https://atlassian.design/components/pragmatic-drag-and-drop/core-package/adapters/element) / [监听隔离](https://atlassian.design/components/pragmatic-drag-and-drop/core-package/recipes/isolating-experiences/)。

## 固定槽位回归合同
固定项不仅自己不能拖，也不能被其他项目跨越后挤走。必须在业务 reorder/onDragEnd/onDrop 的最终提交处检查 `canReorderAroundPinned(items, from, to)`；不可只禁用 handle 或仅检查 source/target。拖拽与键盘上下按钮调用同一业务约束，按钮用它计算 disabled。
提取 `examples/pinned-order.ts` 与单测 `tests/pinned-order.test.mjs`。检查双向跨越、索引边界、非固定段内操作与撤销；真实 SDK/browser 仍须单独验收。旧验证证据应随源码指纹变化降级为 NOT_RUN。

## wave16 原生拖拽冲突防护

只为 `draggable` 指定真实已挂载的 `dragHandle: handleRef.current`（官方Element Adapter参数），确保点击非手柄的按钮或选中文本不触发原生拖动。手柄 `touchAction:none` 仅局部设置，键盘保留上下按钮，保证用户不用拖拽也能排序。卸载要释放draggable/dropTarget/monitor。真实浏览器触屏/ARIA/焦点未验收，不应宣称完整可访问性。
