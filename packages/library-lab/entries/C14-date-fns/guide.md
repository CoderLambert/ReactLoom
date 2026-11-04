# date-fns 4.4.0｜日历日、instant 和经过的小时不要混

Lab 锁定 `date-fns@4.4.0` 和 `@date-fns/tz@1.5.0`（MIT）。函数不改入参。时区用 `TZDate` 和 `tz()`，不要读设备默认时区来决定 RSS 排程。

没有收据时 sdk / build / browser 保持 NOT_RUN。Actions 41779873259 不是本条目 PASS。

## Lab 当前示例

[`examples/example.tsx`](examples/example.tsx) 调用真实的 `parseISO`、`isValid`、`format`、`addDays`、`differenceInCalendarDays`、`differenceInHours`，以及 `TZDate`。`demo.tsx` 只做再导出。没有 cron，也没有 5173 的独立站。

- **basic**：`parseCivilDate` 只接受 `YYYY-MM-DD`。它在指定 IANA 时区的中午构造 `TZDate`，再回读年月日。对不上就拒绝，所以 `2026-02-30` 不会进位。按钮输出当天和下一日的格式化结果。
- **business**：`planCivilDays` 用 `addDays(start, count, { in: tz(zone) })`。返回里同时有日历日差和 `differenceInHours`。说明文字写明这不是浏览器里的生产 cron。
- **advanced**：固定计算纽约 `2026-03-07` 加一天，以及 `2026-10-31` 加一天。绝对时间先过 [`instant-policy.mjs`](examples/instant-policy.mjs) 的 `assertExplicitInstant`，再 `parseISO`。两条 `2026-11-01T01:30:00-04:00` 和 `-05:00` 会变成两个 UTC instant。删掉偏移必须抛错。

`assertExplicitInstant` 要求日期时间、秒，以及 `Z` 或 `±HH:mm`。拒绝 `-00:00`、超出 `±14:00` 的偏移、非法月日和超过 35 个字符的串。闰年按公历，不靠 `Date` 的自动进位。

## 什么时候用

日历加减、格式化和明确时区的日界。已经有 Day.js 链式插件且行为核对过时不必改写。需要 `Interval` 和 `getPossibleOffsets` 时用 Luxon。历史 Moment 代码不要原样换成 `new Date()`，看 C22。

`addDays` 是日历日。它不是 86400000 毫秒。纽约春季那一天附近，相邻日历日可以是 23 小时；秋季可以是 25 小时。

## 数据与模型

四种值：

| 值 | 例子 | 不能拿来做的事 |
| --- | --- | --- |
| 日历日 | `2026-03-07` | 不能当成某一瞬间 |
| 带偏移的 instant | `2026-11-01T01:30:00-04:00` | 不能当成纽约永远的偏移 |
| IANA 时区 | `America/New_York` | 不能用 `+08:00` 代替 |
| 经过的小时 | `differenceInHours` | 不能用来回答「是不是明天」 |

`parseCivilDate` 把中午放在目标时区，避免本地午夜正好落在 DST 缺口里。回读失败就抛错。`format(..., { in: tz(zone) })` 让格式化也发生在该时区，而不是操作系统时区。

`parseISO` 很宽。Lab 不把没有偏移的字符串交给它。先 `assertExplicitInstant`。

`startOfWeek`、`addBusinessDays`、`formatDistance` 没有出现在示例里。要用时显式传入 weekStartsOn 和 locale，不要假设周一或中文相对时间已经就绪。

## 三层示例

### 基本

输入 `2026-02-30` 再运行，`role="alert"` 出现禁止进位。`2026-03-07` 在纽约中午格式化成功。换上海或 UTC，日历日字符串仍是 3 月 7 日，偏移不同。

### 业务

天数限制在 1–14 的安全整数。输出里的 `calendarDays` 应等于选择的天数。`elapsedHours` 在普通日期上多为 24 的倍数。把这个结果说成「固定每 24 小时触发」是错的，跨 DST 时小时数会变。页面上的 note 就是这个边界。

### 进阶

春季样例和秋季样例并排。秋季相邻日历日的小时数不应被写成 24 而不看结果。两条 01:30 的 `toISOString()` 相差一小时。删掉 `-04:00` 后按钮必须失败，不能默默用浏览器时区补上。

## 反例

### 1. 明天等于加 86400000

```ts
new Date(start.getTime() + 86400000)
```

DST 日会偏一小时。用 `addDays(date, 1, { in: tz(zone) })`。

### 2. 用日历日差表示经过的小时

`differenceInCalendarDays` 回答日期格子。重试 24 小时用 `differenceInHours` 或毫秒。Lab 两个都返回，调用方要选对字段。

### 3. parseISO 接受没有偏移的时间

```ts
parseISO('2026-11-01T01:30:00')
```

这不是纽约的某一个 01:30。先走 `assertExplicitInstant`。

### 4. 非法日期靠 Date 进位

`2026-02-30` 在某些解析器里变成 3 月 2 日。回读年月日，不一致就抛错。

### 5. format 不带 in

不带 `tz(zone)` 时，格式化跟随运行环境。服务端在 UTC、浏览器在上海，同一 instant 会显示成不同的钟面。排程显示要传入 zone。

### 6. 把 -04:00 存成纽约的长期规则

那只是该瞬间的偏移。明年的 DST 规则以 IANA 名为准，并保存 instant。

### 7. -00:00 当成 UTC

策略函数拒绝它，因为它表示偏移未知。

### 8. 在渲染期间读本地时区决定业务日

示例的 zone 来自下拉框，默认纽约。不要 `new Date().getTimezoneOffset()` 来决定用户的发布日。

## 组合

**FullCalendar。** 日历负责条，date-fns 负责「加一个日历日」和 instant 检查。全天事件不要先变成 UTC 午夜再加 24 小时。

**Day.js / Luxon。** 同一产品里选一个时区库做权威运算。Lab 把它们分成条目，是为了对照，不是建议三套一起算同一天。

**Zod。** `z.iso.datetime` 只看格式。2 月 30 日和缺偏移仍要日期库。不要在 schema 通过后直接 `new Date(value)`。

## 生产清单

- 日历日用 `TZDate` 中午加回读。
- instant 必须带明确偏移，拒绝 `-00:00`。
- `addDays` 传入 `{ in: tz(zone) }`。
- 同时展示日历差和小时差时，UI 写清各自的含义。
- 天数有上限。Lab 是 14。
- 格式化指定 zone。
- 不在浏览器里注册真正的定时任务。

## 升级

4.4 的选项对象里用 `in`。从 3.x 迁过来时，每个 `addDays` / `format` 都要看时区参数是否还在。`@date-fns/tz@1.5.0` 和 date-fns 4.4.0 一起升，不要只升其中一个。

## 练习

1. `2026-02-30` 失败，`2024-02-29` 成功。
2. 纽约 `2026-03-07` 加 1 个日历日，看 `elapsedHours` 是不是 24。再看 `2026-10-31`。
3. 去掉 instant 的偏移，确认抛错。
4. 两条 01:30 的 ISO 字符串不相同。

## 官方链接

- https://date-fns.org/docs/Getting-Started
- https://github.com/date-fns/date-fns
- https://github.com/date-fns/tz

## 证据

`instant-policy` 单测不调用 `TZDate`。sdk 要同时覆盖 `date-fns@4.4.0` 和 `@date-fns/tz@1.5.0` 的真实 import，并在 `docs/library-lab/evidence/runs/` 留下收据。

GitHub Actions 41779873259 是仓库级安装、typecheck、build、52 个 SDK 文件（153 项测试）和 45 项 Playwright 的结果，不是 C14 的条目 PASS。不要改 `verification.json`。
