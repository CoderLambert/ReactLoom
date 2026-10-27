# B13 dnd-kit — Agent 迁移说明

**任务**：实现可访问、可控制顺序的业务列表。基础版本 @dnd-kit/core 6.3.1 + sortable 10.0.0（MIT，旧架构）；新 @dnd-kit/react 0.x API 不可直接混用，先核验目标项目选择版本。
**可迁移文件**：examples/example.tsx（真实运行代码），examples/demo.tsx 为宿主适配层。完整判断见 library.json / verification.json。
**数据合同**：items 的业务 id 必须稳定唯一，onDragEnd 检查 active/over 都存在且合法，arrayMove 用 id 查到的当前 index；排序持久化与回滚由上层负责。
**交互合同**：PointerSensor 限制误触，KeyboardSensor + sortableKeyboardCoordinates，独立拖动手柄与 touchAction:none，附带上下移动键盘按钮，业务禁用必须校验到数据层。
**重点反例**：在 handleDragOver 中直接提交排序导致抖动；将 array index 用作 id；全行注册监听导致输入框失焦；把 CSS disabled 当权限；卸载后沿用 stale drag context；缺键盘/屏幕阅读器反馈。
**目标验收**：实际 SDK import、typecheck/build、Chromium Space/Arrow/Escape、touch模拟、拖动后业务顺序、锁定、撤销，焦点保留。未执行则维持 NOT_RUN，不把 UI 代码存在当成 SDK PASS。
**参考**：https://dndkit.com/legacy/presets/sortable/overview/；其他方案 B14 Pragmatic drag and drop，迁移 B22 旧 Beautiful DnD。

## 固定槽位回归合同
固定项不仅自己不能拖，也不能被其他项目跨越后挤走。必须在业务 reorder/onDragEnd/onDrop 的最终提交处检查 `canReorderAroundPinned(items, from, to)`；不可只禁用 handle 或仅检查 source/target。拖拽与键盘上下按钮调用同一业务约束，按钮用它计算 disabled。
提取 `examples/pinned-order.ts` 与单测 `tests/pinned-order.test.mjs`。检查双向跨越、索引边界、非固定段内操作与撤销；真实 SDK/browser 仍须单独验收。旧验证证据应随源码指纹变化降级为 NOT_RUN。

## wave16 快照语义

保留 `itemsRef` 作为拖拽回调的当前数据来源，`reorderVisible` 对当前快照一次生成完整新数组，切换basic模式仍保留未显示的频道尾部。成功变更时从变更前的 `itemsRef.current` 保存一层撤销快照；撤销要同步恢复ref和React state。不要在React updater里做副作用或混用旧闭包数据。纯策略PASS不替代SDK交互验收。
