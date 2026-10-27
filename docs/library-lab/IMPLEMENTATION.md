# Library Lab 实施状态

事实源：`COORDINATION.md`、`REPAIR.md`、`progress/PLATFORM.md`、实际集成分支与执行证据。用户已批准 v2 和本次审核整改，无需逐小步确认。独立私有包 `packages/library-lab`；主 Issue #4、PR #8（Draft）；不改 main、PR #3 和已有模板。

## 当前验收状态

|范围|代码状态|运行验收|
|---|---|---|
|119 条目身份与原始材料区分|既有索引保留，E11/F05 缺原件不造恢复记录|本次未逐库重审117份原文|
|四 Tab、按需目录/详情、Agent检索|既有实现保留|完整生产预览未通过|
|原文/源码发布、摘要、安全链接|本次修复 HTML 文本传输与缺失类型导出|生成器/纯逻辑回归通过；实际 UI 未跑|
|索引与证据门禁|检查已提交 HEAD；实际收据/日志与公共输入绑定|合成 Git/收据正反例通过；没有新增 SDK PASS|
|React/Worker/Node 宿主|既有代码保留|首批风险条目仍待真实运行|
|F11 隔离浏览器演示|本次新增独立端口、唯一 scope、显式启停、受限消息和真实请求断言|Node 协议/HTTP资产测试通过；真实 MSW/Chromium 未跑|
|增量 CI|文档跳过重型运行、条目定向 SDK/browser、公共变化全包；frozen验收与候选lock分离|GitHub实际 Runner与registry阻塞未解除|
|完整六风险切片/119库SDK/发布回归|未完成|不得关闭 LL06/LL08/LL10|

## 下一验收关口

1. 可执行环境中的真实依赖解析、根 lock 审查、干净 frozen install、完整类型与生产构建。
2. A01 ECharts、B17 Floating UI、C01 RHF、D03 p-limit、E05 Monaco、F11 MSW 完整操作/退出清理/源码复用闭环。
3. 再按库逐批扩大 SDK/browser 验证，补齐缺少的专用套件；不继续以 PR 数或策略单测数代替可用程度。

启动及证据命令见 [整改说明](REPAIR.md)。历史实施日志原样保存在 [整改前实施记录](archive/IMPLEMENTATION-before-repair.md)，不再把每轮重复记录追加到当前实施计划。
