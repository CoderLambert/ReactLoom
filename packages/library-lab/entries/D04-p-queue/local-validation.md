# 2026-11-18 主控验收补充

当前六项质量在本地验收层级均PASS。真实SDK5项；独立复制源码TS编译与clear consumer通过；浏览器4项覆盖basic/business/advanced及官方原文降级。candidate-23类型/构建/目录检查通过，10个浏览器用例全通过；独立复核及命令见[逐库结果](../../../../openspec/roadmaps/upgrade-library-quality/results/D04.md)。正式收据仍NOT_RUN。下文保留作者冻结时检查点，浏览器待办已由本补充关闭。

# D04 本地质量复核（2026-11-18）

对象：工作区 D04 独占目录，p-queue 10.0.0。保留三场景：并发 → strict 滑动启动窗口/等待优先级 → 单项失败/暂停/整批取消。无外部 HTTP；真实 SDK 调度，本地 sleep 只替代业务工作。

|维度|状态与层级|依据|
|---|---|---|
|技术准确|PASS（源码/真实 SDK）|安装包 dist/index.js 与固定 v10 官方 README；五项真实 SDK 测试。修正旧 clear() 挂起说法：v10 会拒绝等待 Promise，不停止运行任务。|
|解释清楚|PASS（静态复核）|guide 的选型、模型、三层操作、最小接入与迁入；区分并发与启动频率、等待优先级与抢占。|
|Demo 有用|NOT_RUN（浏览器待验）|真实启动序号和相对毫秒可观察 RSS-8 优先级及每三次启动跨度；三场景设计已对应源码，浏览器套件尚待主控复制执行。|
|源码可迁移|PASS（静态复核）|example.tsx 自包含 React/PQueue，无 Lab 内部依赖；agent 列出 pnpm、环境、signal、generation 和卸载清理。|
|官方来源可靠|PASS（原文与响应头）|official/readme.md 固定 v10 commit，library.json SHA256；official/tree.json 未发现官方中文 README；homepage-headers.txt 明确 deny / frame-ancestors none，记 blocked 并保留仓库入口。|
|结果可复核|NOT_RUN（浏览器/集成待验）|SDK 本地5/5通过；格式通过。未跑共享 build/typecheck/browser，无正式收据。|

## 实际命令和原始日志

cwd `/home/lambert/githubRepos/lambert/ReactLoom`。

- `node --test packages/library-lab/entries/D04-p-queue/tests/sdk.test.mjs`，exit 0；`validation/sdk.log`：5 tests / 5 pass。真实导入 p-queue，覆盖并发/失败、启动前取消、暂停中 abort、strict 120ms/2 滑动窗口及优先级、v10 clear 语义。
- `pnpm --filter @reactloom/library-lab exec biome check --write entries/D04-p-queue/examples entries/D04-p-queue/tests entries/D04-p-queue/library.json`，首次 exit 1；原始 `validation/biome.log`，保留无效 effect 依赖诊断，修复为 effect 使用 level。
- `pnpm --filter @reactloom/library-lab exec biome check --write entries/D04-p-queue/examples entries/D04-p-queue/tests entries/D04-p-queue/library.json entries/D04-p-queue/validation/browser.spec.ts`，exit 0；`validation/biome-final.log`。
- `git ls-remote https://github.com/sindresorhus/p-queue.git 'refs/tags/v10.0.0*'`，exit 0；tag object a9c0034c8181069d7d5f099871a0ef044461ba8e，peeled commit 7f272ab5ff2254c0dc2537b7977e88ede1cd55e8。首次将 tag object 用作 raw ref 得404；改用实际 commit 后原文下载成功（未用摘要覆盖）。
- `curl -fsSL https://raw.githubusercontent.com/sindresorhus/p-queue/7f272ab5ff2254c0dc2537b7977e88ede1cd55e8/readme.md`，exit 0，原文字节保存在 official/readme.md；对应 GitHub tree GET exit 0，official/tree.json。
- `curl -fsSL -D official/homepage-headers.txt https://github.com/sindresorhus/p-queue`，exit 0；GET 200，官方仓库明确禁止跨源 iframe；原始响应头已保存。

## 待主控

复制 validation/browser.spec.ts 到公共 e2e 后在冻结候选执行 @D04；验证并发读数、priority、strict 时间戳、暂停/恢复、失败隔离、取消与卸载重挂。共享生成、typecheck、build 不在本 worker 授权范围。verification.json 的 sdk/build/browser 仍 NOT_RUN；本地执行结果不是正式 receipt PASS。既有 verification 里“lock 待更新”是旧说明，当前 lock importer 已存在，未为清理文案改正式文件。
