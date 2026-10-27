# B17 Floating UI — 定位、浮层交互与焦点所有权

## 什么时候使用

当产品需要严格控制 Tooltip、Popover、菜单、选择器或浮动工具栏的定位逻辑、可访问性和动画时，Floating UI 提供定位中间件与 React 交互 hooks。它不是现成主题化组件。若只想立即使用成熟 UI，优先比较 Radix/Base UI；不要重复手写它们已经解决的焦点交互。

## 安装与入口

```bash
pnpm add @floating-ui/react@0.27.20
```

```tsx
const {refs, floatingStyles, context} = useFloating({
  open, onOpenChange: setOpen,
  middleware: [offset(10), flip({padding: 12}), shift({padding: 12})],
  whileElementsMounted: autoUpdate,
});
const {getReferenceProps, getFloatingProps} =
  useInteractions([useClick(context), useDismiss(context), useRole(context, {role: 'dialog'})]);
```

完整源码 `examples/example.tsx`；宿主 `examples/demo.tsx` 只负责重导出。

## 三层 Demo

基础：锚点旁弹出提示详情，Esc 和点击外部可以关闭。业务：NewsHub 阅读卡片旁出现“稍后阅读/标记已读”动作并返回明确状态。高级：滚动容器、靠近视口边缘时依赖 flip/shift 避免遮挡；输入框组合输入（IME）期间按 Enter 不能误提交。

所有操作都来自真实 `@floating-ui/react` 的 hooks，而不是自写定位计算。

## 布局与生命周期

`refs.setReference` 绑定实际参考节点；`refs.setFloating` 绑定弹层，`floatingStyles` 包含计算后的定位。条件挂载配合 `whileElementsMounted: autoUpdate`，库会管理监听的启动和清理。不要在每次 render 手工注册 DOM listener，也不要在 display:none 常驻模式下照搬条件挂载示例。

`FloatingPortal` 让弹层逃离 overflow 祖先；`FloatingFocusManager` 管理必要的键盘/焦点回归。本例采用非模态 `modal={false}`，所以**不能**假装它阻止页面其他区域交互。

## 高风险反例

1. **视觉定位就当交互完成**：只使用 `useFloating` 而忽略触发、关闭和键盘。需 `useInteractions` 正确组合 `useClick/useDismiss/useRole`。
2. **始终显示浮层并配置 autoUpdate**：条件不满足官方的 `whileElementsMounted` 建议，可能产生额外监听。该示例仅在 open 时挂载。
3. **用不受控 document click 自行检测 outside press**：Portal + iframe + 嵌套场景易冲突；优先 `useDismiss` 并测试真实业务。
4. **自造焦点陷阱**：错误的 Tab/Shift+Tab 会丢失焦点，先使用官方 FocusManager；模态/非模态需求必须明确。
5. **IME composition 阶段按 Enter 提交**：拼音选字会触发表单误提交；检测 composition state 和 nativeEvent.isComposing。
6. **把参考节点藏在 disabled 按钮**：disabled 元素不产生相关输入事件；要改变组件结构或语义，不靠给 disabled 按钮挂事件。

## 生产建议

按业务选择角色：悬停提示 `tooltip` 与可交互 Popover `dialog` 不同；后者包含按钮/输入时需要焦点策略。使用具名按钮与 aria-expanded/aria-controls；浮层在独立滚动区域应验证 flip/shift。支持触摸与键盘，不用颜色承担全部状态。必要的 hover delay/reduced motion 通过正确官方 hook 或 CSS 策略实现，不让浮层永久驻留在 DOM。

## 验证

- 真实 `@floating-ui/react` 包成功安装和类型通过。
- Click 打开、Escape/外部关闭、焦点返回、Portal 正确位置。
- 滚动/窗口变化后视图更新；React StrictMode 反复卸载不出现幽灵浮层。
- 中文组合输入时 Enter 不提交，组合结束后 Enter 正常触发。
- 测试时按官方说明排空微任务再断言定位。

当前提交的是真实 SDK 调用源码，尚未执行 SDK/完整类型/浏览器；verification.json 维持 NOT_RUN。

## 参考

- [React 官方指南](https://floating-ui.com/docs/react)
- [FloatingFocusManager](https://floating-ui.com/docs/FloatingFocusManager)
- [GitHub / MIT](https://github.com/floating-ui/floating-ui)


## IME 合成完成后的 Enter 竞态（AB wave8 加固）

React 状态更新可能批量化；`compositionend` 若紧邻同一次 Enter 的 `keydown`，只检查 `isComposing` 或旧 state 仍可能误提交。此示例用同步 ref 追踪 composition、合成完成后的下一次 Enter、原生 `isComposing` 与兼容性 keyCode 229；仅由真正的普通 Enter 触发 `choose`。合成期不 `preventDefault`，避免阻断输入法候选确认；在 Enter keyup 或失焦后清除防误提交标志。判断纯函数见 `examples/ime-guard.ts`，Node 定向测试不替代 Chromium/Windows/Linux 中文输入法真实验证。

### wave17：真正写入剪贴板

业务浮层“复制示例引用”调用浏览器原生`navigator.clipboard.writeText`，**只有Promise成功**才关闭弹层并显示“已复制”；权限拒绝或非安全上下文在当前浮层保留`role=alert`错误，不能用按钮点击冒充复制成功。该文本明确为本地教学引用。必须在HTTPS或localhost下用真实Chromium验证，Floating UI的Portal/焦点/IME回归也不能从源码推断成功。

剪贴板写入完成也检查异步请求代次；用户同时选择其他动作、关闭浮层或卸载后，迟到的复制 Promise 不再覆盖结果或关闭下次打开的浮层。
