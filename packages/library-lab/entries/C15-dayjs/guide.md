# C15 Day.js — 严格日期、IANA 时区与实际 DST 运算

## 工程定位

Day.js 提供轻量、不可变、链式日期对象，适用于前端展示和较小范围日期计算。它没有默认启用时区或严格格式解析，必须明确注册 utc、timezone、customParseFormat。此条目固定 v1.11.23，基于官方插件说明重写，不继承历史研究中的测试结论。

## 安装与入口

~~~sh
pnpm add dayjs@1.11.23
~~~

~~~ts
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import customParseFormat from 'dayjs/plugin/customParseFormat'
dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)
~~~

真实可迁移源码：examples/example.tsx；页面演示出口 examples/demo.tsx。三个场景共享同一份真实 SDK 实现。

## 三层实战

**基础**：对 YYYY-MM-DD 采用明确格式与 strict=true，禁止无效月份、2月30日自动进位。与原生 Date 的宽松解析做对照。

**业务**：RSS 每日当地中午排程，以当地民用日期推进下一天，使用 dayjs.tz(civil+' 12:00', format,zone) 分别解析每日时间；不要把明天写成 today+86400000。

**边界**：美国纽约 2026-03-07 12:00 到 03-08 12:00 为23小时，10-31至11-01对应25小时；2026-11-01 01:30 在 -04:00 和 -05:00 下对应不同 UTC 时刻。演示采用两个显式 UTC instant，而不是猜测 dayjs.tz 对歧义文本选哪个偏移。

## API 与生命周期

- dayjs(value,format,true) 严格解析需要 customParseFormat。
- utc 必须在 timezone 前注册。
- dayjs.tz(input,zone) 解析 IANA 本地时间，dayjs.utc(iso).tz(zone) 把已知绝对时间转换到指定时区；两者不是同一种业务语义。
- Day.js 插件注册影响当前模块加载实例，不能把它当作组件卸载后可还原的全局行为；一个应用统一控制插件初始化。
- locale 应尽量对当前实例设置，而非随手更改全局默认；SSR 多请求尤其如此。

## 五个具体反例

1. 仅依赖 dayjs('2026-02-30').isValid()：可能得到容错进位结果。改为指定格式和 strict。
2. 先 dayjs('2026-03-07 12:00') 再直接 .tz(zone)：第一步已经解释为设备时间。用 dayjs.tz(local,zone) 来表达本地墙上时间。
3. 时间循环使用 .add(24,'hour')：夏令时排程漂移。先计算下一民用日期，再按该时区解析。
4. 未注册 utc 就调用 timezone：插件前置依赖缺失。采用统一初始化模块。
5. 认为本地 01:30 总是唯一：回拨时重叠。服务端传绝对时间必须带 UTC 或 ±HH:mm。

## 组合建议

对比 C14 date-fns：后者适合函数式和 TZDate 运算；对比 C16 Luxon：后者把 zone 与 Interval 放入更明确的模型。UI 日期选择不等于准确的服务端调度；跨时区重复任务最终交后端持久化执行。

## 验证

实际 node:test 中直接 import dayjs 及官方插件，检查严格解析、23/25小时与回拨偏移；未安装前状态 NOT_RUN。不要将研发演示数据当真实 RSS 服务。浏览器需补设备时区矩阵（系统设 UTC/纽约/上海）、IME/键盘检查。

官方：https://day.js.org/docs/en/plugin/timezone · https://day.js.org/docs/en/parse/string-format · https://github.com/iamkun/dayjs/releases/tag/v1.11.23
