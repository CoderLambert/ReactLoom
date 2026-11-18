# D17 Yjs 独立试用与评审

2026-11-18，当前D17-yjs工作树，固定yjs13.6.33。仅写本报告，未修改条目/共享文件、提交或运行全量检查。按根目录索引→library.json→agent.md→全部五个声明源文件→verification→guide检索，并读条目维护规则、local-validation、实际SDK测试及官方证据。沿用本会话已读适用规则与Library Lab quality skill。

## 结论与问题

Spec与运行时实现复核PASS，独立真实消费者PASS。未发现CRDT/所有权实现缺陷。P2官方嵌入状态已修正并独立关闭，质量静态复核PASS；浏览器NOT_RUN。

P2：official/source-evidence.json已保存官网CSP `frame-ancestors https: ionic: capacitor:`，本次独立GET也返回相同限制（HTTP/2 200，最终URL https://docs.yjs.dev/）。当前Lab http://127.0.0.1:4319（以及http://localhost:4319）未被允许；metadata却仍unknown并仅说明未做iframe确认。明确响应限制应标blocked并说明其针对当前HTTP Lab origin，保留直达，不必等待iframe失败才能确认。guide/local-validation同步说明。此结论不泛化为HTTPS宿主也必然禁止。

P2关闭复核（RESOLVED）：仅定向重读主控修正后的library.json、guide.md、local-validation.md。homepage现为blocked，reason引用原始CSP并明确排除上述两个HTTP origin；guide及本地验证记录同步，均保留官网直达。说明与已核实响应一致。无运行时代码改动，未重复SDK测试；不改写先前unknown的历史观察事实。

## 独立真实消费者

根cwd执行Node内联ESM脚本，直接导入实际runtime.ts与同一个Yjs ESM实例，exit0。操作顺序与作者不同：right/right/left/right四次add，再conflict，两份Doc独立且transactions/pending均6；错误scope拒绝后完整inspect快照不变。sync(true)实际逆序投递6条本地事件，四个feed完整收敛、标题只比较相等，不假定赢家；两边真实encodeStateVector字节相同，pending归零。第二次replay为0且快照不变。再add(left)同步时replay1、两边五条；最后产生未传事件后destroy两次，两Doc isDestroyed=true，inspect/add/sync均拒绝。

```json
{"trial":"PASS","dualDocs":true,"transactionsBeforeSync":6,"reverseEvents":6,"convergedFeeds":4,"vectorEquality":true,"emptyReplay":0,"subsequentReplay":1,"scopeUnchanged":true,"bothDestroyed":true}
```

初次消费者通过createRequire定位Yjs导致同进程ESM/CJS双加载警告；改为同SDK的ESM入口重做上述试用后无该警告。最终仅保留依赖的Node localStorage实验提示，exit0。没有复跑作者完整测试。作者真实SDK3与纯信封policy3分列正确；本报告不生成正式收据。

## 六项复核

|要求|结论与证据层级|
|---|---|
|技术准确|PASS，静态+真实SDK：Doc/Map/transact/update/state vector/incremental apply一致，接收origin不回灌本地队列；同键收敛不等于最后墙钟值获胜。|
|解释清楚|PASS，静态：离线RSS独立编辑贯穿Doc/Map/事务/字节、三个操作链、迁移与业务冲突边界，明确不是JSON覆盖。|
|Demo有用|静态PASS，浏览器NOT_RUN：本地事务事件、双端增量、同键/真实依赖乱序/幂等/错scope各有可观察结果。|
|源码可迁移|PASS，静态+runtime消费：runtime.ts/example.tsx/update-transport.mjs/.d.mts完整，demo.tsx仅适配；精确yjs版本、React DOM/Uint8Array/TS bundler前提齐，无Provider/CSS/环境/网络配置。|
|官方来源可靠|PASS；homepage P2已关闭，blocked与响应限制一致。固定9ea3a4fb57b814292ce18dfd13c4f422e44e6c5c/README.md独立上游raw下载与本地原文字节sha256均9837b068bb474af12fc3fa9c0b1759eb7dc1aa3ec8ba89b77eb30d36385b92a9，与metadata一致；来源证据记录固定树无中文README。|
|结果可复核|runtime层PASS，浏览器/正式收据NOT_RUN。独立试用输出在上；作者SDK3/policy3日志与UI共用runtime，未以策略测试冒充SDK。|

## 时序、清理与限制

sync在任何apply前编码并校验双方向量增量；replay读取真实捕获事件，每源倒序投递，随后补齐完整增量并重复。后发的同客户端更新依赖先前时钟，足以构成依赖乱序，而非只反转左右全量消息。空pending不虚构事件；独立试用确认再次replay计数0。

destroy先off自己注册的两个update listener并清pending，再销毁自有双Doc，幂等；runtime操作有ensureAlive。UI effect先断开ref再destroy，重新挂载创建新runtime，不借用外部房间Doc。pending清理与listener解除由静态源码确认，双Doc销毁/操作拒绝由真实执行确认，不把销毁后的inspect用于证明内部队列状态。

信封format/scope/1–64KiB检查为自建应用边界，不解码、不授权、不提供损坏字节双Doc原子回滚。runtime暴露Doc便于学习，正常消费应通过API保留队列/清理约束。文档不承诺provider、Awareness、网络可靠性、持久化、撤销或生产授权；生产服务/配额/房间ACL需另设计，不把origin当身份。

主控剩余：执行限定示例region的真实浏览器操作与卸载重挂载。正式SDK/build/browser收据仍按项目机制独立记录。本次delta复核后停止写入。
