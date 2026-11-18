# 2026-11-18 主控闭环补充

六项本地质量PASS。真实SDK4项+策略1项通过；独立Ky consumer通过；浏览器2项覆盖三层场景与官方原文/blocked降级。候选24及独立试用证据见[逐库结果](../../../../openspec/roadmaps/upgrade-library-quality/results/D08.md)。正式收据仍NOT_RUN。下文为作者停写检查点，原浏览器/共享检查待办已由本补充关闭，初始失败仍保留。

# D08 本地验证 · 2026-11-18

输入为当前未提交工作区，仅拥有 D08-ky 目录。无提交、推送、发布；无 generate/build/全量 typecheck。正式 sdk/build/browser 仍 NOT_RUN，不能将本报告转为 receipt。

|维度|状态与证据层级|依据|
|---|---|---|
|技术准确|PASS：固定版本类型+真实 SDK|ky 2.2.0 distribution/types/options.d.ts 的 timeout/totalTimeout/maxResponseSize/prefix；SDK4项实际执行，UI共用transport|
|解释清楚|PASS：静态内容复核|guide 先说明来源搜索与选型，分清 Request/Response、React ticket、业务validateSources、fixture；最小接入与完整文件齐备|
|Demo有用|NOT_RUN：浏览器待主控|三目标为GET、取消竞态/IME、协议恢复边界；新增30ms超时与200成功却schema拒绝；Node不能证明React交互|
|源码可迁移|PASS：静态+共享模块执行|example.tsx/transport.mjs/transport.d.mts，guide写依赖/模块配置/替换fixture及cleanup；无内部宿主依赖|
|官方来源可靠|PASS：实际HTTP+原文摘要|official/readme.md固定3541888878c4d303a8bc2ad61815f4e048f55a5d；根目录无中文README；官网为仓库，响应头禁止嵌入，source-evidence.json保存依据|
|结果可复核|NOT_RUN：浏览器待主控|SDK4/4及独立policy1/1日志存在；validation/browser.spec.ts待候选生成与真实浏览器执行，独立内容复核也待主控|

实际 cwd `/home/lambert/githubRepos/lambert/ReactLoom`，Node v26.13.1：

- `node --test packages/library-lab/entries/D08-ky/tests/sdk.test.mjs` exit 0；4 tests PASS，validation/sdk.log。原有两项真实Ky测试保留，新增UI共用transport两项：3来源/fast单行、每次重置重试两次、POST仅一次、外站拒绝、超时、取消、100B上限、自建校验及204。
- `node --test packages/library-lab/entries/D08-ky/tests/policy.test.mjs` exit 0；1 test PASS，validation/policy.log。纯自建schema策略，与SDK分开。
- `pnpm --filter @reactloom/library-lab exec biome check --write --unsafe entries/D08-ky/examples entries/D08-ky/tests entries/D08-ky/library.json entries/D08-ky/official/source-evidence.json` exit 0；validation/biome.log。额外 browser/verification格式检查 exit0，validation/browser-biome.log。
- `git diff --check -- packages/library-lab/entries/D08-ky` exit 0。

实际观察：SDK输出四项成功；断言GET初始3行、fast仅frontend、两次独立重试均attempts=2、POST409计数1、30ms超时判定isTimeoutError、取消AbortError、100B上限isResponseSizeError、业务拒绝javascript:、DELETE204。文档中的浏览器可见句子仍为预期操作结果，等主控浏览器日志确认。

浏览器提案包括三层、IME start/end、空结果、slow→fast差异结果、显式取消、重试两轮、六个进阶按钮、停止重挂载。fixture没有真实HTTP、CORS、Cookie、OAuth、服务端幂等或Retry-After证据；不扩大结论。

首次抽取共享模块曾残留TS Map泛型导致语法错误，已修为标准JS，随后以上命令全部成功。此缺陷没有通过绕过测试隐藏。README保留上游原文，未执行其内容。
