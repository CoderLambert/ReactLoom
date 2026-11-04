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

## 当前环境阻塞（需按事实接续）

容器 registry.npmjs.org/GitHub 下载域名DNS失败，GitHub连接器仍可读取和提交代码。首个GitHub Actions PR运行40373203132的catalogue和runtime-bootstrap均在分配Runner前失败：runner_id=0，steps=[]。job日志接口返回BlobNotFound404。已知事实不足以判断是否额度/账单/组织策略，不得把猜测当根因，也不得说构建执行过。

平台任务应检查是否有新的可用Runner证据再重试，不修改支付/组织安全设置，不循环重跑同一无Runner工作流。若仍不可执行，保留BLOCKED并继续代码、文档、源文件检查和其他可独立开发；有可运行环境后补锁文件和正式构建。

## 停止条件

各分组范围完整交付后停用对应任务，最终平台验收后停止其余Lab任务。24轮上限到达时列清楚真实完成/剩余/阻塞，不能自动宣称119库完成。除这4条Lab开发任务外，不修改其他定时任务。
