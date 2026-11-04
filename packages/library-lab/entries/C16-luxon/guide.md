# Luxon 3.7.2｜墙上时间要回读，回拨日要选定偏移

Lab 锁定 `luxon@3.7.2`（MIT）。`DateTime` 不可变。时区运算交给宿主的 Intl，而不是一份随 npm 包发货的完整 TZDB。同一版本在不同系统上仍可能因 ICU 数据不同而有差别。

没有收据时 sdk / build / browser 保持 NOT_RUN。Actions 41779873259 不是本条目 PASS。

## Lab 当前示例

[`examples/example.tsx`](examples/example.tsx) 使用真实的 `DateTime` 和 `Interval`。歧义消解在 [`wall-time.mjs`](examples/wall-time.mjs)，语法在 [`wall-time-policy.mjs`](examples/wall-time-policy.mjs)。`demo.tsx` 只做再导出。没有内存里的排程 HTTP，也没有 5173。

- **basic**：`parseCalendarDay` 把 `YYYY-MM-DD` 配上 `T12:00:00`，`zone` 来自下拉框，`setZone: true`，`locale: 'zh-CN'`。`toISODate()` 必须等于输入，否则抛 `invalidExplanation`。按钮展示 `DateTime.DATE_FULL`。
- **business**：`dailyWindow` 用 `plus({ days: 1 })` 得到次日中午，再用 `Interval.fromDateTimes` 取 `length('hours')`，并用 `diff(..., 'days')` 取日历天数。注释写明日历加一天不等于加 86400000 毫秒。
- **advanced**：固定打印纽约春季 `2026-03-07` 和秋季 `2026-10-31` 的窗口。`ambiguousFallback` 对无偏移的 `2026-11-01T01:30:00` 调用 `getPossibleOffsets()`。`resolveWallTime` 要求调用方在有多个候选时传入 `-04:00` 或 `-05:00`。不选就抛错。按钮可以把墙上时间改成 `2026-03-08T02:30`，这段在纽约春季不存在。

`assertWallTimeSyntax` 只接受 `YYYY-MM-DDTHH:mm`。它拒绝带秒、带偏移和宽松的 `Date.parse` 输入，并按公历检查月日。这是语法，不是 DST 判断。DST 在 Luxon 回读里做。

## 什么时候用

要表达区间、要列出回拨日的多个偏移、并且希望 API 把 zone 放在每次调用里。轻量加减用 date-fns。已有 Day.js 插件且核对过 DST 时不必替换。Luxon 不负责把任务写进队列，也不负责鉴权。

不要用 `Settings.defaultZone = 'UTC'` 当业务规则。测试若改了 `Settings.now` 或默认 zone，结束时改回去。示例每次都把 zone 传进 `fromISO`。

## 数据与模型

四个概念：

| 概念 | Lab 的做法 |
| --- | --- |
| 日历日 | 该 zone 的中午，再 `toISODate()` 回读 |
| 墙上时间 | `YYYY-MM-DDTHH:mm` 加 IANA zone |
| 偏移 | `toFormat('ZZ')`，回拨日由用户选择 |
| 区间 | `Interval`，`length('hours')` 是经过的小时 |

`plus({ days: 1 })` 是日历。`plus({ hours: 24 })` 是经过的时间。DST 当天两者不同。示例的窗口用前者。

`fromISO` 返回的对象可能 `isValid === false`，不会抛错。每次都看 `isValid` 和 `invalidExplanation`。只看 isValid 仍不够：春季缺口可能被规范化成另一个钟面。`resolveWallTime` 用 `toFormat("yyyy-MM-dd'T'HH:mm")` 和输入比较，不一致就说明这段本地时间不存在。

回拨日 `getPossibleOffsets()` 给出两个 `DateTime`。没有 `selectedOffset` 时抛错，不默认取第一个。有偏移时在候选里找 `ZZ` 相等的那一个。找不到就抛错。返回值包含 wall、zone、offset 和 `toUTC().toISO()`。

`setZone(zone)` 保持瞬间、改变钟面。`keepLocalTime: true` 会改掉瞬间。展示「纽约此刻在上海是几点」用普通 `setZone`。示例没有用 keepLocalTime。

`Interval` 是半开的 `[start, end)`。`contains` 不包含终点。和 SQL 的日界对齐时使用同一约定。

`toLocaleString` 和 `toFormat` 不能做排序键。存 `toUTC().toISO()` 或毫秒。中文 locale 只影响 basic 的展示。

纽约 2026 年要记住的两天：

| 墙上时间 | 事实 |
| --- | --- |
| 2026-03-08 02:30 | 春季跳时，02:00–02:59 不存在。必须拒绝，不能静默变成 03:30 |
| 2026-11-01 01:30 | 出现两次，UTC 分别是 05:30 和 06:30。必须选定偏移 |

`ambiguousFallback` 把无偏移解析后的候选列出来，供人看。真正保存走 `resolveWallTime`，并且缺偏移就失败。

## 三层示例

### 基本

`2026-02-30` 失败。合法日期出现中文长日期。切换上海和 UTC，`toISODate` 仍等于输入。不要用格式化后的长日期再解析回去。

### 业务

输出里的 `calendarDays` 是 1。`elapsedHours` 在跨 DST 的日子上不是 24。把 `elapsedHours === 24` 写成断言之前，先选定一个不跨 DST 的日子。note 写明没有把「明天」实现成加 86400000。

### 进阶

不选偏移就运行，回拨日应 alert「必须明确选择 UTC 偏移」。选 `-04:00` 和 `-05:00` 各跑一次，`instant` 相差一小时，`offset` 与选择一致。点春季 02:30，应报不存在，而不是返回一个有效 ISO。`ambiguous` 字段列出候选，那是展示；`resolved` 才是选中的结果。

## 反例

### 1. new Date('2026-11-01T01:30') 当成纽约

原生解析依赖系统时区。用 `DateTime.fromISO(wall, { zone, setZone: true })`，再回读。

### 2. 不看 isValid

```ts
const date = DateTime.fromISO(value, { zone })
date.toISO() // 无效时是 null
```

先看 `isValid`。

### 3. 缺口只看 isValid

规范化后的对象可能有效，但钟面已经不是 02:30。比较 format 和输入。

### 4. 回拨日取 getPossibleOffsets()[0]

这是替用户做了不可见的选择。Lab 在候选多于一个且没有 `selectedOffset` 时抛错。

### 5. plus({ hours: 24 }) 表示明天同一钟面

用 `plus({ days: 1 })`。24 小时后重试用小时或毫秒。

### 6. keepLocalTime 用来「换个时区看看」

那会改 epoch。展示用 `setZone(zone)`。

### 7. 用本地化字符串排序

存 UTC ISO。中文格式会随 locale 变。

### 8. Duration.fromObject({ months: 1 }).as('days')

月的天数取决于起点。用两个 `DateTime` 的 `diff`。示例没有这条 API，迁移时不要补上一个固定的 30。

### 9. Interval.contains(end) 期望为真

终点在区间外。日窗口的结束是次日中午，不包含那个瞬间本身要在产品里说清楚。

### 10. 全局 Settings.defaultZone

别的测试和请求会继承。每次调用传入 zone。

### 11. 认为 npm 版本相同则 TZ 规则相同

Luxon 委托 ICU。服务端和浏览器要各验一次春秋样本，并保存 zone 名、墙上时间和选定的 offset。

### 12. input datetime-local 自带 IANA zone

浏览器控件没有 zone。示例用独立的 `<select>`。移动端控件外观未验收。

## 组合

**FullCalendar。** 日历显示条。保存前用 `resolveWallTime`。不要把 FullCalendar 的 `startStr` 无偏移地交给 `fromISO` 就当纽约时间。v7 不再使用 `@fullcalendar/luxon3`。

**i18next。** `locale: 'zh-CN'` 只影响这次 DateTime 的展示。界面语言用 i18next。不要从语言推断时区。

**Day.js / date-fns。** 权威运算只留一套。对照样本用 2026-03-08 02:30 和 2026-11-01 01:30 的两个偏移。

## 生产清单

- 每次构造都带 zone，并检查 `isValid`。
- 墙上时间回读，缺口拒绝。
- 多个 `getPossibleOffsets()` 必须由调用方选定。
- 日历 `plus({ days })` 和经过时间分开。
- 持久化 UTC instant、IANA zone、墙上时间和选中的 offset。
- 不改 `Settings.defaultZone`。
- 区间终点约定写进接口说明。

## 升级

3.7.2 的 `getPossibleOffsets` 是文档化 API。升级后用同一组纽约样例重跑，不要换一套未写下来的消歧算法。若宿主 ICU 更新，把新旧 instant 的差异当成数据问题处理，而不是当成前端状态偶然不一致。

## 练习

1. `2026-02-30` 失败，合法日期的 `toISODate` 等于输入。
2. 不选偏移时，`2026-11-01T01:30` 失败；选两个偏移得到两个 instant。
3. `2026-03-08T02:30` 在纽约失败。
4. `dailyWindow` 的 `calendarDays` 为 1，并指出 `elapsedHours` 在哪个样例上不是 24。

## 官方链接

- https://moment.github.io/luxon/api-docs/index.html
- https://github.com/moment/luxon

## 证据

`wall-time-policy` 只检查字符串形状。`resolveWallTime` 才调用 Luxon。sdk 要真实 import `luxon@3.7.2` 并在 `docs/library-lab/evidence/runs/` 留下收据。browser 看下拉框和 alert。

GitHub Actions 41779873259 是仓库级安装、typecheck、build、52 个 SDK 文件（153 项测试）和 45 项 Playwright 的结果，不是 C16 的条目 PASS。不要改 `verification.json`。
