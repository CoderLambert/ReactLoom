# C16 Luxon — DateTime / Interval 工程时间模型

## 适用任务与版本

固定 Luxon 3.7.2；面向明确 IANA 时区的日历事件、报表窗口、持续时间与国际化展示。Luxon 的 DateTime 是不可变对象，Interval 表达起止区间。它使用运行环境提供的 Intl 时区数据，不是可靠的后端调度器。

## 安装

~~~sh
pnpm add luxon@3.7.2
pnpm add -D @types/luxon@3.7.6
~~~

~~~ts
import {DateTime,Interval} from 'luxon'
const start=DateTime.fromISO('2026-03-07T12:00:00',{zone:'America/New_York'})
const end=start.plus({days:1})
const hours=Interval.fromDateTimes(start,end).length('hours')
~~~

目标示例源码 examples/example.tsx，入口 examples/demo.tsx，支持 basic/business/advanced 三层。

## 场景与可见结果

基础：拒绝 2026-02-30 等不合法日期；用 locale zh-CN 生成完整本地化文本，不把服务器系统时区当业务时区。

业务：给 RSS 频道定义每天本地中午的时间窗口，+1 day 保持当地时间，而非 +24 hours；计算两个本地事件的真实经过小时数。

进阶：纽约 DST 春季相邻中午只过23小时，秋季则25小时；利用 DateTime#getPossibleOffsets() 获取 2026-11-01 01:30 的两种真实 offset，再把两种结果转换为 ISO UTC。

## 核心语义

DateTime.fromISO(value,{zone}) 用显式 zone 解析当地日期；toUTC() 保持 instant 仅改变显示时区；setZone(zone,{keepLocalTime:true}) 将本地墙上时间重新解释为新时区，可能改变绝对时刻。Interval.fromDateTimes(start,end) 为半开区间 [start,end)，业务数据库起止约定需一致。

## 专属反模式

1. 将 DateTime.fromISO 返回值不检查 isValid 就入库，非法输入扩散。
2. 把 +1 day 当作 +24 hours，跨夏令时发生小时偏差。
3. 使用机器本地 now() 隐式处理外部用户的订阅时区；明确传业务 zone。
4. 对回拨的 01:30 不检测 getPossibleOffsets()，悄然选了一个 instant。
5. 混用保留 offset 的解析与忽略 offset 的转换，导致二次偏移。
6. 长期定时任务由浏览器 setTimeout 承担；标签休眠就会失去精确调度。

## 生产推荐

持久化绝对事件时采用 ISO UTC 和独立 IANA zone 字段；对未来重复事件存“当地时间规则+zone”，每次重新计算下一 instant。错误提示应暴露 invalidExplanation；跨平台比较采用统一 TZ 数据和确定性测试时钟。与 C14 date-fns、C15 Day.js 对照选择，不全仓重复引入三个日期库。

## 真实验证

node:test 直接使用 luxon SDK，检查无效日期、Interval DST 23/25小时与 getPossibleOffsets()。SDK/build/browser没有运行则必须保留 NOT_RUN。实际命令见 tests/sdk.test.mjs，严格不得用 mock 库记 PASS。

官方：https://moment.github.io/luxon/api-docs/index.html


## 进阶补充：不存在与重复的本地时刻

`examples/wall-time.mjs` 是实际演示调用的独立 Luxon 适配器。先由纯 `wall-time-policy.mjs` 校验严格的 `YYYY-MM-DDTHH:mm`，再由真实 `DateTime.fromISO(...,{zone})` 解释为本地时间；解析后回查墙上时间，阻止 Luxon 对春季 DST 缺失的 `2026-03-08T02:30` 自动前移成 03:30。秋季的 `2026-11-01T01:30` 必须借助 `getPossibleOffsets()` 和用户明确选择 `-04:00` 或 `-05:00`，才可形成 UTC instant。这个教学合约刻意拒绝歧义，不默默采用运行机猜测。纯策略 Node 检查不验证 Luxon SDK；SDK 需要独立安装运行。