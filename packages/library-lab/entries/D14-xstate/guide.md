# XState 5.33.3：用 Actor 管复杂交互与状态转换

## 应用场景
当业务存在互斥状态、明确事件、守卫、流程复位（如新闻审核、上传审批、付款确认）时，多个 `loading/isError/isSuccess` 布尔值容易产生不可能状态。XState v5 将状态与可接受事件显式建模；简单计数器无需引入完整状态机。

## 安装、入口与源码
```bash
pnpm add xstate@5.33.3
```
```ts
import {setup, createActor, assign} from 'xstate';
```
`examples/example.tsx` 定义受保护的 `reviewMachine` 和 React Actor 生命周期；`examples/demo.tsx` 转发；`tests/sdk.test.mjs` 直接调用真实 XState，无网络。

## 三层实验
**入门：**draft → reviewing → published，draft 直接触发 APPROVE 时无效。**业务：**REJECT 将 reviewing 转到 rejected 并记录驳回原因，RETRY 后再走同一审核链。**进阶：**`hasRetryBudget` 限制两次重试，第三次拒绝后只能 RESET；Actor 销毁后不继续接收业务事件。

## 设计核心
`setup({types,guards,actions}).createMachine(...)` 是机器逻辑；`createActor(machine)` 是单个实例。React **按组件生命周期创建并启动 Actor、订阅快照、卸载时 unsubscribe + stop**。如果流程需要在页面切换后保持，请把 Actor 所有权提升到对应业务服务层，不能无意识依赖组件存活。

`assign` 返回新 context 变化，guard 只决定合法转换。复杂副作用可以通过 invoke/fromPromise 表达，但需要明确超时、取消、request ID 和错误边界；此示例暂不宣称已涵盖可靠异步服务集成。

## 专属反模式
1. **每次 render 创建 Actor：**实例被重置并产生重复订阅。修复：Actor 在 effect 生命周期内创建，或在稳定上层服务中持有。
2. **用 UI disabled 作为唯一守卫：**开发者仍可直接发送事件。修复：状态机内部 guards 检查同一规则。
3. **多个平行布尔变量表示状态：**loading=true 但 published=true 的非法组合。修复：使用互斥 states。
4. **状态变化时忘记旧异步结果：**网络回调仍可能影响新流程。修复：把逻辑绑定到 state invocation/request identity，不把本示例的同步流程冒称能安全取消 HTTP。
5. **使用 v4 配置习惯直接迁 v5：**Interpreter/actions 类型与 Actor 生命周期不同；迁移需完整测试。

## 生产组合
与 C01 RHF 配合审稿提交时，表单负责输入，状态机负责提交/审核阶段；与 D07 TanStack Query 配合时，Query 负责远程缓存，状态机只负责编排，避免两个缓存所有者。与 D10 Zustand 对照：简单客户端状态优先轻量 store，复杂有限状态和可推理转换选 XState。

## 验证与边界
官方 SDK Node test 验证不合法事件不转换、重试预算守卫和停止；浏览器需测试按钮/键盘/组件卸载；真实 Promise invoke 必须另写取消与竞态测试。不用完整 React E2E 结果冒充异步 Provider 验收。状态均以 `verification.json` 为准。

## 来源
- https://stately.ai/docs/machines
- https://stately.ai/docs/actors
- https://www.npmjs.com/package/xstate

MIT。

## 守卫必须约束程序事件
React 按钮的 disabled 无法阻止其他调用者执行 actor.send。现在 XState `reviewing.REJECT` 事件使用来自 `examples/review-policy.mjs` 的 guard：空白、缺失、非字符串及超过 200 Unicode 码点的拒绝原因都不改变状态；保存前 trim 原因。新增纯 Node 策略测试及真实 XState 的 guard 回归源码。纯 Node PASS 不等于 Actor SDK PASS，须安装 `xstate@5.33.3` 运行测试并进行浏览器多轮重试/重置验证。
