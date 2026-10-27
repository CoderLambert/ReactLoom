# B17 Floating UI — 面向 Agent 的集成契约

## 选型

只有在项目需要自由组合定位 + 自主定义交互时才选择 `@floating-ui/react`；更通用的菜单/Popover 可以直接用 Radix 或 Base UI。锁定并核对 `@floating-ui/react@0.27.20`（MIT）在目标React环境的peer依赖。

## 最小迁移路径

`examples/example.tsx` 是运行源码，`examples/demo.tsx` 是 Lab 入口。迁移时保留以下共同责任：useFloating(open/onOpenChange)；offset+flip+shift；条件挂载的 autoUpdate；useInteractions(useClick/useDismiss/useRole)；FloatingPortal；FloatingFocusManager；明确 aria-expanded/controls。

## 不得破坏的约束

1. 条件挂载才用 whileElementsMounted:autoUpdate；隐藏不卸载则手工 Effect cleanup。
2. 不将 Portal 定位、FocusManager 和 document listeners 分散到三个无人维护的 hook 中。
3. 非模态浮层与模态对话框语义完全不同；本例不是 Focus Trap。
4. 组合输入的 Enter 要同时检查 nativeEvent.isComposing。
5. 真实点击外部、滚动、Resize、Escape、Tab、中文输入法需要浏览器检验。
6. 与 cmdk/Radix 同用时只允许一个焦点与 Escape 关闭所有者。

## 验收命令

集成负责人安装 dependencyRequests 后运行 `pnpm --filter @reactloom/library-lab typecheck`、`build` 与相关 Playwright E2E。浮层位置断言在 React Testing Library 后必须 flush microtasks。当前验证状态不是PASS，请读取 verification.json；业务状态可以用本地 fixture，但定位与交互必须调用真实SDK。

官方 https://floating-ui.com/docs/react 。


**IME 实际迁移（wave8）**：一起复制 `examples/ime-guard.ts`。`composing` 与 `suppressNextEnter` 采用同步 ref；中文候选字确认所用 Enter 不触发搜索业务动作，且不要在组合输入期间 `preventDefault`。React 可能批量更新 composition 状态，不能单靠 `useState` 布尔值。必须在真实 Chromium+fcitx5/Rime 或目标中文 IME 下确认候选词、回车、Tab/Escape 和失焦；Node纯判断测试不是UI验收。

### wave17 真实剪贴板写入

示例使用 `navigator.clipboard.writeText`，写入成功后才调用 `choose`；失败保留Popover并给屏幕阅读器`role=alert`。不可退回到“点击即显示已复制”的假业务效果。需测试HTTPS安全上下文、拒绝权限、键盘焦点与关闭恢复。

同时保留 `clipboardRequest` 代次防护，覆盖选择其他动作、Escape/外部关闭、卸载后迟到的剪贴板Promise。不能在这些状态下异步改写当前选择。
