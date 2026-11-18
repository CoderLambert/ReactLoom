# D19 Fuse.js 独立试用与评审

2026-11-18，当前D19-fusejs工作树。仅写本报告，不改条目或共享文件，不运行全套SDK、浏览器、生成/构建/typecheck。按根LIBRARY_CATALOG检索D19，再读metadata/agent/全部八个sourceFiles/verification/guide、条目规则、local-validation和official证据，沿用适用质量skill。

## 结论与实质问题

真实消费者功能试用PASS，评分、范围与索引生命周期未发现实现缺陷。Spec功能与质量静态复核PASS；P1许可证错误已修正并独立关闭，初始发现证据保留；浏览器NOT_RUN。

P1：metadata的MIT与guide、agent、local-validation的MIT断言不符合实际固定版本。安装包 `packages/library-lab/node_modules/fuse.js/package.json` 显示version7.5.0、license Apache-2.0，随包LICENSE正文为Apache License2.0。独立读取固定官方commit45bac9fe2e71fe8c680c861a35a8b226c4ae6d5a/package.json也为Apache-2.0，该commit/LICENSE同样Apache2。请将license.spdx及三份说明改为Apache-2.0，撤销“MIT已纠正/核对”的错误结论并保留本次真实依据。无需修改运行时代码或重跑SDK。

直接依据：[固定package.json](https://github.com/krisk/Fuse/blob/45bac9fe2e71fe8c680c861a35a8b226c4ae6d5a/package.json)、[固定LICENSE](https://github.com/krisk/Fuse/blob/45bac9fe2e71fe8c680c861a35a8b226c4ae6d5a/LICENSE)。本地绝对路径为 `/home/lambert/githubRepos/lambert/ReactLoom/packages/library-lab/node_modules/fuse.js/package.json`，原始字段 `"version": "7.5.0"`、`"license": "Apache-2.0"`；上游原始字段同为 `"license": "Apache-2.0"`，许可证标题 `Apache License / Version 2.0, January 2004`。上述读取exit0；未执行上游README指令。

P1关闭delta（RESOLVED）：定向重读主控修正的library.json、guide.md、agent.md、local-validation.md，前三处已一致为Apache-2.0；本地验证明确保留作者初次误判MIT及独立package/LICENSE纠正经过，不再将误判当有效核验。与上列实际安装包及固定上游证据一致。无运行时改动，未重跑SDK。

## 独立消费者与原始输出

cwd `/home/lambert/githubRepos/lambert/ReactLoom`，`node --input-type=module`内联脚本，exit0。仅导入实际article-index.mjs、search-scope.mjs、index-lifecycle.mjs。新fixture为title命中quasar与summary命中quasar两条技术文档，另加24条商业quasar干扰项。

business显式传入隐藏阈值.55后effectiveThreshold仍.35；先visibleDocuments再构建真实Fuse、limit1，得到技术title行。两条受控技术行title score小于summary score，符合权重与低分更好。通过稳定id=title替换全部可搜索字段为pulsar/changed/new，新数组不修改旧文档；threshold0重建后旧quasar不再命中title，新pulsar命中。remove后pulsar为空，upsert恢复后原id再次命中。normalizeQuery验证NFC合成café、去NUL和trim，以及83个emoji按80码点截断。

```json
{"trial":"PASS","ranked":["title","body"],"lowerScoreWins":true,"scopeBeforeLimit":"title","stableId":"title","oldTokenRemoved":true,"deleteRestore":true,"NFC":"café","codePointLimit":80}
```

未重复作者9项SDK或8项策略；独立试用包含真实Fuse调用，纯normalize/scope/lifecycle断言不额外计为SDK测试数量。作者SDK9/policy8分计保持，不转换为正式receipt。

## 六项复核

|维度|状态与依据|
|---|---|
|技术准确|PASS，功能模型与许可文字delta复核，P1已关闭。低分更相似、title.65/summary.25/tags.1、阈值与ignoreLocation均对应实际模块；NFC/80码点明确为自建policy。|
|解释清楚|PASS，静态：小集合选择、字段权重/分数、三操作链、完整迁入和schema/性能/授权边界；许可段已修正。|
|Demo有用|静态与模型PASS，浏览器NOT_RUN：错拼/真实分数、分组与提交、同ID新增替换删除恢复各有不同目标。|
|源码可迁移|PASS，静态+真实模块消费：三个.mjs及各.d.mts全量sourceFiles，UI无Lab私有依赖，精确安装命令/ReactTSX前提/无Provider环境明确。应显式采用支持.mjs/.d.mts的TS解析；文章/tags浅复制限制已交代。|
|官方来源可靠|PASS，README原字节与许可均已核实，P1关闭。固定krisk/Fuse commit README上游raw与本地SHA256均ddeea10c54ccf1d6d21bcc31f89ca305db4b50c3197f3cd105dbb7b0c01ef72d，与metadata一致；无中文README记录合理。homepage保存响应无明确frame限制，unknown不冒称允许。|
|结果可复核|模型层PASS，浏览器/正式收据NOT_RUN；作者原始命令/日志与本报告消费者输出分开，不把策略套件计为SDK。|

## IME、生命周期与安全范围

UI在compositionstart/end期间通过ref拒绝表单提交，query仅提交推进，展示React文本节点不注入HTML；真实IME尚需主控浏览器及人工流程，静态检查不能宣称所有平台选字Enter通过。normalizeQuery实际清除U+0000–001F与U+007F，然后trim/NFC/码点限80；它不是通用Unicode安全净化或任意控制字符清洗，应保持这一边界。

resolveScope使basic固定全部/.35，business丢弃隐藏阈值；分类在索引与limit之前。分类不是授权，可信服务必须先决定进入浏览器的数据。upsert校验稳定唯一非空ID、替换完整对象，删除后重建；真实受控UI已移除替换对象summary/tags里的React旧词。调用方不能原地修改共用tags数组，生产JSON需schema及错误UI。组件无timer、监听、网络或持久化，局部索引/state随卸载释放，未宣称额外资源清理。

剩余：主控执行真实浏览器/IME/恢复。许可及证据delta复核完成，停止写入。
