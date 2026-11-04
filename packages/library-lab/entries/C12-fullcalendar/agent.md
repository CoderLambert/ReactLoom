# C12 FullCalendar v7 — Agent 实施指南

## 选型和版本
事件日历/排程使用 v7.1.3，依赖 temporal-polyfill。不能按 v6 手册装 @fullcalendar/core + @fullcalendar/daygrid；v7 从 @fullcalendar/react/daygrid 等子路径导入。免费标准功能与付费 Scheduler Premium 严格隔离。

## 核心可迁移代码
examples/example.tsx 的 PLUGINS/CSS/事件 id、React 状态、calendarRef、拖拽回滚和 DST 两 instant 示范；examples/demo.tsx 是宿主重导出。生产替换内存事件为范围 API，添加 AbortSignal/epoch，服务端验证 revision。

## 不允许省略
CSS skeleton、theme、palette；稳定插件引用；UTC instant 与 IANA zone；全天事件结束排他性；失败时 info.revert；语义列表和键盘替代编辑。

## 测试门槛
官方模块真实导入、Node 日历日与两个 instant、浏览器月/周切换、日期移动成功与冲突回滚、StrictMode清理、键盘/读屏。仅 Node import 不证明 React 浏览器渲染。

## 证据
https://fullcalendar.io/docs/react，verification.json 无 PASS 之前标为待运行。

## 事件输入契约
迁移 `examples/calendar-policy.mjs` 及对应类型声明；创建全天事件通过 `isCivilDate` 校验；非全天编辑必须验证 `getUtcInstant` 返回非 null（含显式偏移）再更新业务源，否则调用 FullCalendar 的 `info.revert()`。本地 ID 使用 `allocateEventId` 避免 Date.now() 碰撞。若目标 FullCalendar named-zone 插件输出无偏移字段，先补正确时区处理/官方支持的 zone 实现，不能去掉守卫来伪造通过。
