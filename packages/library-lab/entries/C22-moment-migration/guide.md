# 把 Moment 发布计划迁成明确的日期模型

旧系统用一个 Moment 对象表示账单日期、发布时间和“明天中午”。这三种需求在平常日期看起来相似，遇到跨地区显示或夏令时就会分叉：账单的 `2026-11-01` 没有唯一的 UTC 时间点；纽约的次日中午也不总是 24 小时以后。本例把它们拆开，再分别用 Day.js、date-fns 和明确的 IANA 时区实现。

Moment 官方将项目定位为维护中的历史项目。已有应用行为稳定时，可以按业务边界逐步迁移；新代码可依据 API 风格和时区需求选择目标库。本例同时展示两套替代 API 是为了做迁移对照，业务项目通常选一套主要计算方式。运行依赖为 `date-fns@4.4.0`、`@date-fns/tz@1.5.0`、`dayjs@1.11.23`；历史 Moment 只查资料，不参与 Demo 运行。

## 先确定值的含义

| 需求 | 保存的值 | 计算和显示方式 |
| --- | --- | --- |
| 账单日、生日 | `YYYY-MM-DD` 字符串 | 严格校验，再做日历运算 |
| 已确定的发布时间 | 带 `Z` 或数值偏移的 ISO 时间点 | 解析成时间点；显示时另传地区 |
| 每天纽约中午发布 | 日期、当地时间和 `America/New_York` | 按该地区的日历加一天，再确定时间点 |
| 24 小时后过期 | 起始时间点和时长 | 按实际经过的小时计算 |

Day.js 的链式 API 接近 Moment，默认运算返回新实例；date-fns 把日期作为函数参数，返回新的日期值。`@date-fns/tz` 的 `TZDate` 带有 IANA 时区，date-fns 的 `in: tz(zone)` 明确本次运算的地区。它们都需要你先选对业务语义。

## 最小接入：先迁一个日期字段

在支持 ES modules 的 React 工程中安装固定依赖：

```sh
pnpm add date-fns@4.4.0 @date-fns/tz@1.5.0 dayjs@1.11.23
```

示例的实际计算在 [migration.mjs](examples/migration.mjs)，React 控件在 [example.tsx](examples/example.tsx)。日期校验的关键路径是：

```ts
const context = { in: tz('UTC') };
const parsedDayjs = dayjs.utc(input, 'YYYY-MM-DD', true);
const parsedDateFns = parseISO(`${input}T00:00:00Z`, context);
```

上面的片段依赖共享模块顶部的完整初始化，不能单独复制后省掉插件：

```ts
import { TZDate, tz } from '@date-fns/tz';
import { addDays, addHours, format, isValid, parseISO } from 'date-fns';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat.js';
import utc from 'dayjs/plugin/utc.js';

dayjs.extend(customParseFormat);
dayjs.extend(utc);
```

插件包含在 `dayjs` 包中，不另装同名包；本例不调用 `dayjs.tz`，所以不需要 Day.js timezone 插件。严格格式解析和 UTC 的前置条件分别见[官方格式解析说明](https://day.js.org/docs/en/parse/string-format)与[UTC 插件说明](https://day.js.org/docs/en/plugin/utc)。时区排程由 `@date-fns/tz` 提供，显示由环境原生 `Intl` 提供；现代浏览器或带 IANA 时区数据的 Node 是运行前提。

`customParseFormat` 提供指定格式和严格模式，`utc` 插件让 Day.js 校验载体使用 UTC。date-fns 路径也附加明确的 `Z`，避免无偏移输入依赖操作系统的当地日期。两套结果都要有效，date-fns 再格式化回原字符串后才接收。本例的输入范围是 1000–9999 年、完整的 `YYYY-MM-DD`；这个范围和正则是示例自己的业务规则。

UTC 在这里是稳定的校验载体，不是把账单日期改存为 UTC 午夜。函数返回的业务日期仍是字符串。后面的 `add(1, 'day')` 和 `addDays` 必须使用返回值，不能沿用 Moment 修改原对象后的写法。

## 实验一：严格日期、令牌和返回值

进入“从日期字段迁移”。默认 `2026-11-01` 会产生两套斜线日期和各自的下一天：

1. 点击“试无效日期”：输入变成 `2026-02-30`，出现错误提示，报告的 `valid` 为 `false`，不再输出看似成功的格式化日期。
2. 点击“恢复有效日期”：`dayjsFormat` 和 `dateFnsFormat` 都表示 `2026/11/01`，两条 `Next` 为 `2026-11-02`。
3. 查看 `originalAfterAdd`：仍是 `2026-11-01`。这就是迁移时需要重新赋值的原因。

关键源码是 `calendarReport`。Day.js 使用 `YYYY/MM/DD`，date-fns 使用 `yyyy/MM/dd`；大小写代表不同令牌。不要把 Moment 的格式串机械复制给 date-fns。迁移测试应同时检查有效输入、非法日期和运算后的原值。

## 实验二：时间点不随显示地区变化

进入“从发布时间迁移”。`instantReport` 先检查本例的 ISO 输入契约，再调用 date-fns 的 `parseISO` 和 `isValid`；有效结果用 `toISOString()` 规范化。`Intl.DateTimeFormat` 只负责把这个时间点显示到选择的地区。

1. 保持 `2026-11-01T05:30:00Z`，把显示时区从纽约切到上海：`isoInstant` 不变，`displayed` 从当地 01:30 变为 13:30。
2. 切回纽约，分别点击“回拨较早 01:30”和“回拨较晚 01:30”：当地显示都是 01:30，规范化时间点分别是 `05:30Z` 和 `06:30Z`，相差一小时。
3. 点击“试缺少偏移”：报告拒绝 `2026-11-01T01:30:00`。也可手工输入 `2026-02-30T05:30:00Z`，验证非法日期不会进位。

本例要求有秒、可选的 1–3 位毫秒以及 `Z` 或 `±HH:mm` 偏移；这比 ISO 的全部语法更窄，是应用自建的输入合同。偏移只标识该时间点的数值差，不能代表纽约未来一年的时区规则。将来若要求用户输入“纽约当地 01:30”，还需要决定回拨重叠和春季缺口如何处理，可继续看 C16 的显式解析模型。

## 实验三：明天中午与 24 小时后

进入“从周期排程迁移”。起点是纽约中午，样例下拉框提供春季跳时、秋季回拨和普通冬日三个受控日期。每次选择都真实运行：

```ts
const start = new TZDate(2026, month, day, 12, 0, 0, zone);
const calendarNext = addDays(start, 1, { in: tz(zone) });
const elapsedNext = addHours(start, 24, { in: tz(zone) });
```

春季样例中，`calendarNext` 仍为次日 12:00，但实际经过 23 小时；`elapsedNext` 为次日 13:00。秋季样例的日历日经过 25 小时，24 小时后则是次日 11:00。普通冬日两者相同。`originalAfterBoth` 始终保留起点。

选择“每天同一当地时间”时用日历运算，选择“准确经过一段时长”时用小时运算。Fixture 只提供起点，结果由真实 `TZDate`、`addDays`、`addHours` 和格式化函数计算。这个实验不模拟服务端任务队列。

## 把源码迁到项目中

复制 [example.tsx](examples/example.tsx)、[migration.mjs](examples/migration.mjs)、[migration.d.mts](examples/migration.d.mts) 和 [styles.css](examples/styles.css)；[demo.tsx](examples/demo.tsx) 是 Lab 的再导出入口，可用自己路由直接挂载 `MomentMigrationExample`。声明文件让 TypeScript 消费同一份 `.mjs` 实现，测试也直接调用它，没有另一套展示用算法。CSS 使用 `c22-` 命名空间；需要导入 CSS 的 bundler 类型配置。

在 Vite React + TypeScript 工程中，将四个文件保存在同一目录（保留 `.mjs` 与 `.d.mts` 的同名配对），入口导入 `MomentMigrationExample`，例如 `<MomentMigrationExample level="basic" />`。另两个值为 `business` 和 `advanced`；`level` 是必填参数。保留 `example.tsx` 中的 `import './styles.css'`；`src/vite-env.d.ts` 需有 `/// <reference types="vite/client" />`，TypeScript 使用 `moduleResolution: "bundler"`、`jsx: "react-jsx"`、`allowSyntheticDefaultImports: true`。非 Vite 工程应提供自己的 CSS 模块声明，Next App Router 则须在此交互组件顶部添加 `'use client'`。本条目没有在 Next 中做独立构建验收。

三个场景只持有各自的 React 输入状态，离开时随组件卸载。没有计时器、订阅、请求或临时 URL。Day.js 插件在模块初始化时注册，不更改全局 locale 或默认时区；实际应用应统一管理插件配置，避免另处加载 `BadMutable` 改变默认不可变语义。

## 迁移前逐条核对旧行为

- Moment 的 `add` 会修改原实例；替换为 Day.js/date-fns 后，要检查忽略返回值的调用点和 React state 的更新方式。
- 不应把“宽松解析”理解为所有非法日期都会进位。Moment 2.30.1 的源码会检查日期溢出；本例不声称 `moment('2026-02-30')` 有效。迁移时用现有系统的真实输入建立回归集。
- Moment 2.30.1 的 `toJSON()` 对有效值调用 `toISOString()`，无效值返回 `null`。序列化通常不会暴露内部字段，但 ISO 结果不能携带原显示地区的完整 IANA 规则。接口应明确保存日历日、时间点和需要保留的地区字段。
- `hourCycle: 'h23'` 让显示小时使用 00–23。它只控制格式，不改变时间点或时区运算。

这三条历史 API 结论来自固定的官方 2.30.1 源码；本例没有执行旧 Moment，不能用替代库的结果证明旧库运行通过。

## 官方原文与官网

“官方 README”页使用与运行版本匹配的 date-fns 官方英文原文；对应提交没有官方中文 README。还保存了同提交的 [TZ README](official/tz-readme.md) 和匹配 Day.js 1.11.23 的[官方中文 README](official/dayjs-readme.md)。Moment 的[历史官方 README](official/moment-readme.md) 仅用于核对项目定位。完整仓库、提交、路径、语言、同步时间和摘要见[来源清单](official/source-evidence.json)。

官网预览复用 date-fns 的官方入口。已保存的 HTTP 响应未发现嵌入限制头，但尚未从 Lab origin 确认官网内容可用，因此状态为“未知”，保留直达入口。`iframe load` 或无报错不能单独证明允许嵌入。
