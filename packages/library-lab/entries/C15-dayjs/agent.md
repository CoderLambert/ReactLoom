# C15 Day.js — Agent 工程移植指南

## 什么时候选它
需要轻量链式日期处理、已经使用 Day.js，且能统一注册必需插件的 Web 项目。若任务涉及繁杂 DST 歧义、Interval 或跨时区排程审计，对比 C16 Luxon 和 C14 date-fns。

## 最小迁移文件
examples/example.tsx 中 strictDate、civilWindow 和 twoFallbackInstants 是可移植纯逻辑；React 表单只是演示。安装 dayjs@1.11.23，初始化 utc → timezone → customParseFormat；本地化资源按需单独 import。

## 不可删要求
- 日期输入必须 YYYY-MM-DD 且 strict=true。
- UTC instant 与当地墙上时间分开解析；服务端事件必须显式提供 Z/偏移。
- 计算下一当地日期要重建时区时间，而不是 +86400000。
- 插件初始化集中化；不要在多租户 SSR 中修改全局 locale/defaultTimezone。
- 不能将浏览器演示等同于可靠 Cron。

## 禁止反模式
默认宽松解析、隐式浏览器时区、将 DST 日视为24小时、未经核验依赖日库对回拨歧义选择、复制过时测试状态。

## 必须运行
node --test entries/C15-dayjs/tests/sdk.test.mjs，以及 Lab typecheck/build/重点浏览器。必须看到当前SDK导入和断言真的通过才填写PASS，并绑定 sourceFingerprint + 命令+日志。

官方：https://day.js.org/docs/en/plugin/timezone


## 事件输入与 DST 缺失时刻

如果上游提供偏移且同时声明 IANA zone，迁移 `examples/offset-instant.mjs` 校验两者一致，勿直接信任时间文本的偏移。回拨日两种真实 offset 必须都能表示；春季跳过的 02:30 必须被拒。新 helper 由实际 Day.js 插件调用实现；`sdk.test.mjs` 需要真正安装依赖后执行，不能把源码存在当作 PASS。