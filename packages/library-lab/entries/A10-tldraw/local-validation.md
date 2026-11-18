# A10 tldraw 本地整改与稳定交接

日期2026-11-10，owner `/root/quality_e11`。实际仓库cwd `/home/lambert/githubRepos/lambert/ReactLoom`；HEAD `1218066e706a90ba03fac8dff8c9b843dd2429c4`。进入时10文件、本条目无初始dirty；认领摘要 `92d168a5c16194e4e57d40ab7217d3d825c9173b1c2518c0616e819b89673d20`。已读根/本包/本条目AGENTS、协调/实施/整改文档、质量路线图及library-lab-quality Skill三个references。冻结期只读，主控candidate-05结束释放后才写入。

只改A10；保留其他写入者成果。没有改公共src/scripts/tests/e2e/runners、依赖/锁、索引、队列/results。没有全目录generate/typecheck/build、浏览器执行、提交/推送；没有读取用户.env、凭据或license key，没有改环境/注入假key/修改SDK许可判断。正式verification sdk/build/browser/license继续NOT_RUN，交review_pending而非content_done。

## 改动与独立目标

保留已有真实Tldraw白板、四节点createShape、原生工具、只读、36/80有限批量、3MB导出与Blob清理。旧资料重复反例、密集源码、只下载而无恢复；讲解曾把run等同独立撤销步、误称没有图片资源路径，也未处理当前页切换观察和失效Editor引用。

1. basic：真实SDK工具栏输入→形状与稳定ID；0起步，原生画笔新增。没有用图片或模拟renderer代替SDK。
2. business：四个RSS教学节点→内存document副本→追加或清空→loadSnapshot恢复。保存副本与当前Store分开，形状ID和内容来自同一文档；下载当前文档保留，不误称下载保存副本。
3. advanced：只读同时约束SDK和应用写按钮，有限批量与离开/停止重进。内存副本不跨实例、刷新或持久化。

正常排版全部必要源文件与样式；增加语义fieldset/region、形状与保存ID观察点。listener scope=all覆盖当前页session切换，只在当前页身份集合变化时更新派生状态；不在pointermove复制形状。onMount退订并丢弃active实例，写按钮防失效引用；SDK释放Editor。WeakSet避免同Editor重复回调再种骨架。Blob与timer只清理当前实例自有资源。

保存/下载先序列化检查3MB UTF-8，内存保存失败保留旧副本。恢复只接受同组件捕获的同版本document，不是外部JSON导入器。SDK协调当前会话，不恢复旧相机/选择，亦不承诺invalid selection不变。run是批处理，本例不承诺独立撤销步。文档含所有页/资源记录和URL，不是离线媒体包。

## 六项状态

| 维度 | 状态 | 实际依据和边界 |
| --- | --- | --- |
| 技术准确 | PASS | 已安装5.5.2源码/类型核对；真实Store/快照SDK2/2、纯策略3/3、入口类型通过；准确区分document/session、批处理/撤销、SDK/应用只读/许可。 |
| 解释清楚 | PASS | 从白板保存问题到3个实验、API/所有权、迁移文件和许可；精简重复/未实施内容，步骤与当前控件一致。静态复核结论。 |
| Demo有用 | NOT_RUN | 三个真实目标已接线，Node Store运行通过；真实工具栏/指针/SDK许可/只读/卸载仍待主控browser。 |
| 源码可迁移 | PASS | 4份必要源文件/样式在sourceFiles，匹配依赖、官方CSS/尺寸/清理清楚；类型/Biome通过。完整Editor生命周期仍以浏览器为准。 |
| 官方来源可靠 | PASS | 版本匹配固定原文、271个实际候选无中文、commit/path/version/lang/time/hash和完整许可原文；官网完整响应头、unknown理由明确。 |
| 结果可复核 | NOT_RUN | 定向检查/提案日志可复核，但未由本工作者运行真实浏览器或共享构建，不晋级正式PASS/content_done。 |

## 版本、许可与官方来源

实际包tldraw5.5.2。核对已安装TLEditorSnapshot.ts中的getSnapshot/loadSnapshot、Editor.run的history.batch、LicenseProvider/LicenseManager及Tldraw onMount清理/实际UI测试标识。getSnapshot的document/session分离、loadSnapshot保留与协调session来自真实实现；许可仍由SDK真实校验，不从应用字符串存在推定有效。

固定tag v5.5.2 annotated `c58cfd57d6579c16521d0328bbb16ffbb0f6e9fc` 解引用 `be4d5b30cbf896c92436d634e59843a920705cef`；该commit的packages/tldraw/package.json为5.5.2。完整递归tree返回271个README候选，无中文路径，根/目标包README均检查；选目标包packages/tldraw/README.md，而非仓库贡献者首页。

原文3729字节，SHA-256 `6689bd272a4c368415b8ba88fcbf47b5dfab09f9e88f5a3fed98bacb32478c84`；英文，同步 `2026-11-10T10:31:11.111014+00:00`。official/source-audit.json保留候选/来源/版本。另存LICENSE.md原文4609字节，SHA-256 `9578fcddc20e404b6a29f44b6fea81d8b331698c0e7e9be34132d6f4394fa533`；没有改写上游Markdown。

许可证默认允许内部Development Environment，不覆盖供终端用户正常使用的生产部署；正式用途需符合适用试用/商业/其他官方条款。本地回环正常开发路径与生产授权分别说明；没有尝试借key、改NODE_ENV或去水印。未运行实际浏览器，不能宣布localhost SDK许可已通过；如真实SDK许可错误，应保留错误和合法解除条件。

官网第一次完整body读取超时；后续真实GET响应头200，最终URL `https://tldraw.dev`。完整原始响应字段保存在official/homepage-response.json，XFO/CSP显式null，检查时间 `2026-11-10T10:33:30.903576+00:00`。未从Lab originiframe验证，unknown且保留直达，不从200推定allowed。

## 实际执行命令

以下全部检查的实际cwd为 `/home/lambert/githubRepos/lambert/ReactLoom/packages/library-lab`，日志为validation/*.txt（不会被根*.log忽略）。validation/run-checks.py包含原始argv并固定此cwd；日志逐条写command/cwd/exit/output。

| 命令 | exit | 结果/原始日志 |
| --- | --- | --- |
| `node --test entries/A10-tldraw/tests/sdk.test.mjs` | 0 | 真SDK Store/schema/richText、document恢复稳定ID和原内容、document/session分离，2/2；validation/sdk.txt |
| `node --test entries/A10-tldraw/tests/snapshot-policy.test.mts` | 0 | JSON原值、缺失/循环失败、UTF-8超过3MB，3/3；validation/policy.txt |
| `pnpm exec tsc --ignoreConfig --noEmit --target es2022 --module esnext --moduleResolution bundler --jsx react-jsx --strict --skipLibCheck --esModuleInterop --types vite/client,node entries/A10-tldraw/examples/demo.tsx` | 0 | 当前入口/直接依赖，无输出；validation/typecheck.txt |
| `pnpm exec biome check --write entries/A10-tldraw/examples entries/A10-tldraw/tests entries/A10-tldraw/library.json entries/A10-tldraw/verification.json entries/A10-tldraw/official/source-audit.json entries/A10-tldraw/official/homepage-response.json entries/A10-tldraw/validation/check-entry.mjs` | 0 | 11文件，最终3文件仅格式化；validation/biome.txt |
| `node entries/A10-tldraw/validation/check-entry.mjs` | 0 | validateEntry/completeness、3场景4源文件、README bytes/hash、版本；validation/metadata.txt |
| `git diff --check -- entries/A10-tldraw` | 0 | 无空白错误；validation/diff-check.txt |
| `pnpm exec biome format --stdin-file-path=entries/A10-tldraw/validation/browser-proposal.ts < entries/A10-tldraw/validation/browser-proposal.txt` | 0 | 提案正常格式，未执行browser；validation/proposal-format.txt |
| `pnpm exec tsc --ignoreConfig --noEmit --target es2022 --module esnext --moduleResolution bundler --strict --skipLibCheck --types node entries/A10-tldraw/validation/.browser-proposal-check.ts` | 0 | 提案同字节临时.ts类型通过，检查后删除；validation/proposal-typecheck.txt |

真实SDK测试没有构造DOM/Editor/mock，没有证明画布或许可。SDK导入/Store探查在Node留下活动进程资源，手动终止自己的初始probe（exit -15，validation/sdk-probe.txt），不当PASS。第一候选曾用--test-force-exit结束，旧exit0日志保留为validation/sdk-force-exit-historical.txt；该方式不能兼容公共固定node --test，已由下述自有Worker实现取代。

首次SDK第二断言误以为loadSnapshot之后session仍未就绪，实际SDK已准备session，exit1保留sdk-initial.txt；改成核验实际document/session分离后只重跑该SDK套件，2/2。初始Biome exit1为旧div role语义与模板字符串，保留biome-initial.txt；修正为fieldset/具名section及正常字符串。脚本cwd路径和官网body超时的真实失败见tooling-notes.txt，不包装成SDK失败或PASS。策略与生产入口类型未因后续SDK测试修复重跑；入口类型在身份订阅改动后已通过。SDK测试因下述Worker改动定向重跑，最后只有格式/JSDoc改变时复用有效结果。

## 主控浏览器提案与剩余

validation/browser-proposal.txt提供3项可直接接入公共Playwright的完整源码，已类型/格式检查，但未执行。没有改公共e2e。

- basic真实tools.draw→canvas鼠标轨迹→count0→1/真实shape DOM；正常localhost等待超过SDK5000ms许可窗口再确认未tl-license-expired且工具仍可用，然后清空。
- business count4→保存→追加8→恢复4，原ID输出与SDK DOM一致；清空0后再恢复同ID。保存副本不被追加覆盖。
- advanced批量4→40→76→80；保存原4→只读禁写，真实canvas Ctrl/Cmd+A/Backspace不删除，退出只读恢复4；停止并卸载后重进4/无副本/可编辑，再离开Agent页签不残留canvas。

精确root a10-workshop(data-ready/data-readonly/data-level)，a10-shape-count/shape-ids/saved-shape-ids/saved-document/status/canvas，SDK自身标识tools.draw/canvas来自5.5.2源码。按钮为追加4个流程节点、有界批量创建形状、保存文档到内存、恢复已保存文档、切换只读/退出只读、清空当前形状、下载文档 JSON、缩放适合画布。

待主控独立复核和正常localhost真实浏览器、下批共享构建；中文IME、触控、屏幕阅读器、生产key授权、媒体离线、外部JSON、协作和性能未测。无新增公共能力需求。

## 变动文件和稳定交接

修改guide/agent/library/verification；正常排版并更新example/demo/snapshot-policy/styles与原policy suite；新增tests/sdk.test.mjs、official README/LICENSE/来源/完整头、local-validation和validation日志/核对器/提案。AGENTS约束保留，原来源事实保留。

本记录交付为STABLE检查点，随后停止写入，供主控独立review和下批候选构建。正式验收收据不在本轮伪造。

## 增量修复：兼容公共普通Node测试入口

主控发现公共sdk-runner.mjs实际固定调用node --test，会发现本条目sdk.test.mjs；原始主进程直接导入tldraw后留下全局活动资源，不能靠force-exit纳入公共套件。保留旧force-exit日志作历史记录，当前执行命令不再使用该参数。

主测试每项创建自己的Node Worker；tests/fixtures/store-worker.mjs内真实导入tldraw并运行原来的两组Store/schema/快照断言。正常完成后postMessage结果，异常以Worker error传播，提前退出或10秒无结果会失败。主测试校验结果，在finally清除自己的超时并await worker.terminate()，只终止自己创建的执行资源；Store本身也在Worker finally调用dispose。没有SDK mock、process.exit、跳过/更名测试或修改公共runner。独立Worker的执行资源清理不能推导浏览器Editor已卸载。

本轮只改tests/sdk.test.mjs、新增tests/fixtures/store-worker.mjs、validation runner/日志，以及本记录和agent.md的一句运行方式。生产示例/提案/政策/依赖/公共文件未改。

全部实际cwd仍为 /home/lambert/githubRepos/lambert/ReactLoom/packages/library-lab：

| 命令 | exit | 结果/日志 |
| --- | --- | --- |
| `node --test entries/A10-tldraw/tests/sdk.test.mjs` | 0 | 真实2/2且进程正常结束，不带force-exit；validation/sdk.txt。 |
| `pnpm exec biome check --write entries/A10-tldraw/tests/sdk.test.mjs entries/A10-tldraw/tests/fixtures/store-worker.mjs` | 0 | 仅受影响2文件，validation/worker-biome.txt。 |
| `pnpm exec tsc --ignoreConfig --noEmit --target es2022 --module esnext --moduleResolution bundler --strict --skipLibCheck --esModuleInterop --types node --allowJs --checkJs entries/A10-tldraw/tests/sdk.test.mjs entries/A10-tldraw/tests/fixtures/store-worker.mjs` | 0 | 仅受影响测试严格JS类型检查，validation/worker-typecheck.txt。 |
| `git diff --check -- entries/A10-tldraw` | 0 | validation/diff-check.txt。 |

原3项策略/入口类型/metadata/提案检查仍复用，browser仍NOT_RUN。六项结论不变，未将Worker生命周期当成SDK画布生命周期。重新STABLE后停止写入。
