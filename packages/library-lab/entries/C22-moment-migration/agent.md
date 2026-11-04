# C22 Moment 迁移 — 工程手册

## 适用

拆掉历史 Moment 调用：可变对象、宽松解析、日历日和 instant 混用、DST 被当成 24 小时。新功能不要新增 `moment` 依赖。

## 版本

运行 pin 是 `date-fns@4.4.0`、`@date-fns/tz@1.5.0`、`dayjs@1.11.23`。Moment 不是 Lab 依赖。格式令牌按目标库重写，不能全局替换。

## 迁移

带走 `examples/example.tsx` 的 `validCalendarDay`、`getMigrationReport` 和 `TZDate` 段落。日历日继续双库严格校验。显示继续 `Intl` 加显式 `timeZone`。需要用户选择回拨偏移时改用 C16，不要在这里猜。

## 不可删的清理

不要把 `moment` 加回 package。不要把日历日存成 UTC 午夜。`addDays` 必须带 `{ in: tz(zone) }`。非法日期保持 `INVALID`，不要进位。可变 `add` / `startOf` 的调用点改为使用返回值。

## 反例

```ts
moment(value).add(1, 'day') // 改了原对象，也不等于加 24h
moment('2026-02-30')
JSON.stringify({ at: moment() })
new Date('2026-11-01T01:30')
```

- 把 `-05:00` 当成纽约。
- 把 Moment 的 `YYYY` 令牌贴进 date-fns。
- `startOf('day')` 不写时区。
- 回拨日只留一个 instant。
- 从请求参数调用全局 locale。
- 只 abort、不看 generation 的保存请求。

## 测试断言

- `2026-02-30` 对 Day.js 严格模式和 `parseISO` 都无效。
- 合法日历日的下一天是日历次日。
- 两个带不同偏移的 01:30 得到不同 ISO，相差 1 小时。
- 报告把日历字段和 instant 字段分开。
- 测试若没有 import moment，不能写成 Moment SDK PASS。

## 真实限制

示例不执行 Moment。春季小时数以 `TZDate` 运行结果为准。没有发布计划的 HTTP 409。缺口时间的拒绝在 C15 和 C16 的函数里，不在本文件的按钮上。

## 证据

没有收据不要写 PASS。Actions 41779873259 不是本条目。不要改 `verification.json`。
