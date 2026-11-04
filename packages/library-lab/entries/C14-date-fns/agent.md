# C14 date-fns — 工程手册

## 适用

函数式的日历日和带偏移 instant。不要用它注册 cron，也不要混用设备时区。区间和歧义时刻列表更适合 Luxon。

## 版本

`date-fns@4.4.0` 与 `@date-fns/tz@1.5.0`，MIT。时区运算使用 `TZDate` 和 `addDays(..., { in: tz(zone) })`。

## 迁移

带走 `examples/example.tsx` 的 `parseCivilDate`、`planCivilDays`、`parseInstant` 和 `examples/instant-policy.mjs`。任何绝对时间先 `assertExplicitInstant` 再 `parseISO`。格式化带上 `{ in: tz(zone) }`。

## 不可删的清理

日历日构造后回读年月日。天数限制为 1–14 的安全整数。`-00:00` 和非法偏移在策略层拒绝。不要把 `differenceInHours` 的结果写成「日历上的明天」。

## 反例

```ts
new Date(ms + 86400000)
parseISO('2026-11-01T01:30:00')
format(date, 'yyyy-MM-dd') // 未指定 zone
```

- 用 `Date` 进位接受 2 月 30 日。
- 把 `-04:00` 当成纽约的永久规则。
- 用日历差表示 24 小时重试。
- 在渲染时读取操作系统时区作为发布地。

## 测试断言

- 无偏移、`-00:00`、超出 ±14:00、非法月日被拒绝。
- 闰年 2 月 29 日按公历，不靠自动进位。
- 两条纽约 01:30 得到不同的 UTC instant。
- 策略单测没有构造 `TZDate`。

## 真实限制

没有 `startOfWeek`、工作日或相对时间演示。没有服务端对照时钟。春季和秋季的小时数要在运行结果里看，指南不写死未执行的数字当唯一答案。浏览器时区显示未单独验收。

## 证据

没有收据不要写 PASS。Actions 41779873259 不是本条目。不要改 `verification.json`。
