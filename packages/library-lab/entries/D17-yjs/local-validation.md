# 2026-11-18 主控闭环补充

六项本地质量PASS。真实SDK3项+策略3项及非作者新双Doc试用通过；浏览器4项通过，覆盖事务、双端离线编辑、5事件逆序/错误scope/重挂和官方来源。候选26及独立试用证据见[逐库结果](../../../../openspec/roadmaps/upgrade-library-quality/results/D17.md)。正式收据仍NOT_RUN。下文为作者停写检查点，原浏览器/共享检查待办已由本补充关闭，初始失败仍保留。

# D17 本地验证（2026-11-18）

固定 yjs@13.6.33；原文 README ref `9ea3a4fb57b814292ce18dfd13c4f422e44e6c5c`。仅本条目改动，无网络协作、持久化或生产服务。正式 sdk/build/browser 收据仍 NOT_RUN，未提交/推送/发布。

|六项|状态与层级|依据|
|---|---|---|
|技术准确|PASS：真实 SDK + 静态资料|SDK 直接导入 UI runtime.ts，真实 Y.Doc/Y.Map/transact/state vectors/applyUpdate，检查并发收敛/逆序/重放/destroy；匹配版本固定原文和官方 API|
|解释清楚|PASS：静态内容复核|guide 以离线 RSS 编辑问题解释选型、Doc/Map/事务/增量、最短接入、三操作链和业务冲突边界|
|Demo 有用|NOT_RUN：浏览器待主控|本地事务事件、双端独立增量合并、同键收敛/依赖逆序/重复/错scope是独立目标；validation/browser.spec.ts 提供实际交互验收|
|源码可迁移|PASS：静态 + runtime 执行|完整 runtime.ts/example.tsx/update-transport.mjs/.d.mts，guide 列明 React/TS/yjs/Uint8Array，无样式插件/环境变量/provider服务；自有Doc/listener/队列清理|
|官方来源可靠|PASS：固定原文字节 + 实际HTTP|官方 yjs/yjs v13.6.33 README.md；固定tree仅一个README无中文；official/source-evidence.json 保存commit/候选/最终URL/GET/headers；独立复核确认 CSP 排除当前 HTTP Lab origin，官网 iframe blocked|
|结果可复核|NOT_RUN：浏览器未运行|SDK与策略原始日志分开，格式日志已保存；浏览器/构建/独立试用由主控候选屏障后执行|

cwd `/home/lambert/githubRepos/lambert/ReactLoom`：

- `node --test packages/library-lab/entries/D17-yjs/tests/sdk.test.mjs` exit 0，3 actual SDK tests PASS，原始 validation/sdk.log。直接加载 UI 的 runtime.ts，Node26.13.1 原生剥离类型。日志保留 Yjs 依赖对 Node localStorage 的实验提示，不影响测试退出码。
- `node --test packages/library-lab/entries/D17-yjs/tests/update-transport.test.mjs` exit 0，3 policy tests PASS，原始 validation/policy.log；纯信封检查不计 SDK 数。
- `pnpm --filter @reactloom/library-lab exec biome check --write entries/D17-yjs/examples entries/D17-yjs/tests entries/D17-yjs/validation/browser.spec.ts entries/D17-yjs/library.json entries/D17-yjs/official/source-evidence.json` exit 0，validation/biome.log。
- `git diff --check -- packages/library-lab/entries/D17-yjs` exit 0。
- 共享 typecheck/build/browser NOT_RUN，留主控冻结候选执行。浏览器提案每项定位示例 region，避开源码查看器同文本；覆盖独立输出、真实逆序5事件、错误scope不变、卸载再挂载为空种子。

保留已有 envelope 64KiB/租户/文档/format 检查；它不是授权或 CRDT 解码器。新逆序路径实际重放捕获的本地事件，而非把“左右Doc接收先后”冒称依赖乱序。事务数记录调用，pending记录真实update事件，不作为业务版本。无正式匹配收据时不能把本地记录复制成 verification.json PASS。
