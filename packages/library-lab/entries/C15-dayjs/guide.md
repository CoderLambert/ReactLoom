# Day.js 1.11.23｜插件要显式打开，回拨日不要让它猜

Lab 锁定 `dayjs@1.11.23`（MIT）。核心包没有时区和严格格式。示例打开 `utc`、`timezone`、`customParseFormat`，并引入 `dayjs/locale/zh-cn`。不读取设备时区来决定服务端任务。

没有收据时 sdk / build / browser 保持 NOT_RUN。Actions 41779873259 不是本条目 PASS。

## Lab 当前示例

[`examples/example.tsx`](examples/example.tsx) 在模块顶层 `dayjs.extend`。`demo.tsx` 只做再导出。没有定时器注册，也没有独立 workshop 端口。

- **basic**：`strictDate` 用正则加 `dayjs(value, 'YYYY-MM-DD', true)`。第三个参数 `true` 才是严格模式。输出用 `locale('zh-cn')` 格式化年月日。非法日期直接抛错，不进位。
- **business**：`civilWindow` 取当天和次日的 `YYYY-MM-DD`，再在目标时区构造中午。`elapsedHours` 是 `end.diff(start, 'hour', true)`，`elapsedMs` 是两个 `valueOf()` 的差。时区下拉框只有纽约、上海和 UTC。
- **advanced**：并排春季 `2026-03-07` 和秋季 `2026-10-31` 的窗口。`twoFallbackInstants` 把 `05:30Z` 和 `06:30Z` 格式化到纽约，用来显示两个不同的 instant 可以落在回拨日的 01:30，但偏移一个是 `-04:00`、一个是 `-05:00`。[`offset-instant.mjs`](examples/offset-instant.mjs) 的 `resolveExplicitZonedInstant` 要求输入自带秒和偏移，再让 `dayjs(input).tz(zone)` 的墙上时间和偏移与输入一致。不一致就抛错，包括春季不存在的 `2026-03-08T02:30:00-05:00`。不要把无偏移的 `01:30` 交给 `dayjs.tz` 让它挑一个。

按钮可以填入 `-05:00` 或那段不存在的 02:30。

## 什么时候用

已经习惯链式调用、愿意自己登记插件的格式化和时区转换。新代码若要函数式和 `TZDate`，用 date-fns。需要 `Interval` 和官方的 `getPossibleOffsets` 列表时用 Luxon。Day.js 默认不可变，这和 Moment 不同；从 Moment 迁来时要删掉依赖对象被改写的代码。

插件是全局的。`extend` 一次即可，不要在渲染函数里反复 extend。SSR 多实例时确认 locale 没有串到别的请求。本 Demo 是浏览器组件。

## 数据与模型

严格解析：`dayjs('2026-02-30', 'YYYY-MM-DD', true).isValid()` 必须为假。缺了 `true`，宽松模式可能接受多余字符或进位。Lab 还要求整串匹配正则，避免带时间的字符串混进来。

时区构造用 `dayjs.tz(text, format, zone)`。先加一天的**日历字符串**，再在该时区取中午，这样「明天」不是加 24 小时。

`diff` 的第三个参数 `true` 保留小数。不要把它和日历日数混在一个字段里。

`resolveExplicitZonedInstant` 把 `Z` 看成 `+00:00` 再和 `format('Z')` 比较。墙上的 `YYYY-MM-DDTHH:mm` 也必须一致。这样春季缺口不会被静默挪到 03:30 还返回成功。以 `0000-` 开头的年份直接拒绝，避开两位数年份的历史别名。

locale 只影响 `format` 的展示。不要用中文「2026年3月7日」当数据库键或排序键。

## 三层示例

### 基本

`2026-02-30` 出现 alert。合法日期出现「2026年3月7日」这种中文格式（月份和日不补零，因为格式是 `YYYY年M月D日`）。切换 level 不会卸载插件。

### 业务

选纽约，看 `elapsedMs`。跨 DST 的窗口不应被写成恒等于 86400000 而不看结果。选 UTC 时，中午到次日中午应是整 24 小时。页面 note 写明没有注册生产定时任务。

### 进阶

先跑默认 `-04:00`。再点「选择回拨后的 -05:00」，instant 应差一小时，墙上时钟都是 01:30。点「春季不存在的 02:30」，必须 alert，不能返回一个被顺延的时间。`fallback` 数组里的两条 local 字符串要能看出偏移不同。

## 反例

### 1. 忘记 strict

```ts
dayjs('2026-02-31', 'YYYY-MM-DD').isValid()
```

不加 `true` 不能当本示例的合法性。Lab 的 `strictDate` 两者都要。

### 2. 用 add(1, 'day') 表示 24 小时后重试

日历日和经过时间在 DST 日不同。重试用 `add(24, 'hour')` 或毫秒。窗口函数用的是日历字符串加一天。

### 3. dayjs.tz('2026-11-01 01:30', zone) 让库猜

回拨日有两个 instant。必须自带偏移，并用 `resolveExplicitZonedInstant` 核对。

### 4. 固定 -05:00 表示纽约

那只是标准时的一个偏移。夏季是 `-04:00`。保存 IANA 名和 instant。

### 5. 把 format 结果存进 JSON

本地化字符串不能再解析回同一瞬间。接口传 ISO instant 加 zone。

### 6. 在组件内 extend

每次渲染都 extend 没有必要，也可能在测试之间污染共享的 dayjs。放在模块顶层，测试要知道插件一旦打开就留在进程里。

### 7. locale 全局泄漏

`dayjs.locale('zh-cn')` 会改默认语言。Lab 用 `dayjs(value).locale('zh-cn')` 只影响这次调用。不要在请求之间改全局 locale。

### 8. 春季缺口被当成合法

若只看 `dayjs(input).isValid()`，某些偏移字符串仍是有效的绝对时间，但不是该时区的墙上 02:30。必须比较 `tz(zone)` 之后的钟面和偏移。

## 组合

**date-fns。** 不要对同一个发布日用两套库各算一次再取平均。选定权威库。C22 展示迁移对照，不是运行时双写。

**Luxon。** 若产品需要用户从 `getPossibleOffsets()` 里点选，用 C16 的 API，而不是在 Day.js 里手写一份不完整的列表。

**i18next。** 月名和按钮属于文案。`locale('zh-cn')` 只负责这次日期格式。语言切换不要改写已经存下的 instant。

## 生产清单

- `customParseFormat` 打开后，解析带第三参 `true`。
- 时区用 `dayjs.tz`，并列出允许的 IANA 名。
- 回拨日的输入带偏移，且与该 zone 的墙上时间一致。
- 展示和存储分开。
- 不把 `diff` 小时数叫做日历日。
- 插件 extend 放在模块顶层，locale 用实例方法。

## 升级

1.11.23 的插件路径是 `dayjs/plugin/timezone` 等。升级后重测严格模式、纽约春秋窗口和 `0000` 年。timezone 数据来自插件和宿主，换 Day.js 小版本不等于换了整套 TZDB。

## 练习

1. `2026-02-30` 失败，`2026-03-07` 以中文格式出现。
2. `-04:00` 和 `-05:00` 的 01:30 得到不同 `toISOString()`。
3. `2026-03-08T02:30:00-05:00` 在纽约被拒绝。
4. 去掉偏移后 `resolveExplicitZonedInstant` 抛错。

## 官方链接

- https://day.js.org/docs/en/parse/parse
- https://day.js.org/docs/en/plugin/timezone
- https://day.js.org/docs/en/plugin/custom-parse-format
- https://github.com/iamkun/dayjs

## 证据

`offset-instant` 若在测试里 import 了插件，仍要有 sdk 收据才算 Day.js PASS。build 与 browser 分开。收据目录是 `docs/library-lab/evidence/runs/`。

GitHub Actions 41779873259 是仓库级安装、typecheck、build、52 个 SDK 文件（153 项测试）和 45 项 Playwright 的结果，不是 C15 的条目 PASS。不要改 `verification.json`。
