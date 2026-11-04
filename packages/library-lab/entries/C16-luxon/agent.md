# C16 Luxon — Agent 工程移植指南

## 适用条件
业务时间伴随 IANA zone、需要 DateTime/Interval/Duration 和跨 DST 的可解释行为；当前参考 luxon@3.7.2，Types @types/luxon@3.7.6，MIT。轻量渲染可比较 C15 Day.js。

## 源码入口
examples/example.tsx 的 parseCalendarDay、dailyWindow、ambiguousFallback。examples/demo.tsx 是 Lab 按需加载适配出口；复制到目标工程时无需 DemoHost。

## 必须保留
对 DateTime 解析检查 isValid、invalidExplanation；明确 zone 与 locale；区别 .plus({days:1}) 和 .plus({hours:24})；绝对事件存 ISO UTC；处理回拨歧义使用 getPossibleOffsets() 并选择/提示明确 offset。多租户服务端不共享 Settings.defaultZone 可变配置。

## 禁止
以 JS Date 自动进位、设备默认时区、直接字符串截取构建时间、用前端计时器替代后端排程、在源码未变但依赖版本变化后沿用旧 PASS。

## 验证
先 node --test entries/C16-luxon/tests/sdk.test.mjs，复核春秋 DST 与回拨；再类型检查、构建、浏览器。没有实际安装/运行时为 NOT_RUN。对应 C14/C15 的 API 不是 Luxon API，不得照搬。

官方：https://moment.github.io/luxon/api-docs/index.html


## 强制消歧代码路径

不能只调用 `DateTime.fromISO(wall,{zone})` 后检查 `isValid`：Luxon 对春季 DST 缺失时间可能平移，对秋季重复时刻可能选一个偏移。复制 `examples/wall-time.mjs` 和 `wall-time-policy.mjs`，必须保留墙上时间回查、`getPossibleOffsets` 和可显式选择的偏移；对未知偏移报错，不能自动选择第一项。纯 Node 和真实 Luxon SDK 测试分项记录。