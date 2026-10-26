# B13 dnd-kit — Agent 迁移说明

**任务**：实现可访问、可控制顺序的业务列表。基础版本 @dnd-kit/core 6.3.1 + sortable 10.0.0（MIT，旧架构）；新 @dnd-kit/react 0.x API 不可直接混用，先核验目标项目选择版本。
**可迁移文件**：examples/example.tsx（真实运行代码），examples/demo.tsx 为宿主适配层。完整判断见 library.json / verification.json。
**数据合同**：items 的业务 id 必须稳定唯一，onDragEnd 检查 active/over 都存在且合法，arrayMove 用 id 查到的当前 index；排序持久化与回滚由上层负责。
**交互合同**：PointerSensor 限制误触，KeyboardSensor + sortableKeyboardCoordinates，独立拖动手柄与 touchAction:none，附带上下移动键盘按钮，业务禁用必须校验到数据层。
**重点反例**：在 handleDragOver 中直接提交排序导致抖动；将 array index 用作 id；全行注册监听导致输入框失焦；把 CSS disabled 当权限；卸载后沿用 stale drag context；缺键盘/屏幕阅读器反馈。
**目标验收**：实际 SDK import、typecheck/build、Chromium Space/Arrow/Escape、touch模拟、拖动后业务顺序、锁定、撤销，焦点保留。未执行则维持 NOT_RUN，不把 UI 代码存在当成 SDK PASS。
**参考**：https://dndkit.com/legacy/presets/sortable/overview/；其他方案 B14 Pragmatic drag and drop，迁移 B22 旧 Beautiful DnD。
