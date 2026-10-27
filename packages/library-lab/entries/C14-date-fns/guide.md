
# C14 date-fns：从日期格式化走向业务日历

**目标版本**：date-fns 4.4.0 + @date-fns/tz 1.5.0，两个包均 MIT。安装：`pnpm add date-fns@4.4.0 @date-fns/tz@1.5.0`。原研究包中的文件仅作为参考；这里的运行和文档独立编写，不继承历史验收结果。

## 什么时候适用

用于 RSS 摘要日历、按日/月统计、列表日期格式化、含 IANA 时区的日期运算。它是函数库而不是后台计划调度器。不能依靠浏览器持续运行或默认设备时区完成生产 Cron。

## 安装、引入与实际源码

核心 API：`import {addDays, differenceInCalendarDays, differenceInHours, format, parseISO} from 'date-fns'`。时区：`import {TZDate, tz} from '@date-fns/tz'`。三层示例的唯一运行源文件为 `examples/example.tsx`，`examples/demo.tsx` 仅重导出。请在源码 Tab 查看实际代码及 SHA-256，不要复制文档内旧片段替代运行代码。

## 入门：严格日历日期

`YYYY-MM-DD` 是日历日期，不是 UTC 事件瞬间。先校验形状，再以指定 zone 的本地中午构造 TZDate，回查 year/month/day。无效的 `2026-02-30` 必须被拒，而不是变成 3 月 2 日。独立 Date.parse 的宽松行为不构成校验。

## 业务：地区化的日历跨度

以明确的 IANA zone 和本地日期为参数，`addDays(start, count, {in: tz(zone)})` 表达的是“增加日历天”，`differenceInCalendarDays` 对比本地日历日跨度；`differenceInHours` 测算实际经过小时。将业务 zone 与调度规则持久化，而不是只存一条当前 UTC 时间戳。

## 进阶：DST 回拨和跨越

纽约 2026-03-07 中午到 03-08 中午跨春季调整，是 1 个日历日但 23 小时；2026-10-31 到 11-01 是 25 小时。秋季回拨的 01:30 可对应 -04:00 和 -05:00 两个不同瞬间；没有时区/偏移时需拒绝或实现显式消歧策略。演示严格要求 `Z` 或 `±HH:mm`。

## 五个反例与正确方案

1. `Date.now()+86400000` 当“明天”：DST 可能错；使用基于目标时区的 addDays。
2. `new Date('2026-02-30')` 当验证：日期溢出会掩盖非法输入；对年月日回查。
3. 用无偏移 `2026-11-01T01:30` 表示唯一事件：回拨时有歧义；强制偏移或定义消歧规则。
4. 不传 tz，指望服务器与用户相同时区：SSR/浏览器输出可能不同；明确 zone。
5. 仅保存 UTC 忽略“每天上午 9 点”原始时区规则：跨 DST 定时失效；持久化 IANA zone 和本地规则。

## 与其他库组合

C12 FullCalendar 负责 UI，但 all-day 与 timed event 需要不同建模。C15 Day.js 更偏链式对象 API；C16 Luxon 更偏 DateTime/Interval。不要同时在业务核心混合三种日期模型。

## 生产与测试要求

测试 NY 的 23/25 小时、非法 2 月 30、无偏移 01:30 拒绝、上海/UTC 不受运行机时区影响；跨端首屏避免在 render 期间直接调用随环境变化的 Date.now。纯日期函数不需要 cleanup，但业务异步/定时器需由宿主自行管理。

**当前实际验证**：参见 verification.json，SDK/build/browser 全部 NOT_RUN；原件恢复状态不等于当前运行可用。

## 官方资料

- https://github.com/date-fns/date-fns
- https://github.com/date-fns/tz
- https://blog.date-fns.org/v40-with-time-zone-support/

## 新增：绝对事件输入的格式边界

示例现在通过同源 `examples/instant-policy.mjs` 先验证事件 ISO 日期时间，再交给真实 `date-fns/parseISO`：必须提供秒和明确的 `Z` 或 `±HH:mm`，最多三位毫秒；拒绝日期溢出、闰年错误、24:00、闰秒 60、超出 ±14:00 的偏移和表示“偏移未知”的 `-00:00`。独立纯策略测试可直接运行，但不证明 date-fns SDK 已运行。此格式是本 Lab 的保守 API 契约，不声称覆盖 ISO 8601 全语法。