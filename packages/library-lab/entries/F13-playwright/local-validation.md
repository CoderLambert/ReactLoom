# 2026-11-18 主控闭环补充

六项本地质量PASS。真实独立 Chromium CLI 10/10（1/8/1），非作者新 201 输入 1/1。Lab 核对三个复制命令和源码，路由数据仍为本地 fixture。候选37及独立试用证据见[逐库结果](../../../../openspec/roadmaps/upgrade-library-quality/results/F13.md)。正式收据仍NOT_RUN。下文为作者停写检查点，原浏览器/共享检查待办已由本补充关闭，初始失败仍保留。

# F13 本地整改与真实SDK证据（2026-11-18，STABLE）

只F13目录；不改shared/e2e/队列结果/依赖，不全局生成/build/fulltypecheck/commit/subspawn。复查现有证据：没有docs/library-lab/evidence/runs或本条有效CLI收据，candidate输入指纹与全局临时config不证明本工坊执行。已有HTTP/坏JSON/transport/挂起释放与取消场景齐，保留实现，只补缺少的可观察断言，不扩用例。

| 六门槛 | 状态/层级 | 证据 |
| --- | --- | --- |
| 技术准确 | PASS实际Chromium SDK | 实装@playwright/test1.64.0/Apache2，独立config/headlessChromium，无Lab服务，三CLI真实10项通过 |
| 解释清楚 | PASS | 语义定位、HTTP Response与transport/JSON区别、route Mock非后端/MSW、取消与代次组合合同、完整迁入/命令cwd |
| Demo有用 | PASS独立工坊 | basic1/business8/advanced1真正CLI/浏览器交互；Lab网页只是配方展示不在此执行 |
| 源码可迁入 | PASS | 五原件复制ownedtmp strictcompile，无React/env/服务；指南精确安装/Chromium/CLI/config前提，类型检查不混转译 |
| 官方来源可靠 | PASS | fixedv1.64.0→606ecd… README/LICENSE原字节、tree无中文主README、实装Apache2；官网实际GET200未知嵌入unknown |
| 可复核结果 | PASS目标SDK；Lab展示NOT_RUN | 三声明CLI cwd/argv/exit/raw齐，10唯一SDK用例，纯policy0；主控Lab配方/来源另验，formal三NOT_RUN |

## 实际三条声明CLI

cwd `/home/lambert/githubRepos/lambert/ReactLoom/packages/library-lab`；完整argv/cwd/exit/UTC在validation/{basic,business,advanced}-cli-command.json，rawstdout/stderr同名.log。无浏览器安装、无服务器启动、retries0/workers1，现有已安装Chromium可用。

| 实际argv | exit | 唯一用例与结果 |
| --- | --- | --- |
| pnpm exec playwright test --config=entries/F13-playwright/examples/playwright.config.ts entries/F13-playwright/examples/basic.spec.ts | 0 | 1 passed，语义定位/空标题/保存状态 |
| pnpm exec playwright test --config=entries/F13-playwright/examples/playwright.config.ts entries/F13-playwright/examples/business.spec.ts | 0 | 8 passed，HTTP5+transport1+坏JSON1+pending单飞1 |
| pnpm exec playwright test --config=entries/F13-playwright/examples/playwright.config.ts entries/F13-playwright/examples/advanced.spec.ts | 0 | 1 passed，old先拦截→new→释放old后仍最新 |

raw保留Node NO_COLOR/FORCE_COLOR环境提示，不删掉stderr假装无输出。早期basic单项探测确认环境可启动，随后按三声明CLI完整留档；不把探测重复计为第11个场景。未跑sharedbrowser/其他entry套件。

## 最小变更与清理

业务已有必须类别，不重复增加：HTTP5组合、坏JSON、transport、pendingfinally；新增HTTP矩阵与坏JSON后button enabled、坏JSON请求计数1、挂起期间同一evaluate连续两次真实button.click仍只拦截1次。没有换mock库、安装依赖、改retry、sleep等待或额外产品功能。

business route屏障在finally release，advanced old屏障也finally release；旧route可能因fetch已取消而fulfill拒绝，finally oldFinished使等待确定。上下文由Playwright test fixture关闭，未手工创建可泄漏browser singleton。取消+generation只验证组合可见行为，不独立证明代次或服务器真的停止计算。fixture是教学HTML非生产API安全模板。

三CLI成功无失败trace；只清理本次生成的examples/.playwright-artifacts/.last-run.json及其空目录，不删用户文件或任意trace。测试配置仍retain-on-failure，未来失败产物由调用方保留。没有把生成trace目录当receipt。

## 其他实际检查

cwd仓库根 `/home/lambert/githubRepos/lambert/ReactLoom`，validation/*-command.json与log：

- `node …/validation/check-official.mjs` exit0：协议errors[]，实装1.64.0/Apache-2.0，固定README11280bytes SHA8d2a2d9027d5d6ae2c8080c6c9752624528c5605398f87da730e18442c7e9a84、LICENSE11601bytes SHA45873d00a0dd243596deb4aa23b2493b3d1f0671921bf2538ea431d7380220eb，重新HTTPS200且sameBytes true。
- `pnpm exec tsc -p /tmp/f13-portable-…/tsconfig.json` exit0，无输出；复制五原件加仅显示提案，strict/ES2022DOM/ESNext/Bundler/Node类型，配置migration-fixture.txt；既有依赖软链非fresh-install，ownedtmp已清理。实际三CLI证明配置解析与浏览器SDK，isolated strict证明迁入类型前提，不跑额外相同套件。
- scoped `pnpm exec biome check`九实际源/config/metadata/提案/checker exit0。第一次目录check误扫运行工具生成.last-run.json缺末行格式exit1，原始biome-initial.log保留；不修改工具产物，清本次owned临时成功标记后按明确源文件check，非关闭格式规则。

## 官方与平台边界

fixedtree完整保存official/tree.json与source-evidence.json，未找到中文README候选，保存官方rootREADME原字节en，不自行翻译。许可证Apache2原文及实装字段一致。官网实际GET200无Lab-originiframe成功，unknown直达；CORS/200不证明嵌入。

validation/browser.spec.ts只有Lab网页三CLI/官方README展示方案；作者未运行，它不执行CLI、不代替上面的真实Chromium SDK10项。主控可复用共用来源展示检查。formal sdk/build/browser无匹配receipt全部NOT_RUN；Firefox/WebKit/设备/读屏/视觉/axe/后端API未测，不扩大本批。
