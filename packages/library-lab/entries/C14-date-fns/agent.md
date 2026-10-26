
# C14 date-fns — Agent 工程复用指南

适用于纯函数日期运算，版本 `date-fns@4.4.0` + `@date-fns/tz@1.5.0`（MIT）。前置问题：目标数据是“日历日期”“绝对事件时间”还是“经过时长”？是否已有业务 IANA 时区？

## 实施流程

首先读取 library.json 和 verification.json，再打开 `examples/example.tsx`。提取 `parseCivilDate`、`parseInstant`、`planCivilDays` 时保留业务时区和严格校验；不要把 React 控件复制进服务端。展示文件 `examples/demo.tsx` 是 Lab 入口，不是生产必需依赖。

## 不允许删去的保障

严格 YYYY-MM-DD + 日历回查；绝对瞬间 ISO 必须带时区/偏移；显式 `tz(zone)` 进行业务日历差值；跨 DST 不使用固定 24 小时；取消使用无业务所有权的浏览器计时器做可靠调度。SSR 应避免客户端/服务端默认时区差异导致水合不一致。

## 可迁移模式

定期 RSS 发布按 zone 日历日计算，具体任务由后端调度器执行。仅展示相对日期或偏移日数时可以选纯 date-fns；需要复杂 recurrence、节假日或 cron 请加专用调度与持久化规则。

## 测试与结论边界

NY 2026-03-07→03-08 23h；10-31→11-01 25h；`2026-02-30`、无偏移回拨 01:30 拒绝。版本/API/构建/浏览器必须在目标项目再验证。本分支未实际运行这些 SDK 用例，不能写 PASS。

来源：https://github.com/date-fns/date-fns · https://github.com/date-fns/tz
