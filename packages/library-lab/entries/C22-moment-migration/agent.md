# C22 Moment 历史迁移工程手册

适用于把已有 Moment 业务逐步迁成明确的日期模型。先分清日历日期、绝对时间点、地区时区和经过时长，再选目标 API。运行版本为 date-fns 4.4.0、@date-fns/tz 1.5.0、Day.js 1.11.23；Moment 2.30.1 仅作固定历史源码依据，不是运行依赖。

迁入文件：`examples/migration.mjs`、同名 `.d.mts` 声明、`example.tsx`、命名空间 CSS。日历日期路径用 Day.js `customParseFormat`/`utc` 和附带 `T00:00:00Z` 的 date-fns 解析作稳定校验载体，最后仍返回字符串。UTC 载体不是业务日期的存储约定。输入合同为 1000–9999 年、完整 YYYY-MM-DD。

绝对时间点只接受含秒和 Z/数值偏移的有效 ISO 输入，函数先拒绝无偏移或溢出日期，再用 `parseISO` 规范化。显示时区只能取声明的三个 IANA/UTC 值；`Intl` 负责显示，不重新解释输入。数值偏移不能代替地区的未来 DST 规则。

周期排程用 `TZDate` 和 `in: tz('America/New_York')`。明天中午用 `addDays`；24小时后用 `addHours`。保持函数返回值，不能沿用忽略不可变结果的写法。插件只在模块初始化注册；不更改全局locale/default zone，不加载BadMutable。

三个独立目标是：严格日历和令牌迁移、时间点/显示地区分离、日历日与实际小时的DST差异。控件数据是fixture，所有解析/加减由真实SDK计算。没有HTTP、保存排程、计时器或订阅；组件离开后只卸载React状态。

验收断言：无效日期被拒绝；两套Next均次日且原值未变；纽约/上海显示变化但ISO不变；回拨两个01:30相差1h；春/秋/普通日的日历小时数为23/25/24而addHours始终24。共享helper在Pacific/Apia进程也需保持日期载体语义。

历史API核查：Moment2.30.1日期溢出是无效；有效toJSON返回ISO、无效返回null；add修改原对象。不要把旧指南的“2月30日会进位”或“JSON泄露内部字段”复制回来。源码来源及摘要见[来源清单](official/source-evidence.json)。

真实限制：本条目不执行Moment、不解析用户输入的任意地区墙上时间、不实现缺口/重叠选择器，不证明SSR hydration、服务端排程、触屏或读屏流程。官方README与官网面板复用宿主，官网仍unknown。具体本地命令和正式收据边界见[local-validation.md](local-validation.md)。


独立集成配方：在现有 React 工程执行 `pnpm add date-fns@4.4.0 @date-fns/tz@1.5.0 dayjs@1.11.23`。四个迁入文件放同目录，保留 CSS import，挂载 `<MomentMigrationExample level="basic" />`（另选 business/advanced）。Vite 工程保留 vite/client 类型与 bundler 模块解析；ESM 默认导入需要 allowSyntheticDefaultImports。Next 客户端边界须加 use client，未在本条目验收 Next 构建。完整路径见 guide 的“把源码迁到项目中”。

不可删初始化：migration.mjs 导入 dayjs/plugin/customParseFormat.js、dayjs/plugin/utc.js 并依次 extend；它们随 dayjs 提供，不是额外 npm 包。不需要 Day.js timezone：IANA 计算用 TZDate/tz，显示用 Intl。运行环境需支持所列 IANA 时区。替代库执行不证明 Moment 2.30.1 执行；官方原文固定提交不能因本地讲解修改而改写。
