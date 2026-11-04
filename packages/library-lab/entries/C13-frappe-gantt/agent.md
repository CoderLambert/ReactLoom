# C13 Frappe Gantt — Agent 工程准则

## 定位
交付任务依赖和进度图可用 Frappe Gantt v1.2.2；若业务是事件日历则比较 C12 FullCalendar。图形编辑应存在键盘/语义表格替代。

## 最小迁移文件
examples/example.tsx、examples/gantt.css、examples/plan-policy.mjs 与对应 .d.mts。规范源码保留浅复制任务、只读 SVG 和键盘表格，供隔离环境复用；将领域校验/并发保存放在独立 service，不把模拟状态逻辑直接复制到生产 API。

## 当前运行限制

三层 manifest 使用 `browser-frame`，共享页面保持拒绝执行。已检查的 `frappe-gantt@1.2.2` 发布包无条件注册捕获实例的 `document mouseup` 监听，没有公开 `destroy` / `dispose`；`replaceChildren` 不能释放它。不得只改回 `react` 或把 DOM 删除当作卸载通过。恢复可执行预览需专用隔离运行器和真实浏览器反复挂载/切换/卸载验收；当前源码中的键盘表格和领域校验保持可读。

## 禁止
不要直接操作原 React 任务对象；不要接受任意 popup HTML；不要丢失稳定 ID；不要因过滤破坏依赖拓扑；不要假设 package exports 暴露 dist/frappe-gantt.css；不要仅看图表动画就认为卸载彻底。

## 验收
图表真实挂载、视图切换、相同任务的键盘编辑、无效日期拒绝/409回滚、StrictMode双挂载/卸载资源观察。Node SDK import 只能证明入口加载，不代表SVG生命周期已验证；源码与证据在 verification.json。

## 资料
https://github.com/frappe/gantt

## 不可删的拓扑门禁
迁移时同时复制 `examples/plan-policy.mjs` 和 `.d.mts`，保存前必须运行 `validatePlan(candidate)`。不可用“只有自依赖检查”代替多节点有向环检测，不可用 `progress < 0 || progress > 100` 代替 `Number.isFinite`。测试 `node --test .../tests/plan-policy.test.mjs` 属于纯领域策略，不代表图表 SDK/DOM 已通过。
