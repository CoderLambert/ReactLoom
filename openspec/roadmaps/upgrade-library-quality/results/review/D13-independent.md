# D13 RTK Query 独立试用与评审

2026-11-18，当前工作树 D13-rtk-query；固定 @reduxjs/toolkit 2.13.0、react-redux 9.3.0。仅写本报告，未改条目/共享文件，未提交、未运行生成/全量检查或重复作者三项测试。按 LIBRARY_CATALOG.md → metadata → agent → 全部三个声明源文件 → verification → guide 检索，并核对条目维护规则、local-validation、实际 tests 与官方证据。遵循本会话已读 Library Lab quality skill 及适用规则。

## 结论与发现

真实 runtime 的独立消费者试用 PASS；API/store 接线、缓存隔离和请求清理未发现实质实现缺陷。Spec 与质量静态复核 PASS；发现的 P2 文案已由主控修正并独立复核，浏览器与六项完整运行验收 NOT_RUN，等待主控。

P2（RESOLVED）：原 guide 将700ms描述为仅下一请求，agent遗漏默认200ms。主控已改guide/agent为默认200ms、按钮使当前runtime全部后续请求使用700ms、重挂载恢复默认。本次定向重读两份文档确认一致于setDelay持久闭包实现，无运行时代码改动，无需重跑SDK。

## 独立真实消费者

仓库根执行 `node --input-type=module` 内联脚本，直接 import examples/runtime.ts 的 createDemoRuntime（Node 原生类型剥离），exit 0。使用作者全列表测试以外的参数 `{tenant:'team-a',search:'前端'}` 与 `{tenant:'team-b',search:'安全'}`。

两个内容相同的新参数对象发起同租户搜索订阅，另建 team-b 搜索订阅；真实 reads 分别仅 1 次，team-a 返回 frontend。成功切换 frontend 后等待真实 running queries，只有 team-a reads 增至 2、paused 为 true；team-b 的 conflict 返回409且 reads 不变。再延迟发起 frontend mutation，立即 clear，等待 settle 后 active=0、queries=[]；重新查询时 paused 仍为先前 true，证明被取消的第二次 mutation 没有改回 fixture。最后 unsubscribe 全部消费者并 dispose。输出：

```json
{"trial":"PASS","sameArgReads":1,"tenantReadsAfterMutation":{"team-a":2,"team-b":1},"filteredId":"frontend","conflict":409,"abortedMutationPreservesFixture":true,"clearQueries":0}
```

试用只证明 runtime 模型，不证明 React currentData/输入法/浏览器生命周期，也不是正式 SDK 收据。作者3项均直接导入同一个 runtime，实际 SDK3、policy0 分类正确。

## 六项复核

|要求|状态与依据|
|---|---|
|技术准确|PASS，模型/API与更正文案复核。真实 createApi、configureStore 的 reducerPath/reducer/middleware、生成 hooks 对应源码。独立实际执行同参数共享与租户标签失效。|
|解释清楚|PASS，静态：从已有Redux的选型讲 endpoint→baseQuery→store/middleware→Provider→hook，区分 data/currentData、缓存隔离与授权；延迟文字已修。|
|Demo有用|静态 PASS，浏览器 NOT_RUN：同参数双订阅、租户/搜索隔离、成功失效与409/取消各有独立输入/操作/计数与行结果。|
|源码可迁移|PASS，静态+runtime执行：runtime.ts/example.tsx 两个必要文件齐全，demo.tsx仅适配；列明精确依赖、React DOM/现代AbortSignal/DOMException/TS bundler前提、无额外样式/环境/后端；内部Provider完整。|
|官方来源可靠|PASS，固定原文与HTTP字节复核：Toolkit包官方 README，固定commit 370f7eb6403bdfdb1a2ab5b90fbcfd8eaee7d57b/packages/toolkit/README.md。独立下载上游raw与本地snapshot均为ad9190021870ba6d98c4c53436d3518eaafa01ae68bfbcb21c78c08255d22fae，与metadata一致。source-evidence记录固定树无中文package README；homepage响应200仍保留unknown，没有冒称iframe可用。|
|结果可复核|runtime层 PASS，整条目 NOT_RUN：本报告真实输出与作者原始SDK/格式日志可核对；浏览器提案待主控执行，正式verification三项NOT_RUN保留。|

## 所有权与迁移细节

API/store每次示例挂载创建一次，Provider仅包裹使用生成hooks的面板。默认序列化同时包含tenant/search，不用另造字符串键；标签id带tenant，result为真才失效，404/409不失效。currentData加tenant/search key重挂载阻止旧参数行与mutation提示串入新面板；这是静态设计确认，实际切换仍需浏览器证明。

runtime.clear/dispose枚举并abort全部running queries/mutations，然后只reset私有API；成功/取消两条wait路径都移除listener，取消清timer。组件useSyncExternalStore负责store订阅解绑；面板卸载递增epoch并abort自己的mutation，新change先abort旧request，成功/catch/finally均受epoch约束，不让旧结果覆盖新提示/引用。取消后fixture不写入已通过独立试用。clear不复原fixture，重建runtime才复原，文档明确区分；共享生产store不能随一个页面卸载整体dispose。

生产迁移要求替换内存baseQuery并保留signal、错误/参数/标签模型、网络边界校验；tenant并非鉴权，abort不保证真实服务未提交，未提供轮询/setupListeners/ETag/乐观补丁。未调用本repo API client是独立Library Lab fixture边界，不是应用HTTP实现。

主控剩余：执行真实浏览器双订阅、切换/currentData、成功刷新/409、慢mutation取消、清空与卸载重挂载；真实输入法另行人工确认。浏览器结果和正式收据不可由本报告推定。
