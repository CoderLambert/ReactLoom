# C11 react-arborist 本地质量整改

Owner quality_e05；实际cwd `/home/lambert/githubRepos/lambert/ReactLoom`，Git HEAD `1218066e706a90ba03fac8dff8c9b843dd2429c4`。接手时原8文件无diff，bytes/SHA在[baseline.json](validation/baseline.json)；调度暂停曾保证原8文件不变，历史事实保留在[handoff-checkpoint.md](validation/handoff-checkpoint.md)。本次从实际目录恢复，没有从HEAD覆盖；只改C11，保留其他工作者。没有安装、公共src/scripts/e2e/依赖锁/索引/队列/results写入、全目录generate/typecheck/build、隐式构建或提交推送。

## 六项状态与证据层级

| 维度 | 当前结论 | 证据与限制 |
| --- | --- | --- |
| 技术准确 | PASS（作者静态/实际SDK模型） | 实装3.16.0类型/源码与固定gitHead/manifest匹配；onMove删除前槽位、共享moveTree、实际SDK选择与镜像、name搜索、模型/DOM区分明确。SDK5真实运行，不证明DOM。 |
| 解释清楚 | PASS（作者静态） | guide从订阅工程问题→data与SDK交互归属→三个独立目标→调用输入/变化→IME/迁移/成本；agent保留必要约束，不套main4.x历史说明。f05独立报告静态/SDK复核已收，后续真实浏览器与本次文案限定delta分层记录。 |
| Demo有用 | PASS（root固定candidate18真实3目标+来源） | 原始browser.txt确认C11三交互及原文/unknown共4PASS；作者复用不重跑，非作者静态报告与真实运行分开，合成IME非OS输入法。 |
| 源码可迁移 | PASS（静态/入口strict） | sourceFiles全部7源，正常格式、实际Tree/NodeApi/TreeApi/helper、必要CSS与.ts导入配置齐，无Lab alias/远程资源；清理只按真实所有权描述，DOM/SSR hydration另验。 |
| 官方来源可靠 | PASS（固定原文/真实HTTP） | npm3.16.0 gitHead与同commit目标manifest匹配；目标目录无README、匹配候选无中文→根英文原文24954B/SHA；5历史GET headers字典可核，未保同名重复项，不再称完整原始头；原文可靠，官网保守unknown。 |
| 结果可复核 | PASS（本地分层闭环）；正式NOT_RUN | SDK5/policy5/strict与候选18实际4PASS分别可复读，七运行源/公共提案/原始log绑定；不由SDK推导DOM或用本地成功伪造正式收据。限定文档处置交f05 delta。 |

## 保留和修正

保留原稳定ID、受控data、onMove调用adjustMoveIndex后摘取整子树/原子插回/失败返原树的算法；没有机械改写成另一套排序。抽tree-model.ts和move-tree.ts，让页面和真实SDK测试直接共用合同。原2条helper断言保留并加入3条页面共享集成：同级下移/输入不变、父子同选整树只搬一次、父拖入被摘走的后代和缺失目标保持原树。它们真的import react-arborist，但仍只证明模型更新，不证明拖放DOM。

原onSelect只是SDK选择的React镜像，恢复只清镜像会留下真实选中。现在保留TreeApi ref，恢复/删除公开deselectAll；删除发生在树内时安排存活首节点焦点，按钮删除不抢按钮焦点。advanced当前目标初始规模7+1800=1807，恢复仍1807，不回落7。TreeApi.visibleNodes是完整展开/搜索模型，不能当虚拟DOM行数；filteredCount只数真匹配而非祖先。

默认Row不替换，保留SDK attrs/innerRef/treeitem与拖放连接。自定义TreeNode只提供style/dragHandle/内容和Editor；SDK默认Edit无组合保护，所以应用Editor检查ref/native isComposing/229，确认Enter保持到keyup，compositionend不无条件吞下一次普通Enter。Escape reset、普通Enter submit；name trim/空白→未命名仍为本地规则。纯policy5直接用同一model/guard：规模/恢复独立、改名身份与剪枝、确认Enter释放、Space/鼠标确认后的普通Enter、原生isComposing/229。

搜索草稿和searchTerm在组合时分开，仅name匹配；筛选时SDK canDrop拒绝，本例disableDrag与应用移动按钮都同步禁用。真实HTML5拖放last-move.source=sdk，按钮source=button，不用fallback冒充SDK键盘拖拽。业务数据仍是本地fixture，无真实订阅/Query/持久化/revision。

应用没有网络/timer/全局监听/存储租约；编辑器仅挂载focus/select，SDK拥有自己的DnD/虚拟列表/临时键盘任务。本次没有替换时钟/observer/DOM/canvas或mock SDK；清理静态归属不当全局泄漏PASS。useLayoutEffect通过稳定ref观察可变SDK模型，nodes/search/selected/epoch是触发输入，Biome忽略只针对这个有说明的依赖关系，不能删除这些触发后声称观察仍实时。

## 实际cwd、命令、退出与原始日志

外层cwd均仓库根，pnpm --dir使包内命令cwd为packages/library-lab。[run-command.py](validation/run-command.py)保存确切argv/UTC/exit与原始合并stdout/stderr。最终[local-runs.json](validation/local-runs.json)只汇总真实日志，不发正式收据。

| 实际命令范围 | exit/结果 | 原始日志 |
| --- | --- | --- |
| pnpm --dir packages/library-lab exec node --test entries/C11-react-arborist/tests/sdk.test.mjs | 0；真实SDK5PASS/0SKIP，前2原helper+3共享moveTree | [sdk.txt](validation/sdk.txt) |
| pnpm --dir packages/library-lab exec node --test entries/C11-react-arborist/tests/tree-policy.test.mjs | 0；纯策略5PASS/0SKIP，不算SDK或IME浏览器PASS | [policy.txt](validation/policy.txt) |
| pnpm --dir packages/library-lab exec tsc --ignoreConfig --noEmit … --allowImportingTsExtensions --types vite/client,node entries/C11-react-arborist/examples/demo.tsx | 0；完整7源入口strict，完整参数在日志 | [types-initial.txt](validation/types-initial.txt) |
| python validation/fetch-official.py（实际完整路径见日志） | 0；5真实GET，版本/目录/原文/官网headers字典（未保同名重复项） | [official-fetch.txt](validation/official-fetch.txt) |
| pnpm exec biome check --write 本条目examples/tests | 首次1，已格式9文件，仅发现观察effect触发依赖规则；有说明的局部忽略后0，不改算法/事件行为 | [format-code.txt](validation/format-code.txt)、[format-code-fixed.txt](validation/format-code-fixed.txt) |
| pnpm exec biome check --write 提案临时browser-proposal.check.ts | 0，1文件格式后回写txt并删临时 | [proposal-format.txt](validation/proposal-format.txt) |
| pnpm --dir packages/library-lab exec tsc --ignoreConfig --noEmit --target es2022 --module esnext --moduleResolution bundler --strict --skipLibCheck --types node entries/C11-react-arborist/validation/browser-proposal.check.ts | 0，完整3case Playwright提案strict，不执行浏览器 | [proposal-types.txt](validation/proposal-types.txt) |
| pnpm exec biome check --write library/verification/source-evidence/sdk-source-audit/metadata-check | 0，5文件，原README未格式化 | [format-metadata.txt](validation/format-metadata.txt) |
| pnpm --dir packages/library-lab exec node entries/C11-react-arborist/validation/metadata-check.mjs | 0，三目标/7源/实装peer与版本/原文hash/unknown依据/17输入 | [metadata.txt](validation/metadata.txt) |
| git diff --check -- packages/library-lab/entries/C11-react-arborist | 0，最终范围空白检查 | [diff-check.txt](validation/diff-check.txt) |

SDK/策略后只有正常格式、观察effect说明、文档/provenance/提案变化，没有移动或IME算法变化，因此复用有效5+5/入口strict，不因文档重复运行。安装源码/类型摘要与实际peer路径/hash见[sdk-source-audit.json](validation/sdk-source-audit.json)。当时candidate17尚未验证C11；后续root实际candidate18 type/build/catalog和C11四case已通过，当前记录按实际输入绑定复用，不借用其他库结果。

## 官方来源和抓取安全

[原README](official/readme.md)为jameskerr/react-arborist@d74c4ec696ba98c1a4e981075f6d60cdff3e290b/README.md，来源npm3.16.0 gitHead；固定目标modules/react-arborist/package.json版本也是3.16.0。实际tree未截断，五个README候选不含目标package README或中文，故回退官方根英文原文。24954B、SHA256 `0c3ba42abd227ddce29578749b9765b5513797d446cb2d3d2b96281a429fa80a`，同步UTC2026-11-10T16:53:37.522420+00:00，library/guide/agent/source-evidence一致。

[历史证据](official/source-evidence.json)保存registry/tree/manifest/README/官网5次真实GET的最终URL/状态/时间/headers字典/已读body bytes+SHA；字典不保同名重复项列表，不称完整原始头；未读官网正文明确NOT_READ、bytes=null。官方README直链指向netlify主页，最终GET200字典未捕获XFO/CSP。没有Lab-origin iframe确认，unknown而非allowed，也不是blocked。

[fetch-official.py](validation/fetch-official.py)异常只写独立failed并抛错，所有网络与版本检查成功后才双暂存replace成功原文和evidence；没有finally覆盖旧成功对。没有额外运行受控传输fixture，不能虚构抓取工具fixture通过，未因维护脚本重抓有效上游。原文保存未经本地改写。

## 浏览器协议与剩余

[完整Playwright提案](validation/browser-proposal.txt)为3个真实case：basic默认Row ARIA/键盘/选择/恢复；business原生HTML5 dragTo、独立按钮fallback/index2修正、ID不变、编辑组合Enter确认、无Enter-keyup compositionend后普通Enter、Escape和SDK Backspace删除/回焦；advanced1807模型与小DOM、原生wheel/深定位、name-only空态/祖先/筛选禁移动、合成搜索协议、恢复当前规模、390px/停止DOM断开/再挂载。没有mock DnD或直接调用SDK伪造拖放。

测试入口c11-workshop/data-level；c11-tree实际树容器；内容data-node-id，默认SDK Row没有data-id，提案用真实treeitem祖先观察；c11-model/selection/search/topology/last-move/status/count。控件恢复示例树、重命名所选、删除所选、移到商业分组、同组下移一位、定位最后技术源，搜索标签节点搜索。last-move.source是应用收到的事件种类，不等于底层拖放事件数量。

仍NOT_RUN：官网iframe可用性、系统IME/读屏/触屏、多树manager/SSR hydration/全局泄漏与性能测量。真实三目标和原文/unknown展示已实际4PASS，不再列未测。没有后端或外部资源阻塞当前Node检查。formal verification三个status保持NOT_RUN；root已在固定candidate18完成上述4case；正式收据仍独立处理，作者不自行content_done。

## 文件与稳定交付

7源、2测试、guide/agent/library/verification改动；新增官方原文/完整证据、来源审计/抓取/metadata/提案/命令记录。AGENTS保持原字节，原8基线和暂停handoff保留历史含义。当前17内容输入在[input-hashes.json](validation/input-hashes.json)，完整清单见[final-files.txt](validation/final-files.txt)，日志摘要[log-hashes.json](validation/log-hashes.json)，最终输入/链接检查[final-inspection.txt](validation/final-inspection.txt)。独立复核与实际browser交root安排，停写后不升级正式收据。

最终链接检查首次在命令输出日志生成前检查其自身路径，exit1；原始失败保留[final-inspection-initial.txt](validation/final-inspection-initial.txt)。先建立该输出路径后重新核对17输入/全部本地链接，未改产品行为或重跑SDK。

初次作者FINAL STABLE：`2026-11-10T17:01:13.026450+00:00`。当时真实browser尚NOT_RUN；后续独立报告和candidate18实际4PASS、本次文案收口见下文，原17摘要归档保留。

## candidate18真实运行与限定文档收口

已实际读取root原始[候选18 browser.txt](../../../../docs/library-lab/evidence/quality-upgrade/candidate-18/browser.txt)和browser.json：Lab cwd，pnpm exec playwright test --config=.local-evidence/quality-playwright.config.ts e2e/quality-remediation-arborist.spec.ts e2e/quality-remediation-date-fns.spec.ts e2e/quality-remediation-primitives-sources.spec.ts --grep '@C11|@C14' --trace=off，UTC2026-11-10T17:16:01.123522至17:16:10.504722，exit0/implicitBuild=false。整轮8/8中C11三目标+原文/unknown展示4/4PASS，不混入C14另4项。真实HTML5拖放与独立button路径、默认Row ARIA/选择/焦点/恢复、编辑guard/删除、1807虚拟窗口/name搜索/深滚/窄屏/卸载重挂已通过；合成composition非真实系统IME，DOM断开非全SDK泄漏证明。

f05非作者原报告[仍保留原文](validation/independent-review.md)，其静态/SDK5/policy5/8安装源码复核早于root真实browser，不改写历史NOT_RUN结论来假装当时已执行。现在维护证据另记录实际4PASS及七运行源与候选18、entry/public提案字节相同。

root扩大本次限定作者范围后，guide将local-validation/source-evidence两个发布器私有链接改维护纯说明，README改固定HTTPS；不扩大公共私有发布策略。历史5HTTP/source-evidence/README未改字节、不重抓、不补造rawHeaders。guide/agent/library及本记录将“完整头”收窄为headers字典，未来现有fetch仍仅字典捕获，若需同名重复头证据必须升级工具后另一次真实获取，不能回填历史。当前可靠原文与保守unknown可复用。

本次只改guide/agent/metadata说明、verification.notes和维护证据索引；所有7运行源、两测试、README/历史HTTP共11保护文件比对0差异，不重跑SDK5/policy5或真实4case。必要publisher链接/metadata/格式/范围检查另存browser-record日志；不增加执行内容，仍按17条内容输入刷新，旧input-hashes/log列表另存before-browser-record。root在作者停写后交f05独立delta，作者不自行content_done。

本次维护检查（实际根cwd，完整argv/UTC/exit在browser-record日志）：3份metadata格式exit0、node metadata-check/publisher10链接/17输入exit0、11保护文件检查exit0、scope diff exit0；未改future fetch或执行任何SDK/HTTP/browser。作者停写后交f05只读delta，旧独立报告不由作者修改。

RECORD/DOC FINAL STABLE：`2026-11-10T17:45:58.242580+00:00`。C11作者全部停写，实际7声明运行源和11保护文件未改；4真实case PASS/官方iframe unknown/正式3NOT_RUN分开记录。publisher10链接和17输入、范围/格式/最后链接检查均0；交f05独立delta，不自行content_done。
