# B20 Sonner — 轻量通知与可撤销反馈

## 适用问题

保存成功、后台任务进度、非阻断错误提示、短时间的撤销操作。通知不能取代字段错误、长篇结果或二次确认对话框。任务必须在页面中有可访问的持久状态，不能只依赖会消失的 Toast。

## 安装与 API

```bash
pnpm add sonner@2.0.8
```

```tsx
import {Toaster, toast} from 'sonner';
<Toaster position="bottom-right" richColors closeButton />;
toast.success('保存成功', {description: '你的内容已保存'});
```

生产项目通常在顶层只挂载一个 `<Toaster/>`；本 Lab 的独立示例使用 `id` 与 `toasterId` 标识专属通知目标，防止切换 Tab 后串到其他示例。真实可迁移源码见 `examples/example.tsx`，适配入口 `examples/demo.tsx`。

## 三层实战

基础：点击触发带描述的反馈。业务：添加一条新闻到稍后阅读，并提供动作按钮“撤销”；通知不能只是文字，撤销必须真正更新业务状态。高级：`toast.loading` 产生加载通知，任务成功或失败时使用**同一个 id**更新，不要堆积多个幽灵 Toast；离开页面时清理定时器和当前示例拥有的 Toast。

高级流程使用本地可控定时器以演示状态，Sonner 渲染和更新操作使用实际 SDK；并未模拟真实网络吞吐或收费 API。

## 生命周期与配置

`Toaster` 负责通知容器；`toast()` 是事件调用，返回 id。正式产品一般在事件处理器中调用而非 render 或 Effect 中重复调用；React StrictMode 会重复执行某些开发态 Effect。单例容器应放在稳定的应用布局中，避免路由卸载丢消息。

本独立 Demo 使用局部 Toaster。清理时仅 `toast.dismiss(id)` 处理本 Demo 的通知，不使用无参数的 `toast.dismiss()` 清空全应用消息。

## 反例与修复

1. **Toast 代替表单校验**：通知很快消失且无法与字段关联；错误应保留在字段旁，Toast 只是补充。
2. **用 Toast 请求删除确认**：用户错过消息会误操作；必须改用明确 Dialog 与焦点管理。
3. **将每次加载变化创建新 Toast**：高频消息堆积；用稳定 id 对同一任务更新。
4. **在 Effect 中自动 toast 且没有幂等机制**：StrictMode 和导航反复显示；尽量在确定的用户事件中触发。
5. **组件销毁后异步 callback 继续显示通知**：AbortController/计时器清理/任务所有权必须统一。
6. **调用 toast.dismiss() 作为组件清理**：会误删其他业务通知；应跟踪自己的 ids 并精确清理。
7. **只靠颜色表达错误**：必须同时提供可读文本和实际可访问的业务状态。

## 选型与组合

大型业务系统可以以单例通知服务封装 toast；只为可见且短暂的状态使用。数据请求重试/权限问题应由 Query 或业务状态处理，不把 Sonner 当成异步数据层。若应用需要可交互的浮层组件，使用 B17 Floating UI/成熟 Dialog。

## 真实验证要求

实际包 install/typecheck、三个场景中的真实 toast 渲染、可撤销状态、loading->success/error（同 id）、计时器停止、Tab 卸载后无旧消息回写、键盘和屏幕阅读器反馈。当前 SDK/build/browser 仍 NOT_RUN，不应将源码已实现视为验收通过。

## 来源

- [Sonner 官方](https://sonner.emilkowal.ski/)
- [GitHub / MIT](https://github.com/emilkowalski/sonner)


## 任务重入与迟到通知（AB wave8 加固）

`toast.loading` 使用单次运行对应的 id 更新后续结果，但连续快速点击可能让旧计时器晚于新任务写入“成功”。演示新增 `LatestRunGuard` 作为纯同步代次标记；再次点击先失效旧代次、终止旧本地计时器并仅关闭旧 loading toast，再启动新任务。成功/失败由点击时快照确定。取消和卸载同时使代次失效、清理计时器、关闭自己拥有的 toast，绝不调用无参 `toast.dismiss()`。代次 guard 只阻止旧结果回写，不能替代真实网络 AbortSignal 或服务器事务取消。Node 定向测试仅验证 guard，真实 Sonner/React 焦点和通知行为仍待 SDK/Chromium。

## 重复保存与旧Toast撤销（AB wave20）

多次点击保存会使旧Toast的撤销按钮失去业务所有权。本示例使用独立LatestRunGuard标记每次保存，主动关闭前一条保存Toast；即使旧动作延迟触发，也不能回滚较新保存。切换basic/business/advanced层级时让上一层级的动作token与异步任务token失效并只dismiss本例拥有的Toast。该规则单测不代表Sonner已真实渲染验收。
