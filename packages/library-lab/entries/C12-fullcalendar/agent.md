# C12 FullCalendar — 工程手册

## 适用

需要月、周、列表和拖拽提议的排程视图。纯日期计算不必引入它。资源泳道不在 Community MIT 包里。

## 版本

`@fullcalendar/react@7.1.3` 与 `temporal-polyfill@1.0.4`。视图从 `@fullcalendar/react/daygrid`、`timegrid`、`interaction`、`list` 引入。不要安装 v6 独立插件或 `@fullcalendar/luxon3`。

## 迁移

带走 `examples/example.tsx` 和 `examples/calendar-policy.mjs`。用 API client 按可见范围取事件，替换静态数组。拖拽成功前保持 `revert()` 路径。polyfill 留在运行依赖里，即使业务代码不直接 import Temporal。

## 不可删的清理

定时值没有偏移就 revert。全天值必须通过 `isCivilDate`。未知 id 的拖拽 revert。`fold-early` 的冲突演示必须调用 `revert()`。事件数组用 `useMemo`。本地 id 用 `allocateEventId`，不复用已有 `local-N`。

## 反例

```ts
import dayGridPlugin from '@fullcalendar/daygrid'
events={[...serverRecords]}
eventContent: () => ({ html: title })
```

- 只存纽约墙上的 `01:30`。
- 全天结束日当成包含。
- `eventDrop` 忽略 409。
- 用 `eventDidMount` 刷新标题。
- 把 Premium 功能当成已包含。
- 日历、React state 和缓存同时当权威。

## 测试断言

- `2026-02-30` 不是合法公历日。
- `-04:00` 与 `-05:00` 的 01:30 得到不同的 UTC instant。
- 无偏移的日期时间、`-00:00`、超出 ±14:00 的偏移被拒绝。
- id 分配跳过已占用序号，并在安全整数耗尽时抛错。
- 策略单测没有挂载 FullCalendar。

## 真实限制

没有网络取数，没有 revision 字段，没有 Temporal 调用。polyfill 是为库准备的。春季缺口的完整墙上往返不在 `getUtcInstant` 里。中文输入法未单独验收。

## 证据

没有收据不要写 PASS。Actions 41779873259 不是本条目。不要改 `verification.json`。
