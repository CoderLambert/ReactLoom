# C17 i18next：作者最终本地验收记录

作者完成UTC 2026-11-10T18:19:24.434507+00:00；完成态为 **FINAL STABLE / 待非作者六项复核**，不自行标 content_done。仅修改本条目，未提交、推送、安装、改依赖/锁或公共源码/测试/索引/队列。原目录11文件无diff，基线HEAD `1218066e706a90ba03fac8dff8c9b843dd2429c4`、逐文件摘要在 `validation/baseline.json`。保留有效串行latest队列及原4项策略测试；contentState/provenance仍为独立重建 recreated，未冒称找回旧SDK成果。

运行源自中间点起一直保持相同：7份 sourceFiles 与固定19及20逐字节一致；本轮release后只补中文/审计/维护工具/记录。历史中间稿保存在 `validation/intermediate-validation.md`，其中早期“6真实GET”为漏数注释tag解析请求，**最终按原始证据更正为7次HTTP200**，没有改写或重抓上游响应。

## 六项作者结论

| 维度 | 状态与证据层级 | 具体依据 |
| --- | --- | --- |
| 技术准确 | PASS，匹配源码/类型审计 + 真实SDK | 安装i18next26.4.3/MIT；官方tag/npm gitHead/manifest同版。实际createInstance/init/t/getFixedT/addResourceBundle/returnDetails/on/off；9安装文件摘要及准确行段见sdk-source-audit。SDK5真实通过，不把队列dispose当SDK abort/destroy。 |
| 解释清楚 | PASS，最终文档静态复核 | guide先实例/资源/键/参数/复数，再三目标、回退和应用队列；区分SDK事件/应用commit、人工fixture/机器翻译、React文本实体/HTML净化；agent及AGENTS同步七源与实际所属清理。 |
| Demo有用 | PASS，固定19真实浏览器3/3 | basic插值/复数/文本/reset；business实际bundle/added/资源重置；advanced真实回退详情/快速意图/level-reset/390px/卸载重挂。未mock目标SDK、DOM、时钟、Intl或后端。 |
| 源码可迁移 | PASS，入口strict/格式及发布检查 | 三入口同七份必要文件，MJS声明与scoped CSS齐；复制资源、effect owner、所属callback逐一off、latest队列及晚回guard。sourceFiles逐文件存在，最终guide/agent19个链接均由实际publisher resolver接受。 |
| 官方来源可靠 | PASS，原始取证 + 固定20官方展示 | 固定commit英语README5593B/原文SHA完整；树仅README.md，无中文候选。7真实GET全200，rawHeaders重复项列表、匿名cookie值脱敏、官网正文NOT_READ。实际CSP排除HTTP Lab，blocked展示单项PASS；不声称HTTPS也blocked或allowed。 |
| 结果可复核 | PASS，本地分层证据；正式收据NOT_RUN | SDK5/policy4/入口/提案/metadata/fixture均有argv/cwd/UTC/exit/log。固定19三UI+20官方本条累计4PASS；20混合命令2PASS3FAIL/exit1如实保留。待独立内容复核，正式三status均NOT_RUN。 |

## 实现与真实边界

- 工程主线是本地频道词典：核心独立实例 → 人工资源 → t插值/复数 → 动态namespace → 回退细节与最新意图。没有机器翻译、HTTP backend、语言探测器或SSR实现。
- factory `structuredClone(resources)`；动态channel写入只属于当前实例。通过实际hasResourceBundle与store added观察，一次加入zh/en产生2事件，资源不是网络产物。
- `getFixedT(committedLanguage)` 固定已发布词条；requested、committed、实际SDK language与事件数分开，快速两请求产生2 SDK事件/1应用commit。应用generation仅重置计数。
- observer每次创建唯一wrapper，精确off所属callback，不调用清空同事件所有消费者的off。初始化晚回先alive检查，尚未注册应用订阅则直接返回。dispose丢弃未开始目标/禁止晚UI提交，**不取消已开始SDK Promise或任何网络IO**，没有SDK destroy。
- 保留escapeValue:true：昵称<Ada>经SDK返回&lt;Ada&gt;，React文本显示实体字符，无HTML解析。这是现配置的真实显示取舍；不是任意HTML净化能力。生产全React文本可另评估false，不能据此允许dangerouslySetInnerHTML。
- 3个完整Playwright case源码为 `validation/browser-proposal.txt`，SHA-256 `5f043b01c606b698130a70825c939ef8daba98f35d30fe3061b0317a8b0135ea`。root已统一接入实际公共suite，提案/运行源未为日志收尾再改。

## 官方原文与官网证据

仓库 `i18next/i18next`；tag `v26.4.3` 是注释tag，API额外解析其tag object；最终commit `0d2845a2360dcc236fe9681f849781f5dfdd35c4` 与npm gitHead相同，源manifest26.4.3及安装26.4.3一致。原文路径 `README.md`，语言en，同步2026-11-10T17:50:48.983395+00:00，5593B/SHA-256 `3964fe947138fb6369c58bbc7779eacc8877cf220d41db7647c9e4bd7c466966`。sourceUrl为 https://github.com/i18next/i18next/blob/0d2845a2360dcc236fe9681f849781f5dfdd35c4/README.md ，raw URL及每次完整响应元数据在official/source-evidence.json。安装包README亦字节一致，但来源仍绑定实际官方固定commit取回事实。未格式化/翻译原文。

7真实HTTP：registry、tag ref、annotated tag object、完整tree、package manifest、README、官网，均200；官网body未读取。rawHeaders保留重复字段及顺序，headers字典仅便览；匿名Set-Cookie值脱敏并记录值SHA和属性，不读取/使用凭据或旧cookie。

官网 https://www.i18next.com 的实际enforced CSP `frame-ancestors https: ionic: capacitor:` 排除 `http://127.0.0.1:4319` 与 `http://localhost:4319`。初工具仅识self/none导致原stdout unknown，后离线修正派生blocked和未来classifier；`homepage-policy-correction.json` 保留前后rawHeaders相同SHA `f97b2973561ca9e40356d21ea95a45ee91f9a522b3e521eb9adee6c4a447f67b`。原stdout保留，未重抓/补造headers。固定20真实页面验证原文与blocked提示通过，**不声称实际允许嵌入，也不外推HTTPS部署**。

取证工具仅在全部获取/校验成功后双暂存再replace；获取失败独立source-evidence.failed.json并抛错，保留旧成功对。受控传输fixture在临时目录覆盖成功（含重复CSP/cookie）、首请求失败、已取README后官网失败3场景，均PASS；这只是维护工具证据，不是新官方HTTP或SDK。它模拟直接commit tag路径6个请求，与实际注释tag7请求事实分别记录。

## 实际命令、cwd、退出码和日志

作者命令默认cwd：`/home/lambert/githubRepos/lambert/ReactLoom/packages/library-lab`。完整argv、开始/结束UTC、exitCode、日志名均在 `validation/local-runs.json`；以下只缩写公共前缀。

| 实际命令/范围 | exit | 原始日志/产物 |
| --- | --- | --- |
| pnpm exec -- biome check --write entries/C17-i18next/examples entries/C17-i18next/tests entries/C17-i18next/library.json | 0 | checkpoint-format.txt，10文件格式化 |
| pnpm exec -- tsc --ignoreConfig --noEmit --target es2022 --module esnext --moduleResolution bundler --jsx react-jsx --strict --skipLibCheck --esModuleInterop --types vite/client,node entries/C17-i18next/examples/demo.tsx | 0 | checkpoint-types.txt，七源入口strict |
| node --test entries/C17-i18next/tests/sdk.test.mjs | 0，5PASS/0SKIP | sdk.txt；真实共享factory/observer/资源、SDK与latest组合 |
| node --test entries/C17-i18next/tests/language-switch.test.mjs | 0，4PASS/0SKIP | policy.txt；自建deferred队列策略，非SDK模拟PASS |
| python3 .../validation/fetch-official.py，cwd为仓库根 | 0，7实际HTTP200 | official-fetch.txt、official/readme.md、official/source-evidence.json；原派生unknown保留并离线更正 |
| pnpm exec -- biome check --write 临时browser-proposal.spec.ts + 显式tsc --ignoreConfig严格检查该文件 | 均0 | proposal-format.txt、proposal-types.txt；临时目录已删除，完整提案保留txt |
| pnpm exec -- biome check --write library/official-evidence/policy-correction三JSON；实际validateEntry单库schema | 均0 | official-metadata-format.txt、official-metadata-schema.txt |
| python3 entries/C17-i18next/validation/source-tool-transport-fixture.py | 0，3PASS | source-tool-transport.txt；仅临时传输维护、未真实HTTP |
| pnpm exec -- biome check --write metadata-check.mjs/sdk-source-audit.json | 0 | maintenance-format.txt |
| node entries/C17-i18next/validation/metadata-check.mjs，首次误预期6请求 | 1，保留 | final-metadata.txt；实际7的计数断言错误，非SDK/UI失败 |
| 修为7后同单库metadata检查 | 0 | final-metadata-green.txt；7源、9安装文件、README/版本/raw头/publisher/formal状态 |
| 最终格式：初次新绑定JSON数组排版exit1，限定format --write后exit0；维护Python AST/metadata/scoped diff均0 | 1→0 / 其余0 | final-format.txt保留原FAIL、final-format-green.txt、source-tool-ast.txt、final-record-check.txt、scoped-diff-check.txt；不重跑SDK/HTTP/UI |

root已有真实执行只读复用：
- 固定19：Lab cwd `pnpm exec playwright test --config=.local-evidence/quality-playwright.config.ts e2e/quality-remediation-i18next.spec.ts --trace=off`，exit0/3PASS，原始 `docs/library-lab/evidence/quality-upgrade/candidate-19/browser-i18next.txt`；runtime-reuse逐文件一致。
- 固定20：仓库根公共/e2e lint、Lab typecheck/build/catalog均exit0；3132输入SHA `793aba254832cfac7345dd05141599a1cf3fe739b9cbc54ef2f017e80d7f9f4d`，changed=[]。这是共享构建，未冒称本条独立正式build收据。
- 固定20：Lab cwd `pnpm exec playwright test --config=.local-evidence/quality-playwright.config.ts e2e/quality-document-links.spec.ts e2e/quality-remediation-primitives-sources.spec.ts e2e/quality-remediation-nuqs.spec.ts --grep 'versioned migration patch|@C17|@C19' --trace=off`，**整命令exit1/2PASS3FAIL**；C17原文/blocked单项PASS，不能写整套PASS。日志为同candidate-20/browser.txt。
- `validation/shared-validation-binding.json` 绑定上述原始日志/候选输入/构建及本条13保护输入SHA。7生产源、两测试、library、官方原文/evidence与提案都未变；最终guide/agent/AGENTS及记录是20之后的文档修改，只经实际publisher/静态事实检查，不假称这些终稿已在20里展示。

## 文件与可复查产物

运行/迁移：examples/demo.tsx、example.tsx、i18n-client.mjs、i18n-client.d.mts、language-switch.mjs、language-switch.d.mts、styles.css。
教学/维护：guide.md、agent.md、AGENTS.md、library.json、verification.json、local-validation.md。
测试：tests/sdk.test.mjs、tests/language-switch.test.mjs。
官方原文/证据：official/readme.md、official/source-evidence.json。
validation包含原基线/中间历史、命令ledger与raw日志、完整浏览器提案、安装源码审计、匿名抓取工具、策略更正、受控传输fixture、单库metadata checker、共享运行绑定及最终input/log hashes。完整相对文件列表与内容SHA见 `validation/input-hashes.json`（排除自身）；目录最终摘要由交付消息绑定，避免自引用循环。

## 剩余与交付边界

本地必验的3目标+官方展示已4PASS，作者六项完成；**非作者六项复核仍NOT_RUN，交root安排e11，不自行content_done**。正式verification.sdk/build/browser三个status全部NOT_RUN。OS输入法、真实HTTP backend/错误/取消、检测器、SSR每请求租户隔离、全局SDK资源/监听普查未运行；目前没有以这些未实现能力作为Demo目标。HTTPS宿主若需要嵌官网，重新核对该宿主与实际策略，不能将当前HTTP blocked直接外推。

未重复已有有效SDK5/policy4/HTTP/浏览器；未修改公共runner、依赖锁或全目录执行。FINAL交付后停止本条所有源码/文案/metadata/log写入，无后台任务；后续作者限定修复需root再交独占写权。

## 独立复核后的限定文案修复

当前独立报告 `docs/library-lab/evidence/quality-upgrade/reviews/C17-review.md` 的唯一 P2 指出，指南末尾仍有候选批次、文件比较和正式收据管理信息。本次仅将指南该段改为实际覆盖能力与真实未测边界，维护事实保留在此记录：本地真实 SDK5、纯队列策略4分别通过；固定候选19三目标真实浏览器3PASS，七份运行源与候选20相同，候选20官方展示单项PASS。本条累计4个本地浏览器case通过，候选20整命令2PASS3FAIL/exit1不变，正式sdk/build/browser仍为NOT_RUN。

此次文案修复不改变运行源、测试、metadata、官方原文或正式状态。旧 `validation/input-hashes.json` 保留为原作者FINAL快照；本次前后文件摘要另行核对，仅指南和本维护记录发生内容变化。已有SDK、策略、HTTP和浏览器结果继续复用。独立复核的解释清楚项待另一名非作者确认后再由主控关闭。

以上原作者FINAL章节保留当时的状态；当前复核与限定修复以本节为准。本次在仓库根运行现有 `node packages/library-lab/entries/C17-i18next/validation/metadata-check.mjs`、两份文档的 `git diff --check`，并复算修复前后的条目文件摘要；命令、cwd、实际退出码及输出保存在 `validation/copy-fix-check.txt`。这是文案、链接与保护输入检查，不是新的SDK、HTTP或浏览器运行。
