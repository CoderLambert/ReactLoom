# 2026-11-18 主控闭环补充

六项本地质量PASS。真实SDK3项+独立策略4项通过；非作者复制五文件React编译与新Store consumer通过；浏览器3项覆盖派生/写入、A会话重建保持B及官方来源。候选25及独立试用证据见[逐库结果](../../../../openspec/roadmaps/upgrade-library-quality/results/D11.md)。正式收据仍NOT_RUN。下文为作者停写检查点，原浏览器/共享检查待办已由本补充关闭，初始失败仍保留。

# D11 Jotai 本地质量复核（2026-11-18）

基线：独占 D11 条目目录，Jotai 3.0.1；保留现有稳定 ID fail-closed 规则和 keyed TenantWorkspace 会话重建。不修改依赖、公共生成、正式收据、其他条目。

|维度|状态/证据层级|结果|
|---|---|---|
|技术准确|PASS：静态 + 真实 SDK|实际包 atom.d.ts、Provider.js 确认配置/Store 与 Provider 行为；实际原子抽到 workspace-atoms.mjs，由 UI/SDK 同时导入。修正文案中 basic 不订阅故事、useMemo 无法稳定配置、Suspense 必须在 Provider 内等过度断言。|
|解释清楚|PASS：静态|guide 说明选择条件、原子配置/Store 值、读派生/写 atom、完整迁入代码与 business→双会话操作。|
|Demo 有用|NOT_RUN：浏览器待验|三独立目标保留：count/double、稳定 ID 已读/未读、A 重建而 B 保留。validation/browser.spec.ts 提供真实 UI 断言，尚未执行。|
|源码可迁移|PASS：静态|example.tsx + workspace-atoms.mjs/.d.mts + story-policy.mjs/.d.mts，三个 sourceFiles 全列齐；agent 说明安装、React/TS、声明文件、错误与释放订阅。无 Lab 内部依赖。|
|官方来源可靠|PASS：原文与元数据|固定 v3.0.1 commit6abd0ae3365e02ab432fba4b6e8e6f00aafbf508；官方完整递归树无中文 README，保存根 README 原文；actual validateOfficialSources 与 SHA256 均通过。官网 GET200 无限制头但未浏览器确认，明确 unknown。|
|结果可复核|NOT_RUN：集成/浏览器待验|真实 SDK3/3、策略4/4、定向格式与官方元数据通过；build/typecheck/browser 未跑，正式 receipt NOT_RUN。|

## 实际命令与原始日志

cwd `/home/lambert/githubRepos/lambert/ReactLoom`。

- `node --test packages/library-lab/entries/D11-jotai/tests/sdk.test.mjs`，exit0，`validation/sdk.log`：3/3。直接导入 UI 使用的 workspace-atoms.mjs，检查派生订阅/取消订阅、按 ID 写入/不可变快照/未知 ID、兄弟与新会话 Store、重复 ID 在写前抛错。
- `node --test packages/library-lab/entries/D11-jotai/tests/story-policy.test.mjs`，exit0，`validation/policy.log`：4/4，纯业务策略，单列不当 SDK 证据。
- `pnpm --filter @reactloom/library-lab exec biome check --write entries/D11-jotai/examples entries/D11-jotai/tests entries/D11-jotai/library.json entries/D11-jotai/validation/browser.spec.ts`，exit0；首次格式日志 `validation/biome.log` 有4项模板字符串信息，修正后 `validation/biome-final.log` 无诊断。
- `node --input-type=module -`，exit0，脚本导入 `src/lib/official-sources.mjs` 的真实 `validateOfficialSources(entry.official)` 并断言错误列表为空，然后计算官方 README 字节 SHA256 与 metadata 一致；`validation/official-metadata.log` 保留结果。
- `git ls-remote https://github.com/pmndrs/jotai.git 'refs/tags/v3.0.1*'`，exit0，得到6abd0ae3365e02ab432fba4b6e8e6f00aafbf508。`curl -fsSL https://api.github.com/repos/pmndrs/jotai/git/trees/6abd0ae3365e02ab432fba4b6e8e6f00aafbf508?recursive=1`，exit0，`official/tree.json`。首次小写 readme.md 为404，依据官方 tree 改用实际 README.md 后下载成功，未用自编摘要代替原文。
- `curl -fsSL https://raw.githubusercontent.com/pmndrs/jotai/6abd0ae3365e02ab432fba4b6e8e6f00aafbf508/README.md`，exit0，原文 `official/readme.md`。
- `curl -fsSL -D official/homepage-headers.txt https://jotai.org`，exit0，GET200；实际头部无 X-Frame-Options 或 frame-ancestors，未从实际 Lab origin确认，状态 unknown。

## 剩余验收

主控复制 `validation/browser.spec.ts` 到 e2e，冻结共享候选后运行 @D11，验证实际勾选、派生、A 重建/B 保留、卸载后重挂。全量 typecheck/build 由主控处理。正式 verification.json 保留 NOT_RUN；旧“lock待解析”说明不是当前依赖事实，本轮没有假造正式收据或 PASS。
