# date-fns：把日历日期、时区和事件瞬间分开

本例使用真实 **date-fns 4.4.0 + @date-fns/tz 1.5.0**，两包 MIT。适合已有 JavaScript Date、希望按函数组合完成日期加减和格式化的应用。日期选择器负责录入，date-fns 负责计算；这里没有后台定时任务、数据库或浏览器 cron。

三个目标共用 [date-contract.ts](examples/date-contract.ts)。页面 JSON 来自真实函数返回值，示例日期是本地固定输入，不是服务端响应。

| 目标 | 输入 | 处理 | 可观察结果 |
| --- | --- | --- | --- |
| 严格日历日 | YYYY-MM-DD + 三个白名单时区之一 | TZDate 目标区中午构造，完整回读字段 | 保留日历日、当地中午/偏移、对应 UTC instant |
| 日历排程 | 日历日 + 时区 + 1–14 天 | addDays 的 in 上下文；计算两种差值 | calendarDays 与整数 elapsedHours |
| DST 与事件瞬间 | 带明确偏移的事件字符串 | 严格输入合同后 parseISO；另算固定纽约春秋 | 23/25 小时、秋季两个 01:30 的不同 UTC |

## 先操作，再读计算链

### 1. 严格日历日与目标时区

1. 基本场景保留 2026-03-07、纽约，点击“运行日期计算”。
2. 输出 calendarDate 为 2026-03-07，localNoon 为 12:00 -05:00，instantUTC 为 2026-03-07T17:00:00.000Z。
3. 改成上海后旧结果立即消失；重新运行得到中午 +08:00，UTC 为 04:00。UTC 区则为 12:00 Z。
4. 输入 2026-02-30，运行出现 alert，结果不保留；改为 2024-02-29 可恢复。重置恢复默认草稿，清错误和结果。

本例日历业务范围为 **1901–9999 年**，且只接受纽约、上海、UTC。格式严格要求补零，不自动接受 2 月 30 日进位。代码还回读小时、分、秒、毫秒，要求准确中午。这是本例三个区的现代排程合同，不代表 date-fns 全球年份上限或一般时区能力。

范围来自实际诊断：当前 Node/Intl 与 tz 1.5.0 下，公共 setter 设置历史日期中午，上海 0096/1900 年回读 11:59:17，纽约回读 12:00:02。原低年正例失败与读数保留在本地验证记录。本例不添加私有时区逆算，也不把拒绝低年的 guard 当成低年 SDK 支持。实际正例仍覆盖三个区的 1901 下界、2024 闰日和 9999 上界。其他历史时区应另设需求与测试。

### 2. 日历排程与经过小时

1. 业务场景用纽约 2026-03-07 加 1 天，运行。
2. start 为 2026-03-07 12:00 -05:00，end 为 2026-03-08 12:00 -04:00；calendarDays 为 1，elapsedHours 为 23。
3. 日期改 2026-10-31，同样加一天：日历差仍 1，小时差为 25。
4. 同一天换上海或 UTC，小时差为 24。选 3 天时，纽约春季是 3 个日历日、71 个小时。
5. 9999-12-31 加一天超出本例结果范围，必须拒绝，不能把五位年当普通四位日期显示。

[planCivilDays](examples/date-contract.ts) 先验证整数天数，再调用：

~~~ts
const start = parseCivilDate(civil, zone)
const end = addDays(start, count, { in: tz(zone) })
const calendarDays = differenceInCalendarDays(end, start, { in: tz(zone) })
const elapsedHours = differenceInHours(end, start)
~~~

addDays 在目标区按日历字段加天，返回新的日期实例；不会把 start 改成 end。differenceInHours 基于毫秒差，默认截断到整数小时，并非一般情况下的精确小数持续时间。精确计费或毫秒超时应保存 epoch 差值；“当地明天中午”不能用固定 86400000 毫秒代替日历加一天。

### 3. DST 与明确事件瞬间

1. 进阶场景只显示“绝对事件时间”。固定春秋 DST 对照不依赖其他场景的日历草稿。
2. 默认 2026-11-01T01:30:00-04:00 得到 UTC 05:30。
3. 改为 -05:00，重新运行得到 UTC 06:30。ambiguousLocalTime 同时保留两个结果；相同钟面并不是同一瞬间。
4. 删除偏移，或改成 -00:00，必须失败；恢复合法偏移后可继续计算。
5. 明确 instant 路径独立支持输入年份 0001–9999；真实 SDK 测试覆盖 0001、0096 闰日与 9999，不经过现代日历年份 guard。

[instant-policy.mjs](examples/instant-policy.mjs) 是应用合同，**不是 date-fns API**：要求大写 T、完整时分秒、最多 3 位小数、Z 或 ±HH:mm，拒绝非法公历日期、24 点、闰秒、-00:00 和超过 ±14:00 的偏移。通过后才交给真实 parseISO。SDK 本身接受更宽 ISO 输入，不能把宽松性直接当作业务约定。

输入年份四位不等于 UTC 输出必定四位：极值日期加偏移可能跨到 0000 或 10000 年，生产持久化需另定 UTC 范围。历史 IANA 区还可能有秒级偏移，HH:mm XXX 这种分钟精度显示并非无损保存格式。这里保留 epoch/UTC instant，不把本地钟面反解析还原它。

## 哪些状态属于谁

React 持有输入草稿、当前结果、错误。编辑清结果，避免旧 JSON 冒充新草稿结果；运行同步调用真实 SDK；失败清旧结果；重置恢复默认。场景用 level key 新建 session，切换和离开自然清本轮 React 状态。

这里没有 effect、timer、事件总线、请求或待取消异步任务；不需要伪造加载时钟和清理计数。没有自动保存、提交发布或账号服务。程序化输入和普通 DOM 键盘验证不能宣称真实操作系统输入法验收。

## 迁移到自己的 React 应用

携带 [demo.tsx](examples/demo.tsx)、[example.tsx](examples/example.tsx)、[date-contract.ts](examples/date-contract.ts)、[instant-policy.mjs](examples/instant-policy.mjs)、[类型声明](examples/instant-policy.d.mts) 和 [styles.css](examples/styles.css)。依赖为 date-fns@4.4.0、@date-fns/tz@1.5.0、React；没有 Lab 别名、宿主上下文或隐式全局 CSS。

在自己的 pnpm 应用安装匹配版本：

~~~sh
pnpm add date-fns@4.4.0 @date-fns/tz@1.5.0
~~~

可只迁移合同模块，把输入接表单、结果接数据层；不要复制 Lab 目录/runner。扩大时区白名单、年份、输入格式或天数时，同步改合同、说明和实际 SDK 边界测试。

## 三个容易踩到的边界

- **format 未传 in 并不总是设备时区。** TZDate 通过 constructDateFrom 保留自身时区；普通 Date 未给上下文才使用环境时区。本例显式传 in: tz(zone)，避免调用方换成普通 Date 后含义变化。
- **偏移不等于时区规则。** -04:00 标识一个瞬间的偏移，不能替代纽约全年规则。日历排程保存 IANA 区与领域日期，事件保存明确 instant。
- **中午只是本配方的选择。** 避开本例春秋凌晨切换，不证明任意时区、任意历史日期都没有中午跳变或整日跳过。规则由运行时 Intl/TZDB 提供，库不向网络请求最新政策。

需要日期视图可结合 C12 FullCalendar；需要 DateTime/Interval 和歧义时间查询可评估 C16 Luxon。不要同时让多个库充当同一领域的时间权威。

## 官方原文与证据

匹配 v4.4.0 的固定提交为 cd53d2538cfa318404eff7ade6449b49bf34562e。该 monorepo 的 pkgs/core/package.json 是 4.4.0，pkgs/tz/package.json 是 1.5.0；旧独立 tz 仓库不是本轮 1.5.0 的版本依据。两包 npm 元数据均没有 gitHead，使用实际 tag 与固定 manifest 交叉确认。

检查完整 tree 后，根、core、tz 没有匹配官方中文 README。主快照采用根 [官方原README](https://github.com/date-fns/date-fns/blob/cd53d2538cfa318404eff7ade6449b49bf34562e/README.md)（英文 1814 字节）；时区包另存 [原文](https://github.com/date-fns/date-fns/blob/cd53d2538cfa318404eff7ade6449b49bf34562e/pkgs/tz/README.md)（英文 9377 字节）。保留上游内容与署名，没有自行翻译成“官方中文”。主快照在“官方”页签可读；精确路径、版本、同步 UTC、SHA-256 与原始响应头保存在本地维护记录。

官网实际 GET 200，最终响应 XFO/CSP 字段均 null；未从 Lab origin 验证 iframe，状态 **unknown**，不是 allowed。未读取官网正文。原文中的 npm 命令属于快照，本项目使用 pnpm。

本地真实 SDK 共 5 项按影响分两次验证，纯输入 policy 3 项；初始低年 FAIL、收窄后的真实 1901 边界与独立低年 instant PASS 分开保留。本地验证记录另列命令、退出码、范围与未测项。主控 candidate18 已执行三目标真实交互与官方来源共 4 项通过；源码与固定构建输入一致。正式 verification 三状态仍保持 NOT_RUN，详细收据在本地记录；不能由这四项推断任意部署环境、真实 OS 输入法或所有浏览器 TZDB 验收。
