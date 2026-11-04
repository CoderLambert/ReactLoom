# C16 Luxon — 工程手册

## 适用

需要 `DateTime`、`Interval` 和 `getPossibleOffsets` 的排程。不要从 UI 语言推断时区，也不要改全局 `Settings.defaultZone`。

## 版本

`luxon@3.7.2`，MIT。zone 每次传入。回拨日由调用方给偏移。宿主 ICU 决定具体 TZ 数据。

## 迁移

带走 `examples/example.tsx`、`examples/wall-time.mjs` 和 `examples/wall-time-policy.mjs`。日历日继续中午构造并回读。墙上时间继续「语法 → isValid → 钟面回读 → 多候选必须选偏移」。

## 不可删的清理

`resolveWallTime` 在候选多于一个且没有 `selectedOffset` 时抛错。春季回读不等于输入时抛错。不要改成静默取 `candidates[0]`。卸载没有订阅要拆，但不要把结果写进模块级缓存。

## 反例

```ts
new Date('2026-11-01T01:30')
DateTime.fromISO(wall, { zone }).toISO() // 未看 isValid
dt.plus({ hours: 24 }) // 被当成明天同一钟面
Settings.defaultZone = 'UTC'
```

- `keepLocalTime: true` 用来换时区展示。
- 本地化字符串当排序键。
- `Interval.contains(end)` 当成包含终点。
- 只用 `isValid` 接受 DST 缺口。

## 测试断言

- 墙上语法只接受 `YYYY-MM-DDTHH:mm`，并拒绝非法月日。
- 多个偏移时缺少选择会失败。
- 选中的 `ZZ` 必须在候选中。
- 回读钟面不一致时失败。
- 语法单测没有证明 `getPossibleOffsets` 已执行。

## 真实限制

没有 HTTP revision，没有移动端日期控件收据。`ambiguousFallback` 仅展示候选。区间小时数以运行结果为准。浏览器和服务器的 ICU 可能不同。

## 证据

没有收据不要写 PASS。Actions 41779873259 不是本条目。不要改 `verification.json`。
