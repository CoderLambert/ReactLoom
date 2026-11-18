# C19 candidate21 修后可编译/官方齐检查点

Owner quality_e05，实际根cwd，Git HEAD1218066e706a90ba03fac8dff8c9b843dd2429c4。UTC `2026-11-10T18:22:01.268693+00:00` root请求冻结；原子记录结束后停止全部C19源码/中文/metadata/提案/log写入，无HTTP/后台。未修改公共router/依赖/锁/e2e/队列。

旧candidate20的三真实case首次写URL均污染为q/page后缀?tab=docs，原始FAIL保留根candidate-20/browser.txt与artifacts，未改原断言。实际nuqs2.10.1内置adapter把含查询URL传to，与ReactRouter1.170.42/Core1.171.35的路径接口不符；root公开memory probe给出href方案与字符串search被JSON加引号的差异。只读诊断不是新的SDK/浏览器PASS。

新增tanstack-adapter.tsx，现共8声明sourceFiles：真实公共Router状态读取，按watchKeys展开数组给nuqs，公开unstable_createAdapterProvider接SDK；写完整href，保hash/state/replace/resetScroll，透传公开defaultOptions/processUrlSearchParams。外层真实内置NuqsAdapter仅提供原HistorySpy/BackForwardGO resetQueues与unsubscribe；不私有导入context/queue。unstable_AdapterContext仅是type，初次错误已原日志保留后改为公开Router读端。字段替换/结构分享的中间类型错误也保留，最终adapter-types-resolved.txt strict0/adapter-format-resolved.txt0；7旧源中example改导入/显示Router观察，其余共享合同/policy无语义变化。

Router将host=a&host=b规范化为JSON数组编码，逻辑数组/顺序保留，不保证原始query字节。实际adapter-boundary-probe公开memory模型exit0原读数保留，不当真实DOM。提案原三个业务断言全部保留，仅advanced增加独立host_multi=a/b与#anchor观测，保持host_probe=kept等原断言；proposal-types-adapter.txt0，格式0。

现guide/agent已中文重写，官方metadata已齐：npm2.10.1 gitHead691a473226bba0ddb93bc3a1010c8fa4e777c45f，源manifest实际0.0.0-semantically-released保留；无目标包/中文README回退根英文31845B/SHAde5eb7cbf51d0a8c0eecd79146a7e61e6dadfbd0132f3f26a73f91fa569d66eb，与安装原文一致。5真实GET/rawHeaders、官网unknown；成功全暂存/失败独立工具受控3PASS，不重复HTTP。

SDK6/policy6继续有效未重跑，不用它们证明适配器。当前源码/提案strict0，root需新匹配构建真实3case重验；官方字段可一并展示验收。formal sdk/build/browser均NOT_RUN，不假称旧3FAIL已经浏览器修复。

18当前内容输入在checkpoint21-inputs.json；旧candidate20/handoff/checkpoint-inputs保留历史。尚未整库FINAL：最终安装源码审计扩充/metadata脚本/命令日志摘要/六项local-validation与FINAL仍待release，guide与官方已经有新输入。release后不再机械重跑SDK6/policy6/HTTP或有效类型，若新browser失败只定向处理。

**CHECKPOINT21 STABLE：`2026-11-10T18:22:01.268693+00:00`，原子操作完成后停止全部C19写入，无活动后台。**
