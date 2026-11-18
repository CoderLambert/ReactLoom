# 2026-11-18 主控闭环补充

六项本地质量PASS。真实SDK4+策略2及非作者不同fixture consumer通过；浏览器3项覆盖basic评分、business空查询分类、advanced prefix/fuzzy/建议/重建/IME/重挂与官方来源。候选27及独立试用证据见[逐库结果](../../../../openspec/roadmaps/upgrade-library-quality/results/D20.md)。正式收据仍NOT_RUN。下文为作者停写检查点，原浏览器/共享检查待办已由本补充关闭，初始失败仍保留。

# D20 本地验证（2026-11-18）

STABLE：作者仅修改D20目录，停止写入等待独立复核与主控浏览器。minisearch7.2.0；没有提交/推送/共享生成或依赖改动，正式verification三项保持NOT_RUN。

|六项|状态与层级|证据|
|---|---|---|
|技术准确|PASS：真实SDK+静态|UI/tests共用runtime.mjs，实际score标题boost对照、prefix/fuzzy开关、scoped索引与autoSuggest、替换重建和默认中文分词限制；已安装package与固定LICENSE.txt均MIT|
|解释清楚|PASS：静态|guide以RSS全文需求讲选型、fields/storeFields/boost、倒排/分数、三操作链、迁移和授权/中文边界|
|Demo有用|NOT_RUN：浏览器待主控|三目标全文评分、分类与提交、容错建议与动态更新；浏览器提案覆盖真实建议/结果同范围、旧token消失、新token出现、IME与重挂载|
|源码可迁移|PASS：静态+模型执行|example.tsx、runtime.mjs/.d.mts、scope-policy.mjs/.d.mts全部声明；guide列精确依赖/React/TS bundler，无环境/服务/CSS插件/Provider，索引局部引用卸载释放|
|官方来源可靠|PASS：固定原文+实际HTTP|lucaong/minisearch v7.2.0 annotated tag解析固定commit3d239d1c3ae7aef1bf5d8945dd7b5f0709f646f5；固定tree无中文README，保留英文en原字节和SHA；GET无明确frame限制但未浏览器确认因此unknown|
|结果可复核|NOT_RUN：浏览器未执行|SDK4/policy2原始日志分别保存，Biome日志保存；构建/浏览器与独立消费者待主控，不冒充formal receipt|

cwd `/home/lambert/githubRepos/lambert/ReactLoom`，实际命令与退出码：

- `node --test packages/library-lab/entries/D20-minisearch/tests/sdk.test.mjs` exit0，4 actual SDK tests PASS，validation/sdk.log。先开发运行一次，格式完成后最终运行并保存；不另造测试索引函数。
- `node --test packages/library-lab/entries/D20-minisearch/tests/scope-policy.test.mjs` exit0，2 policy tests PASS，validation/policy.log；与真实SDK数量分列，策略逻辑未改。
- `pnpm --filter @reactloom/library-lab exec biome check --write entries/D20-minisearch/examples entries/D20-minisearch/tests entries/D20-minisearch/validation/browser.spec.ts entries/D20-minisearch/library.json entries/D20-minisearch/official/source-evidence.json` exit0，validation/biome.log，11文件格式化。最终metadata补充后只对metadata定向检查，见validation/metadata-biome.log。
- `git diff --check -- packages/library-lab/entries/D20-minisearch` exit0。
- 官方下载通过Python urllib保存原字节并记录SHA/响应；固定LICENSE.txt与安装包license核对MIT。未发现官方中文README，不将中文讲解冒充官方翻译。homepage保留unknown，并非GET200等于允许嵌入。
- 额外真实模型观察：Reakt返回ids1/3/6；Nod产生node建议，支持浏览器提案测试数据。未生成性能/字节性能指标。

共享typecheck/build/browser NOT_RUN，由主控稳定候选后执行；validation/browser.spec.ts只提供提案，未写共享e2e。真实IME须人工验收，合成composition/229不证明实际输入法。

独立复核重点：真实UI导入runtime与新类型文件全量声明；旧Suspense→新Streaming无残留；相关分数方向及Chinese默认tokenizer边界；建议与search同scope且分类不是ACL；官网unknown与原文pin/hash。
