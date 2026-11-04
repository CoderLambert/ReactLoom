# B20 Sonner — Agent 复用建议

场景是短暂、非阻断操作反馈；长表单错误、删除确认、业务日志要在正确的组件内持久存在。使用 `sonner@2.0.8`，MIT。生产一般在稳定的根 Layout 挂一个Toaster，避免多个页面重复容器。

读取 `examples/example.tsx`：这是真实可运行源码；`examples/demo.tsx` 只是Lab适配。移动到项目时按需删掉实验控件，保留实际 toast.success/toast.loading/toast.error/toast.dismiss/撤销逻辑；`Toaster` 固定到应用根，而不是为每个列表项创建。

约束：请求结果在实际业务状态里可读，Toast只是辅助；同一异步任务复用 id；任务清理只dismiss自己持有的 ids；取消后旧 Promise/timeout 不能回写；触发 Toast 应优先在用户事件而不是 StrictMode 易重复的挂载 Effect；重要风险需要Dialog而非Toast；撤销按钮必须真实回滚业务状态。

验收：实际Sonner SDK与React/TS构建；在浏览器中测试toast/撤销、同id更新、Tab切换后清理、Escape/键盘及无障碍公告。不能以mock SDK代替实际渲染。当前 verification.json 未提供任何SDK/浏览器PASS。

官方：https://sonner.emilkowal.ski/ 。


**异步 Toast 的最后任务所有权（wave8）**：迁移 `examples/example.tsx` 必须一并阅读 `examples/latest-run.ts`。`LatestRunGuard.start()` 返回当前运行 token，后续写状态需验证 `isCurrent(token)`；重试先停止旧 timer 与旧 loading toast，取消/组件卸载 `invalidate()` 并清理本例的 toast id。代次校验不取消真实 HTTP；线上要结合 AbortSignal、请求幂等键与服务端任务生命周期，不能只用 `toast.dismiss()` 假装取消业务。


**重复保存保护（wave20）**：旧Toast的撤销动作只能作用于创建它的最近一次保存；执行新保存先失效旧token和关闭旧保存Toast，执行撤销后也消费token。切换Demo level与卸载需同时废止保存和异步任务所有权。运行源码与 `tests/undo-ownership.test.mts` 提供规则证据，不把Node测试写为SDK PASS。
