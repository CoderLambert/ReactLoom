# Library Lab 实施状态

事实源：`COORDINATION.md`、`REPAIR.md`、`progress/PLATFORM.md`，以及 main 上的锁文件和 Actions 记录。独立私有包 `packages/library-lab`。PR #8 已合并。不要把 Lab 放进已有模板。

## 当前验收状态

|范围|代码状态|运行验收|
|---|---|---|
|119 条目身份与原始材料区分|既有索引保留，E11/F05 缺原件不造恢复记录|本次未逐库重审117份原文|
|四 Tab、按需目录/详情、Agent检索|既有实现保留|仓库级生产构建已在 Actions 41779873259 通过；逐库 UI 收据仍缺|
|原文/源码发布、摘要、安全链接|HTML 文本传输与类型导出已在合并树中|生成器约束仍在；这不是逐库浏览器收据|
|索引与证据门禁|PASS 必须绑定当前收据和日志|没有新增 SDK PASS；evidence/runs 仍空|
|React/Worker/Node 宿主|106 个库可挂载 React，12 个仅 Node 命令，C13 走独立画面，worker 工厂目前没有条目|挂载不等于 PASS|
|F11 隔离浏览器演示|独立端口、唯一 scope、显式启停已在树里；`msw@3.0.3` 在锁文件中|`@F11` 曾在上述 Actions 中执行；没有逐库收据，状态保持 NOT_RUN|
|增量 CI|文档与代码分流；frozen 验收与候选 lock 分离|run 41779873259 的 catalogue 与 runtime 已通过；lock-candidate 因锁已就绪而跳过|
|完整六风险切片/119库SDK/发布回归|源码和指南在|不得把 52 个 SDK 文件或 45 项 Playwright 写成 119 条 PASS|

## 下一验收关口

1. 用 `verify:record` 为已经有套件的条目写下收据。不要从 Actions 日志批量生成 PASS。
2. A01、B17、C01、D03、E05、F11 仍是优先对象：前五个里 A01/B17/C01/D03/F11 有 Node 套件，E05 的浏览器证据应来自 `@E05`，而不是整份 Playwright 退出码。
3. 再补没有专用套件的库。A02–A17 和大部分 B 组没有 Node SDK 文件。策略单测不能代替。

启动及证据命令见 [整改说明](REPAIR.md)。历史实施日志原样保存在 [整改前实施记录](archive/IMPLEMENTATION-before-repair.md)，不再把每轮重复记录追加到当前实施计划。
