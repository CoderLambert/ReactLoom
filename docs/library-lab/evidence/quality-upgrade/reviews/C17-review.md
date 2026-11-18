# C17 i18next 当前独立复核

Reviewer：`/root/c17_review`。工作区：`/home/lambert/githubRepos/lambert/ReactLoom`；HEAD `1218066e706a90ba03fac8dff8c9b843dd2429c4`。模型及推理档位的独立运行元数据为 UNKNOWN；权限由父会话继承。本次只读条目与既有证据，仅新增本报告，没有改条目文件、公共输入、队列或正式收据。

## 结论

真实 SDK、三个 Demo、迁移源、官方快照与既有浏览器结果可以继续复用，未发现实现方面的 P1/P2。发现一处解释清楚 P2：指南末尾仍混入候选批次和正式收据管理信息。按本次用户要求与 Skill 的内容约定，先做一次限定文案修复，再关闭 content_done；无需重跑 SDK、HTTP、build 或浏览器。

旧 `validation/independent-review.md` 是 `/root/quality_e11` 已完成的独立审阅。本次重新读真实源、指南与原始日志，并核实其保护输入没有变化；没有将旧报告的结论自动当作当前通过。

## 需要作者处理

**P2，guide.md:75–77：把候选/收据维护信息移出教学正文。**

第77行同时写“固定候选19”“七份运行源与候选20相同”“正式 sdk/build/browser 收据状态仍为 NOT_RUN”及维护命令位置。这些信息解释当前整改流水线，不能帮助首次使用 i18next 的工程师理解实例、资源、语言变化或迁移接入。它们已经完整保存在 `local-validation.md` 和 `verification.json`，不需要在指南再维护一份。

建议：保留本例实际覆盖的行为和真实未测边界，将候选编号、文件比对、测试计数与正式 recorder 状态留在维护材料。正文仍应清楚说明没有 HTTP backend、真实网络取消、SSR 租户隔离等实验。不要因为移走管理信息而扩张验收范围或改写正式 NOT_RUN。

依据：用户要求“移走干扰理解的维护历史”；`library-lab-quality/references/content-and-demos.md` 明确“收据管理、通道历史、旧分支、整改轮次归维护材料”。这是文案边界问题，不是源码运行失败或过期的本地浏览器结论。

## 六项结果

| 项目 | 当前判定 | 真实依据与范围 |
| --- | --- | --- |
| 技术准确 | PASS，静态与 REUSED 真实 SDK | `examples/i18n-client.mjs:24–58` 实际 createInstance/init/addResourceBundle/所属 callback off；`language-switch.mjs:10–39` 自建串行最新意图队列。实装 26.4.3 的9个审计文件摘要未变；SDK原始5 PASS/exit0。 |
| 解释清楚 | FAIL，P2限定文案 | `guide.md:3–73` 已解释选型、资源/参数、复数/回退、输入处理结果、三目标和迁移；第77行候选与收据管理信息仍需移入维护记录。 |
| Demo 有用 | PASS，REUSED 真实浏览器 | basic 插值/复数/文本输出；business 实际 bundle 写入与新实例隔离；advanced 回退详情、SDK事件与应用提交分离、重置和卸载。`candidate-19/browser-i18next.txt` 三目标3 PASS/exit0，断言来自公共实际 e2e，未 mock SDK。 |
| 源码可迁移 | PASS，静态与固定运行源 | `library.json` 三场景各列同一七源，含 MJS 声明和 CSS；`example.tsx:57–115` init晚回保护、所属订阅解绑、队列dispose；清楚说明 dispose 不取消已开始SDK Promise，没有虚构 destroy。七运行源与候选19一致。 |
| 官方来源可靠 | PASS，原文与已有实际响应 | 官方 tag/npm gitHead/manifest共同绑定26.4.3提交 `0d2845a2360dcc236fe9681f849781f5dfdd35c4`；英语 README 5593B、SHA `3964fe947138fb6369c58bbc7779eacc8877cf220d41db7647c9e4bd7c466966`。完整树仅一份README，无官方中文。`official/source-evidence.json` 保存强制 CSP，仅把当前HTTP Lab判为blocked，保留直达；未从200/load推允许。 |
| 结果可复核 | PASS，限定本地层级 | SDK5、policy4分开；候选19三目标与候选20官方展示共本条4 PASS。候选20整命令exit1/2 PASS 3 FAIL原样保留，三个失败属于当时C19，不冒称整批通过。正式sdk/build/browser均仍NOT_RUN。 |

## 本次独立核对

本次对 `guide.md`、`agent.md`、`library.json`、`verification.json`、七份运行源、两套测试、原文/来源记录、`local-validation.md`、现有非作者报告和候选19/20/21有关日志做只读核对。

在仓库根运行 Python 标准库 SHA-256 复算，退出码0；原始输出要点如下（摘要计算本身不是SDK或浏览器运行）：

```json
{
  "authorFiles": { "count": 47, "changed": [] },
  "protectedInputs": { "count": 13, "changed": [] },
  "evidence": { "count": 7, "changed": [] },
  "runtime19": { "count": 7, "changed": [] },
  "installedFiles": { "count": 9, "changed": [] }
}
```

复算输入是 `validation/input-hashes.json.files`、`validation/shared-validation-binding.json` 的 `protectedInputs/evidence`、`candidate-19/c17-runtime-reuse.json.runtimeFiles` 和 `validation/sdk-source-audit.json.files`；按每项真实路径读取字节，使用 `hashlib.sha256(path.read_bytes()).hexdigest()` 与保存值逐项比较。47份作者文件不含其摘要自身；后加入的旧独立报告不冒充作者输入。

另直接读取匹配安装的 `dist/esm/i18next.js:252–270,379–403,1902–1921,2015–2038,2068–2083`：无callback的off删除事件所有监听；addResourceBundle复制/深合并并发出added；init返回deferred；changeLanguage发出languageChanged后resolve；getFixedT固定语言。这与当前实现及指南相符。读取官方快照字节数5593，与保存摘要及安装README相同。

## 复用执行记录

| 原命令与 cwd | 实际结论 | 原始日志 |
| --- | --- | --- |
| Lab cwd：`node --test entries/C17-i18next/tests/sdk.test.mjs` | REUSED，真实SDK5 PASS/exit0 | `packages/library-lab/entries/C17-i18next/validation/sdk.txt` |
| Lab cwd：`node --test entries/C17-i18next/tests/language-switch.test.mjs` | REUSED，纯策略4 PASS/exit0，非SDK替代 | `packages/library-lab/entries/C17-i18next/validation/policy.txt` |
| Lab cwd：`pnpm exec playwright test --config=.local-evidence/quality-playwright.config.ts e2e/quality-remediation-i18next.spec.ts --trace=off` | REUSED，三目标3 PASS/exit0 | `docs/library-lab/evidence/quality-upgrade/candidate-19/browser-i18next.txt` |
| Lab cwd：`pnpm exec playwright test --config=.local-evidence/quality-playwright.config.ts e2e/quality-document-links.spec.ts e2e/quality-remediation-primitives-sources.spec.ts e2e/quality-remediation-nuqs.spec.ts --grep 'versioned migration patch\|@C17\|@C19' --trace=off` | REUSED，C17官方展示单项PASS；整命令2 PASS/3 FAIL/exit1 | `docs/library-lab/evidence/quality-upgrade/candidate-20/browser.txt` |
| 根cwd：`pnpm --filter @reactloom/library-lab typecheck`、`build`、`catalog:check` | REUSED，候选20共享三命令各exit0，稳定输入changed=[]；不作为本条独立正式收据 | `docs/library-lab/evidence/quality-upgrade/candidate-20/results.json` 及同目录原始日志 |

候选21不新增C17运行结论，未为本条重复执行任何测试。OS输入法、真实HTTP backend失败/中止、SSR、全局资源/监听普查仍NOT_RUN；正式 recorder 收据仍等待主控和授权条件。P2处理后只需独立检查指南新文案、对应维护记录和摘要变化，不需要扩大验证。

## 限定文案修复的非作者 delta 复核

Reviewer：`/root/c17_delta_review`，2026-11-11T05:46:08 UTC。工作区及 HEAD 仍为本报告所列的共享脏工作区与 `1218066e706a90ba03fac8dff8c9b843dd2429c4`；独立运行元数据中的模型、推理档位与实际权限为 UNKNOWN。此次只审查作者文案修复，并追加本节，没有修改条目或共享运行输入。

**P2 CLOSED。** `guide.md:77` 现在直接说明本例实际覆盖的插值、复数、回退、资源隔离、串行最新意图、所属 callback 解绑和三个 Demo 操作，以及仍需另验的系统输入法、SSR 租户隔离、全局监听和真实网络取消。候选编号、源文件比较、计数与正式收据管理已移至 `local-validation.md:76–82`；正文仍保留对接入取舍有用的边界，没有扩大 SDK 或浏览器结论。`guide.md:79–81` 的固定官方原文及当前 HTTP Lab 的 blocked 限定也保持准确。

`local-validation.md:78` 准确保留候选19三个 Demo 的 3 PASS 和候选20官方展示单项 PASS，共本条 4 个本地浏览器 case；候选20混合命令的 2 PASS / 3 FAIL / exit1 仍原样保留。第82行明确此前作者 FINAL 的“非作者未审”状态属于历史段落，当前限定修复由本节接续。正式 `verification.json` 的 sdk/build/browser 三个状态仍为 `NOT_RUN`。

在仓库根运行 Python 标准库的逐文件 SHA-256、正式状态和相对链接检查，exit0。原始输出如下；这次检查是静态文案 delta 核对，不是新的 SDK、HTTP 或浏览器执行：

```text
utc=2026-11-11T05:46:08.135992+00:00
cwd=/home/lambert/githubRepos/lambert/ReactLoom
command=python3 - <<'PY'  # hashlib/pathlib/json，逐文件与保存摘要比较，并检查文档相对链接
author_baseline_count=47
author_baseline_changed=['guide.md', 'local-validation.md']
protectedInputs={'count': 13, 'changed': []}
evidence={'count': 7, 'changed': []}
runtime7_changed=[]
formal_statuses={'sdk': 'NOT_RUN', 'build': 'NOT_RUN', 'browser': 'NOT_RUN'}
guide.md.sha256=83f89e007168ba4efe141d86d52f889e99d5768f97ad2e2272cff7200df73b87
local-validation.md.sha256=b8b3686847d9d08690000c194f2b4b7e7da063d7e26445c7b86a1122280fa92f
missing_relative_links=[]
exitCode=0
```

摘要依据为 `validation/input-hashes.json.files`、`validation/shared-validation-binding.json` 的 `protectedInputs/evidence` 和候选19 `c17-runtime-reuse.json.runtimeFiles`；文档摘要与作者 `validation/copy-fix-check.txt` 的修复后记录一致。作者已有单库 metadata/link 检查 exit0 继续 REUSED；本复核未重跑它或 SDK5、policy4、本地浏览器4 case。

本 delta 将“解释清楚”从原 P2 FAIL 调整为 **PASS**，其余五项原结论有效，当前未发现阻止内容完成的 P1/P2。主控可按用户的内容质量要求推进 C17 的状态；正式 recorder 收据及原列明未测能力继续保留 NOT_RUN。
