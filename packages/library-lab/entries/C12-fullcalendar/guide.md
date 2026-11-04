# FullCalendar 7.1.3｜视图吃事件，时区不靠墙上的 01:30

Lab 锁定 `@fullcalendar/react@7.1.3` 和 `temporal-polyfill@1.0.4`（MIT）。v7 的日视图、时间网格、交互、列表、中文和经典主题都从 `@fullcalendar/react/...` 子路径引入，不要再装 v6 的 `@fullcalendar/daygrid` 这类独立包。`temporal-polyfill` 被 pin 住，是因为 v7 的命名时区依赖 Temporal；挂载示例自己没有调用 Temporal API。没有 Premium，也没有试用 license。

没有收据时 sdk / build / browser 保持 NOT_RUN。Actions 41779873259 不是本条目 PASS。

## Lab 当前示例

[`examples/example.tsx`](examples/example.tsx) 渲染真实 `<FullCalendar>`。`demo.tsx` 只做再导出。没有 `events` 函数，也没有回环上的日历 API。事件数组在 React state 里，并用 `useMemo` 保持引用。

插件：`classicTheme`、`dayGridPlugin`、`timeGridPlugin`、`interactionPlugin`、`listPlugin`。样式是 skeleton、classic theme 和 palette。`locale` 来自 `@fullcalendar/react/locales/zh-cn`。`timeZone="America/New_York"`，`initialDate="2026-11-01"`。

- **basic**：月视图，不可拖。两条种子事件：全天 `2026-11-01` 的发布，以及带 `Z` 的复盘时段。
- **business**：周视图，可拖可缩放。表单用 `<input type="date">` 加标题创建全天事件。id 由 [`calendar-policy.mjs`](examples/calendar-policy.mjs) 的 `allocateEventId` 分配，避开已占用的 `local-N`。
- **advanced**：额外两条纽约回拨日事件，`2026-11-01T01:30:00-04:00` 和 `-05:00`。拖动 `fold-early` 调用 `revert()`，模拟 409。没有明确偏移的定时值也会 `revert()`。

`isCivilDate` 只接受 `YYYY-MM-DD`，并且用 UTC 午夜回读，拒绝 2 月 30 日。`getUtcInstant` 要求时间带 `Z` 或数值偏移，拒绝 `-00:00` 和超出 ±14:00 的偏移。没有偏移的 `2026-11-01T01:30:00` 不能通过。

研究笔记里的 `events(fetchInfo)`、按可见范围 GET、revision PATCH 和 Luxon 插件没有挂载。v7 已去掉旧的 Luxon 连接器。

## 什么时候用

月、周、日和列表要一起出现，拖拽只是「提议改期」的时候用它。简单的日期加减用 date-fns 或 Luxon，不必加载日历。资源泳道和纵向资源调度属于 Premium，本 pin 不包含。

全天日期和时刻是两种值。全天保存 `YYYY-MM-DD`。时刻保存带偏移的 instant，并另存 IANA 时区名。纽约的 `01:30` 在 2026-11-01 出现两次。

## 数据与模型

日历是视图。权威在 React state，生产里应在服务端。不要再用 `eventsSet` 把视图写回同一份 state，容易打成环。

拖拽回调给出改后的 `event` 和 `revert()`。Lab 在写入前检查 id 仍在数组里，全天值能过 `isCivilDate`，定时值能过 `getUtcInstant`。失败就 revert。`fold-early` 无条件 revert，用来演示冲突，并不是日历算出了 409。

全天区间按官方是半开的 `[start, end)`。`2026-10-23` 到 `2026-10-25` 覆盖 23 和 24 日，不是三天。本示例的种子没有跨日全天结束，迁移时不要把结束日当成包含。

`eventDidMount` 不会在数据变化时重跑。标题要跟着数据走，用 `eventContent`，不要在 mount 钩子里改 DOM。不要返回 `{ html: event.title }`。JSX 文本会转义。

一次塞进全年几十万条事件没有意义。生产按可见范围取数。本 Demo 只有几条，所以用静态 `events`。

v7 命名时区不要用浏览器本地 `Date` 去猜纽约的年月日。polyfill 在依赖里，是为了日历内部。业务 instant 仍由 `getUtcInstant` 检查。春季不存在的 `2026-03-08T02:30:00-05:00` 可能被 `Date.parse` 接受成某个时间戳，但它不是纽约当天的 02:30。Lab 的校验还不是完整的 TZDB 往返。那一步在 C14 和 C16。

## 三层示例

### 基本

打开月视图，应看到 2026 年 11 月和中文按钮。工具栏可以切到周和列表。点事件，状态行出现 id。不能拖。

### 业务

填写标题和日期再创建。非法日期或空标题被拒绝，不会进位成下一天。跳到 11 月 1 日。拖动「工程复盘」，状态行说明已经写回 React。生产还要带上 revision，服务器拒绝时 revert 并重新拉取。当前没有这趟请求。

### 进阶

页上的 `<pre>` 列出两个 01:30 的不同 UTC instant：`-04:00` 是 `05:30Z`，`-05:00` 是 `06:30Z`。拖 `fold-early`，条块回到原位，状态是模拟 409。把拖拽结果里的定时值弄成没有偏移的字符串时，同样 revert。下面的 `<ul>` 是键盘可以读到的事件清单，不依赖日历内部的网格。

## 反例

### 1. v6 的包路径

```ts
import dayGridPlugin from '@fullcalendar/daygrid'
```

v7 改为 `@fullcalendar/react/daygrid`，并安装 `temporal-polyfill@1.0.4`。

### 2. 只引入组件不引入 skeleton.css

布局和现在的主题会缺一块。入口同时引入 skeleton、theme 和 palette。

### 3. plugins 为空还指定 dayGridMonth

视图插件和主题插件都要注册。Lab 的 `PLUGINS` 数组就是这份清单。

### 4. 继续装 @fullcalendar/luxon3

v7 移除了该连接。时区运算用 Luxon 或 Temporal 自己的 API，再把结果交给日历。

### 5. 每次渲染新建 events 数组

```tsx
events={[...records]}
```

引用抖动会让日历反复吃同一份数据。用 `useMemo` 或稳定的取数函数。

### 6. 全天结束日当成包含

业务库和日历都用半开区间，不要在查询里偷偷减 1 毫秒。

### 7. 只存「纽约 01:30」

没有偏移就不是唯一时刻。存 UTC instant、IANA zone 和全天标志。`-04:00` 不是纽约的永久偏移。

### 8. eventDrop 不 revert

409 和校验失败都会把条块留在新位置。Lab 对 `fold-early` 和非法值调用 `revert()`。

### 9. 用 eventDidMount 更新标题

数据变了钩子不重跑。用 `eventContent`。

### 10. eventContent 返回 html 字符串

标题被当成 HTML。用 JSX 文本。

### 11. 把收费资源视图当成 MIT

Scheduler 不在本 pin。不要写试用 key 当生产许可。

### 12. 日历、state 和缓存三份都是真值

拖拽写回一份权威数据。缓存保存服务端快照。不要三处各自修改。

## 组合

**RHF + Zod + Query。** 日历负责可见范围和拖拽。表单负责标题。Zod 或 `calendar-policy` 负责日期形状。Query key 包含租户、start、end 和 zone。409 时 revert 并 invalidate。本 Demo 没有这三份库。

**i18next。** 界面文案和日历 `locale` 可以一起切。界面语言不是时区。中文用户仍可能在纽约。不要用固定 `+08:00` 代替 IANA 名称。

## 生产清单

- 插件、locale、三份 CSS 和 `temporal-polyfill` 一起装。
- 全天和时刻分开放，时刻必须带偏移。
- 拖拽失败调用 `revert()`。
- 事件 id 稳定且不复用。Lab 的分配器会跳过已占用序号。
- 卸载时取消尚未返回的范围请求。当前没有请求，但 generation 思想仍适用。
- 提供日历之外的事件列表。Lab 的 `<ul>` 就是这个出口。
- IME：创建标题时不要在每个 `onChange` 里重建日历。本示例的标题 state 不会换日历的 key。

## 升级

从 v6 上来要换子路径、删除旧插件包、补 polyfill、去掉 Luxon 连接器，并重测命名时区和全天结束日。不要只改版本号。

- https://fullcalendar.io/docs/react
- https://fullcalendar.io/docs/upgrading-from-v6
- https://fullcalendar.io/docs/timeZone
- https://fullcalendar.io/docs/eventDrop
- https://fullcalendar.io/docs/event-parsing

## 故障排查

| 现象 | 先看 |
| --- | --- |
| 月视图空白 | `plugins` 是否包含 dayGrid 和主题，CSS 三份是否都引入 |
| 构建找不到 `@fullcalendar/daygrid` | v7 的路径是 `@fullcalendar/react/daygrid` |
| 命名时区异常 | `temporal-polyfill@1.0.4` 是否还在依赖里 |
| 拖完条块停在新日期但数据是旧的 | 没有把 `startStr` 写回 state，或写回前没有 revert 失败路径 |
| 全天跨度多了一天 | 结束日被当成包含。官方区间是半开的 |
| 两条 01:30 显示成同一件事 | 存的时候丢掉了偏移 |
| 标题里的字符被当成标签 | `eventContent` 返回了 `html` 字符串 |

`eventDidMount` 不随标题更新。取数回调若每次渲染都是新函数，可见范围会反复请求。本 Demo 用静态数组和 `useMemo`，没有这条请求。

## 练习

1. 创建 `2026-02-30`，事件数量不变。
2. 比较两条 01:30 的 `getUtcInstant`，它们相差一小时。
3. 拖动 `fold-early`，位置恢复。
4. 去掉定时值的偏移再走 `move` 的校验，确认 revert。

拖拽回调里的 `allDay` 决定走 `isCivilDate` 还是 `getUtcInstant`。全天值若带了时间部分，应视为无效并 revert，而不是截断前 10 个字符。

## 证据

`calendar-policy` 单测不渲染日历。sdk 要真实 import `@fullcalendar/react@7.1.3` 并在 `docs/library-lab/evidence/runs/` 留下收据。拖拽、中文 locale 和时区显示属于 browser。

GitHub Actions 41779873259 是仓库级安装、typecheck、build、52 个 SDK 文件（153 项测试）和 45 项 Playwright 的结果，不是 C12 的条目 PASS。不要改 `verification.json`。
