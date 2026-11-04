# Moment 迁移｜权威计算是 date-fns 4.4.0 和 Day.js 1.11.23

这一篇不推荐把 Moment 装进新应用。Moment 已经处于维护状态，可变 API 和打包体积都不适合作为 React 状态。Lab **不把 `moment` 列进运行依赖**。挂载示例只用 `date-fns@4.4.0`、`@date-fns/tz@1.5.0` 和 `dayjs@1.11.23`。

没有收据时 sdk / build / browser 保持 NOT_RUN。Actions 41779873259 不是本条目 PASS。

## Lab 当前示例

[`examples/example.tsx`](examples/example.tsx) 没有 `import moment`。`demo.tsx` 只做再导出。没有双终端的旧 Moment 服务，也没有 `localhost:5173`。

- **basic**：`validCalendarDay` 同时要求正则、`dayjs(value, 'YYYY-MM-DD', true).isValid()` 和 `isValid(parseISO(value))`。`2026-02-30` 不能被悄悄接受。输出对比 Day.js 的 `YYYY/MM/DD` 和 date-fns 的 `yyyy/MM/dd`，以及 `addDays` 得到的下一天。格式令牌并不相同：Moment 的 `YYYY` 不能原样贴进所有库还指望月日补零规则一致。
- **business**：增加显示时区和一条 UTC ISO。`formatInstant` 用 `Intl.DateTimeFormat`，`timeZone` 来自下拉框，`hourCycle: 'h23'`。报告里的 `isoInstant` 来自 `new Date(instant).toISOString()`。日历日和 instant 分两栏。这不是把日历日转成 UTC 午夜再当事件时间。
- **advanced**：`TZDate(2026, 2, 7, 12, 0, 0, 'America/New_York')` 再 `addDays(..., { in: tz('America/New_York') })`，用毫秒差除以 3600000 得到春季相邻日历日的小时数。秋季比较 `2026-11-01T01:30:00-04:00` 和 `-05:00` 的 `toISOString()`，以及两者相差的小时。注释写明 TZDate 带的是 IANA 名，不看操作系统时区。

页面最后提醒：Moment 的 `add` 和 `startOf` 会改原对象。换成不可变的 Day.js 或 date-fns 之后，赋值和比较都要改。

## 什么时候用

代码库里还有 `moment()`、`.add(1, 'day')` 改原对象、或把格式令牌当接口的时候，用这篇做迁移清单。新功能直接选 C14、C15 或 C16 里的一个，不要三套同时当权威。

迁移的目标不是「还能显示今天」。目标是：非法日期会失败、日历日和 instant 分开、DST 的 23/25 小时被看见、回拨日的两个 01:30 不会合成一个。

## 数据与模型

四种值在迁移时最容易被 Moment 的一个对象包在一起：

| 值 | 迁移后放哪 |
| --- | --- |
| 日历日 `YYYY-MM-DD` | 严格解析，禁止进位 |
| 事件 instant | 带 `Z` 或数值偏移的 ISO |
| 显示时区 | `Intl` 或 `TZDate` 的 IANA 名 |
| 经过的小时 | 毫秒差，不从日历日差推 |

Moment 默认可变。`const b = a.add(1, 'day')` 之后 `a` 也变了。React state 里如果存的是这个对象，渲染和比较都会脏。Day.js 默认返回新对象。date-fns 不改入参。迁移时搜索 `.add(`、`.subtract(`、`.startOf(`、`.endOf(`，凡是之后还读原变量的地方都要改成使用返回值。

`.add(1, 'day')` 在 Moment 里是日历日，不是 24 小时。DST 日两者不同。不要改写成 `+ 86400000` 就算迁完。示例用 `addDays` 加 `TZDate`。

宽松解析会接受 `2026-02-30` 并进位。Day.js 必须带 `customParseFormat` 和第三参 `true`。date-fns 的 `parseISO` 还要 `isValid`。两个都过，示例才把这一天当日历日。

把日历日 `2026-11-01` 解析成 UTC 午夜，会让纽约的「这一天」偏到前一晚。业务日就存日历字符串。事件另存 instant。

固定偏移不是时区。`-05:00` 不会在夏天自动变成 `-04:00`。显示用 IANA 名。存储用 instant。

格式令牌：Moment `YYYY-MM-DD HH:mm` 与 date-fns `yyyy-MM-dd HH:mm` 的年、日字母不同。Day.js 更接近 Moment 的令牌，但仍要开插件并核对严格模式。不要全局替换字母。

`startOf('day')` 使用当时的默认时区。服务器在 UTC、浏览器在上海，同一调用会得到不同瞬间。迁移后显式传入 zone。

秋季重叠：两个 01:30 相差一小时。必须保留偏移。春季缺口不要静默顺延到存在的时刻还当成功。示例把缺口的完整拒绝放在 C15/C16；这里的 advanced 把两个合法偏移并排显示，避免迁完之后只剩一个 `Date`。

不要从用户提供的 locale 字符串调用 Moment 的全局 `locale()`。那会改进程里的其它请求。Day.js 用实例 `.locale()`，并且只用于展示。

只检查 `AbortSignal` 不够。若迁移的是「保存发布计划」而不是纯函数，仍要 generation，防止旧响应写回。本 Demo 没有请求。

不要把 Moment 换成浏览器的 `Date` 解析就算结束。`Date` 的无偏移字符串依赖系统时区，可变性也没有变得更明确。

## 三层示例

### 基本

输入 `2026-02-30`。alert 出现，输出里的格式化字段为 `INVALID`，`nextDate` 也是 `INVALID`。输入 `2026-11-01`，Day.js 和 date-fns 的斜线日期应表示同一天，下一天是 `2026-11-02`。看令牌：一边是 `YYYY/MM/DD`，一边是 `yyyy/MM/dd`。

### 业务

改时区为上海和纽约，同一条 `2026-11-01T05:30:00Z` 的 `renderedInZone` 不同。改 instant 为非法字符串，`isoInstant` 为 `INVALID`。不要把日历日输入框和 ISO 输入框合成一个。

### 进阶

`<pre>` 里的 `springCivilDayHours` 是纽约 3 月 7 日中午到次日中午的小时数，用来看春季跳时，不应在未运行时被写成永远 24。`fallEarly` 与 `fallLate` 是两个 ISO，`repeatedHourGap` 是它们的小时差。页脚说明可变对象必须改赋值。

## 反例

### 1. Moment 放进 React state

```ts
const [when, setWhen] = useState(() => moment())
when.add(1, 'day')
```

原对象被改，state 引用没变，可能不渲染。用不可变返回值并 `setState`。

### 2. add(1, 'day') 改成加 24 小时

日历发布日会在 DST 上错一小时。用带 zone 的 `addDays`。

### 3. 宽松解析

`moment('2026-02-30')` 可能不是无效。严格模式或双库回读，失败就停。

### 4. 日历日变成 UTC 午夜

`moment.utc('2026-11-01')` 再存数据库，纽约用户看到的日子会偏。日历日保持字符串。

### 5. 固定偏移当时区

夏天的纽约不是 `-05:00`。存 IANA 名和 instant。

### 6. 原样粘贴格式令牌

Moment 的 `DD` 在 date-fns 是一年中的日。对照 basic 的两套 format。

### 7. 把日期对象放进 JSON

```ts
JSON.stringify({ at: moment() })
```

得到不稳定的结构。接口用 ISO 字符串或日历日字符串。

### 8. startOf('day') 不写时区

进程时区决定结果。显式 zone。

### 9. 回拨日静默选第一个

两个 01:30 都合法且不同。示例把两个 instant 都打出来。产品里要让用户选，见 C16。

### 10. 春季缺口顺延

不存在的 02:30 被加成 03:30 还显示成功。迁到 C15 的 `resolveExplicitZonedInstant` 或 C16 的回读。

### 11. 全局 locale

`moment.locale(userInput)` 影响所有调用。不要从请求参数改全局。

### 12. 只 abort 不看 generation

旧的保存响应仍会覆盖新表单。纯函数示例没有这条，带接口的迁移必须有。

### 13. 用原生 Date 当终点

`new Date('2026-11-01T01:30')` 不是带 zone 的迁移。advanced 用 `TZDate` 和带偏移的字符串。

## 组合

**date-fns 与 TZDate。** 日历加减和显示时区的小时差。`in: tz(zone)` 不能省。

**Day.js。** 严格解析和与旧令牌接近的格式化。插件要显式 extend。不要再装 Moment 做「对照运行」。

**Luxon。** 需要列出 `getPossibleOffsets` 时用 C16，而不是在迁移层再写第三个猜测。

## 生产清单

- 依赖里没有 `moment`。
- 搜索可变 `add` / `startOf` 并改为使用返回值。
- 日历日严格校验，拒绝 2 月 30 日。
- instant 与日历日分字段。
- 显示用 IANA 时区，不用固定偏移代表地区。
- 格式令牌按目标库重写并加测试。
- DST 样例至少包括纽约 2026-03 的日历日和 2026-11-01 的两个偏移。
- 不把日期对象放进 JSON。

## 升级

date-fns 和 Day.js 的 pin 与 C14、C15 相同。升级任一个都要重跑 `2026-02-30`、春季小时数和两个秋季 instant。不要为了对照再把 moment 装进本仓库。

`getMigrationReport` 在日期无效时仍返回对象，三个格式字段都是 `INVALID`。调用方要看这些字段，不能只看没有抛错。`formatInstant` 对 `NaN` 返回「无效时间」，不抛异常。两套失败方式都要在界面上看得见：日历日走 alert，instant 走报告里的 INVALID。

## 练习

1. `2026-02-30` 三套输出都是无效，而不是 3 月 2 日。
2. `2026-11-01` 的下一天是 `2026-11-02`，与显示时区无关。
3. 同一 UTC instant 在上海和纽约的 `renderedInZone` 不同。
4. 两个 01:30 的 ISO 不同，小时差为 1。
5. 在业务代码里搜索 `moment`，确认没有新的 import。

## 故障排查

| 现象 | 先看 |
| --- | --- |
| 2 月 30 日变成 3 月 | 解析没有严格模式，或只用了会进位的 `Date` |
| 同一变量过一天之后原值也变了 | 还留着 Moment 的可变 `add` |
| 服务器和浏览器差一天 | `startOf('day')` 或 UTC 午夜使用了进程时区 |
| 纽约夏天仍显示 `-05:00` | 把固定偏移当成了 IANA 时区 |
| date-fns 的日期变成一年中的第几天 | Moment 的 `DD` 被原样贴了过去 |
| 两个 01:30 合成一个 instant | 丢掉了偏移 |
| 接口里出现 `{"_isAMomentObject":true}` | 把 Moment 对象放进了 `JSON.stringify` |
| 旧保存覆盖新表单 | 只 abort 了请求，没有 generation |

搜索顺序建议是：`from 'moment'`、`.add(`、`.startOf(`、`moment.locale`、`moment.utc`。每处标明换成哪一个函数、哪一个时区参数。不要用「页面还能显示今天」当迁移完成。

春季相邻日历日的小时数以 advanced 的 `TZDate` 输出为准。若结果是 23，那就是跳时，不是计算坏了。秋季两个 ISO 必须同时留下。

## 官方链接

- https://momentjs.com/docs/#/-project-status/
- https://date-fns.org/docs/Getting-Started
- https://day.js.org/docs/en/parse/parse
- https://github.com/date-fns/tz

## 证据

本条目的运行库是 date-fns、`@date-fns/tz` 和 Day.js。没有 moment 的 sdk 可写。收据仍要出现在 `docs/library-lab/evidence/runs/`，并且命令 import 的是上述三个 pin。把「没有安装 Moment」写成 Moment PASS 是错的。browser 看非法日期的 alert 和 advanced 的 JSON。

GitHub Actions 41779873259 是仓库级安装、typecheck、build、52 个 SDK 文件（153 项测试）和 45 项 Playwright 的结果，不是 C22 的条目 PASS。不要改 `verification.json`。
