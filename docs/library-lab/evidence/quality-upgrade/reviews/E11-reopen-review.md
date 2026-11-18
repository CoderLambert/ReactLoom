# E11 过期本地浏览器待验说明复审

复审时间：2026-11-11 05:55 UTC。范围是 E11 重新打开的原因与已有浏览器证据链；只读条目、候选记录与当前源码。未运行 SDK、Playwright、构建或网络请求，未修改 entry、公共代码或队列。实际 cwd 为 `/home/lambert/githubRepos/lambert/ReactLoom`；HEAD 为 `1218066e706a90ba03fac8dff8c9b843dd2429c4`。当前条目32文件摘要为 `1d0711795d34f7e89479d4e6c781b2e1ea25644dede5baca31c97890ff22b083`，与已验收结果记录一致。保留全部既有 dirty 工作。

## 裁定

**P2 成立，但原因是文案未同步已有真实结果；不存在“修复后 basic 场景从未运行”的缺口。** 保持 `review_pending`，等待作者限缩更新 guide/local-validation，并由非作者核对文案即可。无需重跑已有效的 SDK/UI。

`guide.md:87` 仍称浏览器交互“尚待主控完成”；`local-validation.md:69` 仍称当前交付 `review_pending`，末段 `:83` 更明确称修复后的浏览器路径为 `NOT_RUN`。这些是作者交接时准确的历史状态，但当前文件未标明已由后续结果取代，读者会把它们理解成当前缺口。正式 `verification.json` 的三项 `NOT_RUN` 则准确：它们指正式 recorder 收据，不得改为 PASS。

## 原始浏览器结果逐项还原

| 记录 | 真实范围与结果 | 对 E11 的含义 |
| --- | --- | --- |
| [candidate02 首次日志](../candidate-02/browser-initial.txt) | preview 不在服务，存在 `ERR_CONNECTION_REFUSED`；保留该次失败 | 不把连接失败当成SDK行为缺陷，也不取其通过结论 |
| [candidate02 有服务后的重跑](../candidate-02/browser-retry.txt):14–24、62–66 | 混合13项，12 PASS/1 FAIL，exit1；E11 的自动输入暂停/结束/重挂、GFM及资源策略、实际interval卸载清理、窄屏、官方README五项 PASS；basic累计正文/修复开关一项 FAIL | **E11 本次是5 PASS/1 FAIL**，不能把整批12 PASS称成E11通过 |
| 同一日志 :27–50 | 取消“修复未闭合语法”后，`[data-streamdown="strong"]` 应为0却仍为1；失败断言为 suite `:81` | 与条目记录的2.6.0 memo comparator问题吻合；原始失败保留 |
| [candidate03 修复后定向重跑](../candidate-03/browser-initial.txt):25、27–29 | `@E11 cumulative deltas render incomplete syntax and finish with real Markdown` PASS；混合16项全部 PASS，exit0 | 修复后的**同一原失败目标**已真实运行并通过；只重跑这一E11受影响case，其他五项按有效范围复用 |

candidate02 的 [命令记录](../candidate-02/browser-retry.json) 为 `pnpm exec playwright test --config=.local-evidence/quality-playwright.config.ts quality-remediation.spec.ts p0-risk-lifecycle.spec.ts --grep '@E05|@E11|@F05'`，cwd 为 `packages/library-lab` 的绝对路径，2026-11-10 09:39:39–09:39:54 UTC，exit1、`implicitBuild:false`。

candidate03 的 [命令记录](../candidate-03/browser-initial.json) 为 `pnpm exec playwright test --config=.local-evidence/quality-playwright.config.ts quality-remediation-next.spec.ts a06-approval.spec.ts p0-risk-lifecycle.spec.ts quality-remediation.spec.ts --grep '@A01|@A06|@B09|cumulative deltas'`，同一 cwd，2026-11-10 09:51:10–09:51:31 UTC，exit0、`implicitBuild:false`。其 [inputs](../candidate-03/inputs.json) 记录三位写入者的稳定确认；[build binding](../candidate-03/browser-build-binding.json) 绑定实际dist。

因此当前可复用的 E11 本地浏览器范围是**6个case**：candidate02五个通过项，加candidate03修复后通过的一项。它们不证明所有交接断言、所有环境或真实模型网络已通过。例如现有business case检查GFM、禁用checkbox、无script/img/javascript链接和官方链接；不能扩大成所有外网请求、触摸/读屏或任意安全输入均已验收。官网iframe仍为 `unknown`，README通过不等于官网可嵌入。

## 当前输入与既有结果对应

静态SHA-256核对 exit0：11份声明 sourceFiles（9份examples运行源及2份测试源）全部与 candidate03 `inputs.json.files` 逐字节一致；当前 `e2e/quality-remediation.spec.ts` 也与 candidate02、03完全一致。candidate02→03只有 `examples/example.tsx` 在这11份来源中改变，其余10份未变；这是随repair开关切换renderer key的修复。当前entry相对candidate03仅 `verification.json` 不同，为后续正式收据说明文案。

当前源码确实含 `key={repairIncomplete ? 'repair-enabled' : 'repair-disabled'}`，保持会话和累计正文，仅重建renderer；当前suite `:80–82` 仍执行原关闭开关与源文保持断言，没有放宽原失败断言。

共享文件不是全部同SHA，不能称“整个工作区输入未变”：当前lock/workspace相对candidate03仅为B15的react-grid-layout补丁配置，当前Lab package相对candidate03仅为新增 `tests/readme-html-fallback.test.mjs` 的平台测试命令token。静态核对 `git show HEAD` 的lock/workspace字节与candidate03一致，再结合当前Git diff确认以上差异；把当前Lab package字节中该token移除后SHA与candidate03一致。此处据具体差分判断这些后续变化不改变E11运行依赖图。当前安装目录读取为streamdown 2.6.0、React/React DOM 19.3.0；没有执行SDK来获得此版本信息。

## 六项状态（限本次重新打开范围）

| 维度 | 状态与证据层级 |
| --- | --- |
| 技术准确 | FAIL/P2：当前浏览器待验事实与candidate03实际结果不一致；核心SDK行为没有发现新的运行缺口 |
| 解释清楚 | FAIL/P2：guide把历史交接流程和当前边界混在一起，容易把正式NOT_RUN误读为本地没有运行 |
| Demo有用 | PASS（REUSED）：两个独立目标对应真实SDK与上述6个本地case；本次不重新完整审查 |
| 源码可迁移 | PASS（REUSED）：声明源码与已接受candidate03一致，本次未改源 |
| 官方来源可靠 | PASS（REUSED）：官方固定快照及unknown状态未变；不把README展示扩大成iframe通过 |
| 结果可复核 | PASS（原始证据链）：失败、修复后通过、命令/cwd/退出码及输入都有原始记录；当前文案矛盾按上述P2修正 |

## 最小后续动作

作者只需修正 `guide.md:87` 的过期待验句，正文用能力覆盖与真实未测边界表达，候选批次和收据流程放维护记录。`local-validation.md` 可以保留原始作者 `NOT_RUN` 和失败经过，但要清楚标为当时交接历史，并增加当前本地验收段，引用上述具体日志、五项复用和一项修复后PASS。保留首批失败，不写成当时已通过。

正式 `verification.json` 状态继续 `NOT_RUN`；真实模型请求/取消、跨浏览器、读屏/触摸、性能、官网iframe未知等现有限制不得删除。作者文案稳定后，非作者只核事实、链接、格式和文档摘要即可；不需要再次SDK/UI/HTTP或全量构建。

## 本次实际命令与限制

所有命令cwd均为仓库根。`rg`/`nl`/`cat` 读取候选日志、命令JSON、guide、local-validation、suite、entry metadata、实际源码及规则，exit0。Python静态摘要核对读取candidate02/03 `inputs.json.files` 并用 `hashlib.sha256` 比较当前声明sourceFiles及suite，exit0；`git diff -- pnpm-lock.yaml pnpm-workspace.yaml packages/library-lab/package.json` 用于上述共享变化分类，exit0。Python直接读取安装包manifest得到三个版本，exit0。报告自身是本次只读核查记录；原始运行日志链接见上表。

两个资料定位探查曾失败并已纠正：误读不存在的 `packages/library-lab/IMPLEMENTATION.md` 得exit2，随后从 `docs/library-lab/` 读取；用 `require.resolve('streamdown/package.json')` 遇 `ERR_PACKAGE_PATH_NOT_EXPORTED` 得exit1，改为只读实际安装manifest。它们不是SDK或浏览器验收，不计PASS。

结束静态核对 exit0，输出：`report links 7 missing [] trailing whitespace [] E11 entry unchanged 32 1d0711795d34f7e89479d4e6c781b2e1ea25644dede5baca31c97890ff22b083`。仅新增本报告；未修改E11和任何运行输入。已停止写入。

## 2026-11-11 06:03 UTC 非作者 delta 复核

**P2 CLOSED，可恢复 content_done。** 本次仅复核上述重新打开问题及作者的限缩文案修复，没有重做完整SDK/功能评审。技术准确、解释清楚两项恢复PASS；Demo有用、源码可迁移、官方来源可靠及结果可复核沿用前述有效证据，六项当前均PASS。正式 `sdk/build/browser` receipts继续NOT_RUN，官网iframe继续unknown。

`guide.md:87` 现列本地已覆盖的累计正文/修复、暂停结束、实际interval卸载、GFM策略、窄屏和README，并保留真实模型网络、跨浏览器、读屏触摸及性能未验收范围，候选批次和主控交接过程已移出正文。`local-validation.md:3` 明确原交接表是历史状态；`:71`、`:85` 保留原交接和修复时NOT_RUN，`:93–98` 准确补入candidate02五PASS/原basic一FAIL、candidate03同一原失败目标修复后PASS。它没有把整批13项的12PASS算成E11，也没有把candidate03整批16PASS算作E11的16项。失败→修复→通过链仍可复核。

独立静态核对确认作者 `validation/editorial-fix-evidence.json` 的32个既有文件中仅guide/local-validation两份改变，其余30个保护文件未变；11份声明来源逐字节匹配candidate03，13个文档相对链接均存在。所有正式状态仍NOT_RUN，官网metadata为unknown，固定原文/SDK/原日志未变。当前entry34文件，摘要 `0f836c554848a8d260ff7c0c8d6d8f905029a29996e5da3bfc732f068c124806`，与作者交付一致。

实际命令cwd为 `/home/lambert/githubRepos/lambert/ReactLoom`，HEAD `1218066e706a90ba03fac8dff8c9b843dd2429c4`。只读 `python - <<'PY'` 静态摘要/JSON/链接/原日志断言检查，内含限定 `git diff --check -- <E11>/guide.md <E11>/local-validation.md`，2026-11-11T06:03:15.996619+00:00 完成、exit0。完整结果要点如下，作为本次原始静态核对日志；没有SDK/UI/HTTP/build执行：

```text
changedExisting=['packages/library-lab/entries/E11-streamdown/guide.md', 'packages/library-lab/entries/E11-streamdown/local-validation.md']
protectedExisting=30 unchanged; declaredSources=11 match candidate03; relativeLinks=13 exist
REUSED candidate02 E11 5 PASS + 1 original FAIL; candidate03 repaired same target PASS
formal sdk/build/browser=NOT_RUN; iframe=unknown; historical tables labelled; guide maintenance candidates removed
entryFiles=34 sha256=0f836c554848a8d260ff7c0c8d6d8f905029a29996e5da3bfc732f068c124806
scoped git diff --check exitCode=0
exitCode=0
```

首次静态探查错误使用不存在的 `homepage.iframeStatus` 字段得KeyError/exit1；只读metadata确认实际字段为 `homepage.status` 后纠正核对脚本，上述静态检查exit0。此失败是复核脚本字段定位错误，不是条目或运行验收失败，保留此事实且未重试SDK/UI。作者原始文案检查日志仍为 `validation/editorial-fix-check.txt`，原浏览器运行日志仍为上表candidate02/03文件。本次只追加本报告，条目只读。
