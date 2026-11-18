# C21 tailwind-merge 独立质量复核

复核者：`/root/c21_review`。范围是当前 C21 条目和既有验收证据；未参与该条目实现，仅新增本报告。当前工作区 HEAD 为 `1218066e706a90ba03fac8dff8c9b843dd2429c4`，条目有未提交成果，全部保留。模型、推理档位和实际权限无法从可核实的运行元数据确定，记为 UNKNOWN。

## 结论

发现 **1 项 P2 记录一致性缺口**，修复前阻止 `content_done`。真实合并模型、单实验设计、迁移源码和官方来源未发现 P1/P2 实现问题。已有本地 SDK 5 项及 candidate21 中 C21 的 2 项真实浏览器检查可复用；本次未重跑 SDK、浏览器、构建或全量测试。

### P2：浏览器验收前的待办仍被当作当前状态

- 位置：`guide.md:97` 写“作者尚未执行真实浏览器”；`local-validation.md:11`、`:14`、`:76`、`:80` 将本条真实浏览器、实际 CSS、hover、断点与卸载仍列为 NOT_RUN/待 root；`verification.json` 的 build/browser note 仍是“主控下一匹配候选 build 尚待”“作者真实 browser NOT_RUN”。这些句子是作者早于验收的检查点，尚未接入随后完成的实际结果。
- 证据：`docs/library-lab/evidence/quality-upgrade/candidate-21/browser.txt` 中 C21 的完整实验和官方原文/禁止嵌入展示均 PASS，整条命令 exit 0，6/6 总用例中 C21 占 2 项。`candidate-21/results.json` 另有 matching Lab typecheck/build/catalog 的真实 exit 0。
- 影响：读者和恢复任务的工程师无法由条目当前记录判断哪些操作已经实际运行，可能重复执行已有效的检查，也不满足讲解、源码和实际结果一致的收尾要求。“作者没有亲自运行”不能替代条目的当前本地验收状态。
- 处理：由条目作者小范围更新 guide、local-validation 和 verification 的说明，引用 candidate21 的实际命令、输入和结果；正文移走交接型维护措辞。保留正式 sdk/build/browser 的 `NOT_RUN`，保留触屏、读屏、跨浏览器、任意插件/非默认主题、SSR、性能等实际未测范围。修复仅涉及记录，不要求重跑未受影响 SDK、HTTP 或 UI；独立复核修订 delta 后才可闭环。

## 六项结果

| 维度 | 结论 | 核查证据与范围 |
| --- | --- | --- |
| 技术准确 | PASS，静态复核 + REUSED 真实 SDK | `guide.md:3–85` 与 `examples/merge-model.mjs` 的 clsx→twMerge、px/pr 非对称冲突、modifier/important、未知类和真实扩展一致。实装 `merge-classlist.ts:27/97–107` 与 `default-config.ts:2471` 支持扫描及冲突解释。`tests/sdk.test.mjs` 真实导入目标 SDK/共享模型，既有 `validation/sdk.txt` 为 5 PASS / 0 SKIP / exit 0。 |
| 解释清楚 | FAIL，P2 记录待修 | 工程问题、输入→合并→实际 DOM、最小 cn、变化和 CSS 前提均清楚；`guide.md:97` 的验收前交接措辞仍需和已执行结果对应。 |
| Demo 有用 | PASS，REUSED 真实浏览器 | 一个完整实验符合轻量同步库复杂度；八预设是同一表单的输入，不虚增三层目标。真实 `e2e/quality-remediation-tailwind-merge.spec.ts:27–110` 检查基础/变体/调用者、actual class、loaded CSS、方向、响应断点、hover、自定义组、重置和真实 DOM 断开/重挂。candidate21 对应单 case PASS。 |
| 源码可迁移 | PASS，静态 + REUSED strict/build | 唯一 basic 的 5 个 sourceFiles 为 example/demo、模型、声明、CSS，均实际存在。无 Lab alias、网络 fixture 或遗漏资源；`guide.md:75–89` 声明 React/Tailwind4 及动态类编译前提。状态局部持有，扩展合并器模块级复用，无监听/timer/Worker/storage 需清理。既有入口 strict 与 candidate21 build exit 0。 |
| 官方来源可靠 | PASS，原文/HTTP/本地 UI 证据 | registry gitHead 缺失时通过 release tag→固定 commit `511d68a65d8fa11ae8a549b5a1d5cf4dced41101`→目标包 manifest 3.7.0 交叉核对；目标包无中文候选，英文 README 原文 2549B/SHA `b7686c3623d44ff744eebef1bc9a2b8ab36cee4e491d1c609fc8131e67d2f2b3` 与安装包逐字节一致。`official/source-evidence.json` 保留 7 HTTP/重复头，GitHub CSP `frame-ancestors 'none'` 与 XFO deny 支持 blocked；candidate21 原文/直达/禁止加载展示 PASS，不宣称官网允许嵌入。 |
| 结果可复核 | FAIL，P2 记录待修；运行证据 REUSED | 原始命令、退出码、日志、固定输入均存在且本次比对未漂移；条目收尾记录尚未纳入已完成浏览器和构建结论。修复说明后可复核关闭；不得将本地证据升级为正式收据。 |

## 复用证据及输入核对

- candidate21 输入 SHA：`11b1313558ef9191b68ceb7e749b4a7fca8733d3883262871ce1d0e5a1f3368a`，以 `candidate-21/inputs.json` 为准。
- 只读 Python SHA256 核对（cwd 仓库根、exit 0）：candidate21 中 C21 的 39 个已记录输入 changed=[]；作者 content-input-hashes 的 14 个输入 changed=[]；实装/宿主审计 19 文件 changed=[]；browser-binding 的 3 个测试源 changed=[]。首次检查把 browser test 相对路径误当仓库根，FileNotFoundError；改用记录的 Lab cwd 后核对通过，未因此重跑任何验收。
- `examples/example.tsx` SHA：`79cfa81f2c58ef256583c20b85b522a77e0aaa861e9e9e253f19d260259fd218`；模型 SHA：`5f4849643b490134d1e952aba6101d7d5db3c1d1d38940cbf27f8829ac5d057c`。其余运行源通过 candidate21 和内容清单逐份比对。
- SDK：cwd `packages/library-lab`，`pnpm exec node --test entries/C21-tailwind-merge/tests/sdk.test.mjs`，exit 0，5 PASS；日志 `entries/C21-tailwind-merge/validation/sdk.txt`，实际记录时长 47.184024ms。
- 浏览器：cwd `packages/library-lab`，`pnpm exec playwright test --config=.local-evidence/quality-playwright.config.ts e2e/quality-remediation-nuqs.spec.ts e2e/quality-remediation-tailwind-merge.spec.ts e2e/quality-remediation-primitives-sources.spec.ts --grep @C19|@C21 --trace=off`，exit 0，6 PASS（C21 2 项），8.7s；日志/JSON 为 `candidate-21/browser.txt`、`browser.json`，baseURL `http://127.0.0.1:4319`，implicitBuild=false，绑定见 browser-binding 与 browser-build-binding。
- matching Lab typecheck/build/catalog：cwd 仓库根，命令/UTC/exit 0 见 `candidate-21/results.json`，原始日志分别为 `typecheck.txt`、`build.txt`、`catalog.txt`；输入稳定 `input-stability.json` changed=[]。此为本地 Lab 构建证据，不是独立库打包配方或正式收据。

正式 sdk/build/browser 收据均 **NOT_RUN**，等待干净、已授权提交输入和正式 recorder。当前不存在需要重新尝试的网络/许可阻塞；剩余工作是作者修订 P2 记录及独立 delta。

## 2026-11-11 非作者 delta：P2 CLOSED

复核者 `/root/c21_delta_review`，UTC `2026-11-11T05:49:48Z`，工作区 HEAD 仍为 `1218066e706a90ba03fac8dff8c9b843dd2429c4`。本次只追加本报告，C21 entry 只读；模型、推理档位和实际权限为 UNKNOWN。对照作者 `validation/copy-fix-evidence.json` 的新旧摘要及 candidate21 原始输入复算，确认唯一变化为 `guide.md`、`local-validation.md`、`verification.json`，其余36个候选条目输入未变。

原P2已关闭。`guide.md:97` 现在说明真实SDK与本地浏览器已检查的能力，并继续保留触屏、读屏、其他浏览器、非默认主题/插件、SSR和性能未验证边界。`local-validation.md:11`、`:14`、`:74` 起准确记录唯一实验1case与官方来源/blocked展示1case，整批6/6、exit0、8.7s，以及实际cwd、argv、UTC和原日志；没有把整批6项计为C21的6项。`verification.json` 的build/browser note已接入本地候选结果，content/sdk/build/browser所有正式status仍为NOT_RUN，未把Lab宿主构建当成本库独立打包或正式receipt。

独立只读核对结果：5个sourceFiles、官方README及SDK/原日志均在未变化的36个候选输入中，摘要与candidate21一致；3个相关公共浏览器测试源也逐字节未变。9个guide链接的本地目标存在，三个文档新旧摘要与copy-fix记录一致，verification JSON语法和标准两空格排版一致。运行源与结果未变化，因此复用既有SDK5、C21本地浏览器2项和matching Lab typecheck/build/catalog exit0，未重跑SDK、UI、HTTP、构建或Biome。

`validation/copy-fix-biome-failed.txt` 原样保留 `pnpm exec biome check packages/library-lab/entries/C21-tailwind-merge/verification.json` 的exit254与“possibly out of memory”；`local-validation.md:106` 及copy-fix证据都明确记FAIL。本报告不将该命令改记PASS。该工具失败不改变本次独立核对到的JSON语法/排版和文案事实结果；代码未变，当前P2可关闭，工具可用性仍未被重新证明。

本次只读核查命令为仓库根 `python3 -`，执行SHA256、相对链接、JSON标准序列化和已保存命令/退出码检查，exit0。原始输出在本节保留：

```text
cwd=/home/lambert/githubRepos/lambert/ReactLoom
command=python3 - (C21 independent delta hash/link/JSON/receipt/result checks)
candidate21EntryInputs=39; changed=["guide.md", "local-validation.md", "verification.json"]
remainingCandidateEntryInputs=36 unchanged; sourceFiles=5 unchanged; officialREADME digest=unchanged
documentationBeforeAfterDigests=matched; guideLinks=9 targets present; verificationCanonicalJSON=PASS
browser=REUSED C21 2 of 6 PASS, exit0, implicitBuild=false; host typecheck/build/catalog=REUSED exit0
relevantPublicBrowserSources=3 unchanged; formalStatuses=all NOT_RUN
biome=FAIL exit254 preserved; no SDK/UI/HTTP/build/Biome rerun
exitCode=0
```

六项当前结论：技术准确、解释清楚、Demo有用、源码可迁移、官方来源可靠、结果可复核均PASS，证据层级沿用上述静态/REUSED本地执行范围。未发现其他P1/P2，可由主控标记content_done；正式收据保持NOT_RUN。
