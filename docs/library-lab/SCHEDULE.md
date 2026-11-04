# Library Lab 有限连续开发调度

4个新的任务已通过任务接口成功创建并启用；不是仅写计划。每个任务每小时运行一次，分配不同分钟槽以减少共享资源竞争；flexible_schedule 允许调度浮动，不保证精确开始时间或真正同时执行。每条最多24次，不影响既有其他自动化。

|任务|职责|周期|进度入口|
|---|---|---|---|
|Library Lab AB 开发|A17+B22，图表/画布/地图/组件/动画/交互|每小时，05分槽|Issue #5 / progress/AB.md|
|Library Lab CD 开发|C22+D21，表单/数据/日期/请求/状态/工具|每小时，10分槽|Issue #6 / progress/CD.md|
|Library Lab EF 开发|E19+F18，编辑/多媒体/文件/工程|每小时，15分槽|Issue #7 / progress/EF.md|
|Library Lab 集成开发|公共平台、依赖/锁文件、CI、worker PR集成|每小时，40分槽|Issue #4 / progress/PLATFORM.md|

worker从GitHub恢复状态，按授权目录写入独立分支，PR base为feat/library-lab。平台为公共文件唯一owner。每轮尽可能连续完成一批完整条目，不在一个小修复后停止；实际执行受工具与资源上限约束，不承诺无限后台执行。已完成的事项不得重复做。

用户只在实际批次、可运行里程碑或需要外部权限时收到汇报；无变化不反复通知。任务进度和测试事实放GitHub，不依赖Slack。

## 历史环境阻塞（2026-10；不是当前 main）

下面两段是调度刚启动时的记录。不要把它读成 2026-11-04 的 main。

当时容器里 registry.npmjs.org / GitHub 下载域名 DNS 失败，GitHub 连接器仍可读取和提交代码。首个 GitHub Actions PR 运行 40373203132 的 catalogue 和 runtime-bootstrap 均在分配 Runner 前失败：runner_id=0，steps=[]。job 日志接口返回 BlobNotFound 404。已知事实不足以判断是否额度、账单或组织策略。那次失败没有执行构建。

随后 PR #8 合并，根锁文件已有 Lab importer。Actions run 41779873259 在 #8 的树上通过了冻结安装、typecheck、生产构建、52 个 SDK 文件（153 项）和 45 项 Playwright。#97 与 #98 把手册和首页计数放上 main（`fea74cf`）。这些都不是 119 条逐库收据，`docs/library-lab/evidence/runs/` 仍然没有收据目录。当前缺口是 `verify:record`，不是「有环境后再补锁文件」。

## 停止条件

各分组范围完整交付后停用对应任务，最终平台验收后停止其余Lab任务。24轮上限到达时列清楚真实完成/剩余/阻塞，不能自动宣称119库完成。除这4条Lab开发任务外，不修改其他定时任务。
