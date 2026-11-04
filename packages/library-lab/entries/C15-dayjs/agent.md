# C15 Day.js — 工程手册

## 适用

链式日期、严格格式和显式 IANA 时区。回拨日不要让 timezone 插件猜测。区间查询和偏移候选列表用 Luxon。

## 版本

`dayjs@1.11.23`，MIT。必须 `extend` `utc`、`timezone`、`customParseFormat`。中文展示用 `dayjs/locale/zh-cn` 的实例 `locale()`，不改全局默认语言。

## 迁移

带走 `strictDate`、`civilWindow`、`twoFallbackInstants` 和 `examples/offset-instant.mjs`。解析日历日时第三个参数保持 `true`。绝对事件保持「输入偏移必须等于该 zone 的墙上偏移」。

## 不可删的清理

`extend` 留在模块顶层。不要在渲染中调用全局 `dayjs.locale`。`0000-` 年份继续拒绝。春季缺口必须抛错，不能返回顺延后的时间。

## 反例

```ts
dayjs('2026-02-31', 'YYYY-MM-DD') // 缺少 strict
dayjs.tz('2026-11-01 01:30', 'America/New_York') // 回拨日有两个答案
dayjs.locale('zh-cn') // 改了进程默认值
```

- 用 `add(1, 'day')` 表示 24 小时。
- 用固定 `-05:00` 代表纽约。
- 把本地化 format 字符串写进接口 JSON。
- 只看 `isValid()` 就接受 DST 缺口。

## 测试断言

- 非 `YYYY-MM-DD` 和真实不存在的公历日失败。
- 带偏移的 instant 与 `tz(zone)` 的钟面、偏移不一致时抛错。
- `Z` 与 `+00:00` 按同一偏移比较。
- 两条回拨 instant 的本地格式偏移不同。
- 插件测试不等于浏览器里点过三个按钮。

## 真实限制

没有生产 cron，没有用户手选 earlier/later 的列表 API（那是 Luxon 示例）。时区数据依赖插件与运行环境。advanced 的小时数以运行输出为准。

## 证据

没有收据不要写 PASS。Actions 41779873259 不是本条目。不要改 `verification.json`。
