# Moment 旧库迁移：从字符串替换升级为时间语义迁移

## 为什么保留这篇条目

Moment 仍存在于不少旧工程，但对新 React 应用不应无条件重新安装。将它作为**历史识别与迁移**模块，聚焦时间点、民用日、时区和 DST。此 Lab 不加载 Moment；运行时代码使用已在库中的 date-fns / Day.js / TZDate。

## 安装与实际导入

```bash
pnpm add date-fns@4.4.0 @date-fns/tz@1.5.0 dayjs@1.11.23
```

```ts
import {addDays,parseISO,format} from 'date-fns'
import {TZDate} from '@date-fns/tz'
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
dayjs.extend(customParseFormat)
const valid = dayjs('2026-02-30','YYYY-MM-DD',true).isValid() // false
```

完整真实实现是 [examples/example.tsx](./examples/example.tsx)，Lab Demo 直接引用该文件，不维护另一份复制源码。本文代码为解释示例，具体运行结果需以 SDK 测试确认。

## 三层场景

### 1. 基础：严格日期

输入 `YYYY-MM-DD`，同时展示 date-fns 的民用日格式和 Day.js strict parsing。无效日必须产生清晰错误；禁止依赖运行时的日期字符串自动修正。

### 2. 业务：跨时区 RSS 发布时间

一条新闻的 UTC instant 应在指定 IANA 时区格式化；这是展示层行为，不应直接改变数据库中的原始瞬间。使用 `Intl.DateTimeFormat({timeZone})`，绝不手工加固定的 +8 小时。仅有 `2026-11-01` 的日历字段，不等价于 `2026-11-01T00:00:00Z`。

### 3. 进阶：DST 与可变性

纽约 2026-03-08 春季切换，一个日历日可能是 23 小时；2026-11-01 秋季回拨，两个 01:30 的 UTC instant 不同。采用 TZDate + addDays 演示民用日加法；使用两个带偏移的时间戳验证同墙上时间的歧义。

## 迁移矩阵

|旧 Moment 思路|现代实现方向|必须检查|
|---|---|---|
|`moment(value).format('YYYY-MM-DD')`|Day.js `format('YYYY-MM-DD')` 或 date-fns `format(date,'yyyy-MM-dd')`|token 差异、输入是否有效|
|`moment(value).add(1,'day')`|Day.js `add(1,'day')` / date-fns `addDays`|旧对象被修改，新实现通常返回新对象|
|`moment.utc(value)`|保留 ISO instant，按需时区显示|数据存储是否为 instant|
|`moment.tz(...)`|TZDate、Luxon、带 IANA 的接口|跳时/回拨/时区数据库|
|`moment(...).isValid()`|按指定格式严格解析|日期无效不能被自动归一化|

## 特别需要避免的反模式

1. **对 Moment、Day.js 和 date-fns 复制相同格式化 token**：尤其年份与日字符大小写。应分别编写针对性测试。
2. **把日期字段当 UTC 时间点**：民用日跨地域会偏移，影响 RSS 定时任务和面试日期。
3. **用固定毫秒数增加一天**：跨 DST 得到错误的墙上时间。
4. **以系统默认时区进行服务端业务校验**：部署地区变化可能造成回归；明确 IANA zone。
5. **忽略对象可变性变化**：迁移后链式调用若未接收返回值，逻辑可能不再发生更新。

## 组合建议

对已有 legacy 日历应用，优先按模块渐进迁移，而不是在同一请求链同时使用三种库进行序列化。迁移测试首先锁定原项目实际业务数据，再逐个替换调用点。对应 C14 / C15 / C16 的单库条目各自提供更细的 API 与边界。

## 验证状态与官方来源

实际示例/测试文件已编写；当前新代码尚未运行 SDK / TypeScript / Chromium，保持 NOT_RUN。禁止使用历史 ZIP 的 PASS 作为本次证据。

- [Moment 项目状态](https://momentjs.com/docs/#/-project-status/)
- [date-fns 官方文档](https://date-fns.org/docs/Getting-Started)
- [Day.js 文档](https://day.js.org/docs/en/parse/parse)
- [date-fns/tz](https://github.com/date-fns/tz)
