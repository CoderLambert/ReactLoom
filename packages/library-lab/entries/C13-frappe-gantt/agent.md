# C13 Frappe Gantt — 工程手册

## 适用

少量任务的只读时间线图，外加一张真正可编辑的表。不要把它当成日历、关键路径引擎或可在主 React 树里随便挂卸的组件。

## 版本

`frappe-gantt@1.2.2`，MIT。CSS 不走未声明的 dist 子路径。弹层关闭，条只读。

## 迁移

带走 `examples/example.tsx`、`examples/plan-policy.mjs` 和 runner 对 4321 文档的约束。业务项目若没有专用 iframe，就要自己保证一份 document 只构造一次，并在离开时丢掉整份 document。不要只调用 `replaceChildren`。用 API client 替换模拟 409。过滤继续只作用于表。

## 不可删的清理

构造函数只在挂载 effect 里跑一次。任务变化用 `refresh`，视图变化用 `change_view_mode`。传入副本。`validatePlan` 失败时不 `setState` 也不 `refresh`。卸载标志 `alive` 必须阻止动态 import 返回后的构造。停止会话时销毁 iframe。

## 反例

```tsx
new Gantt(el, tasks) // 每次 tasks 变化都新实例
<GanttCanvas tasks={shown} /> // 过滤子集破坏依赖
```

- `popup` 渲染不可信名称。
- 直接修改 React state 里的任务对象再交给库。
- 空进度变成 0。
- 年份 0000–0099 交给 SDK 的 Date 构造。
- 依赖成环仍保存。
- 把主应用卸载当成 `mouseup` 已释放。

## 测试断言

- 结束早于开始、非有限进度、重复 id、自依赖、未知依赖、环，都返回错误字符串。
- 跨度超过 730 个 UTC 日失败。
- 年份小于 `0100-01-01` 失败。
- 合法的三项种子计划返回 null。
- 策略单测没有打开 4321，也没有构造 Gantt。

## 真实限制

409 是本地分支，不是 HTTP。没有时区时刻，只有日历日。没有公开 destroy。监听器是否在真实 Chromium 里不增长，要看 browser 收据。演示跨度上限不是产品合同。

## 证据

没有收据不要写 PASS。Actions 41779873259 不是本条目。不要改 `verification.json`。
