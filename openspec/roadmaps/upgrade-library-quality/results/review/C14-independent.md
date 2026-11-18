# C14 date-fns 独立六项复核

复核者quality_e05，非作者；UTC `2026-11-10T17:28:27.657876+00:00`。实际cwd `/home/lambert/githubRepos/lambert/ReactLoom`，Git HEAD `1218066e706a90ba03fac8dff8c9b843dd2429c4`。原作者quality_e11已FINAL STABLE，本次授权仅本报告；未修改运行源/guide/agent/metadata/原文/测试/作者记录/公共文件，未安装、提交或推送，未运行有效SDK/policy/类型/build/浏览器套件。

**结论：未发现需原作者修复的P1/P2。** 六项在下述已验证本地范围通过，允许交root做内容状态裁定；不自行content_done，不升级正式verification。官网iframe实际可用性仍unknown，系统输入法/任意时区与ICU矩阵等仍NOT_RUN。

## 对象、材料与当前输入

独立读取条目AGENTS/library/guide/agent/verification/local-validation、全部六运行源、两测试、双原README与完整source-evidence、抓取脚本/受控传输fixture、安装源码审计/25源码类型文件hash、SDK原FAIL/现代4PASS/增量1PASS/policy3和探针原始日志、完整entry及公共browser-proposal、candidate18 browser/results/inputs/input-stability。没有把作者自评当作PASS。

实际只读Python SHA复核exit0：作者input-hashes.json记录的44文件零差异；25实际安装源码/类型文件零差异；六运行源分别直接比对candidate18 inputs和shared-evidence均零差异；entry提案/公共spec/候选提案SHA相同。两个已装package.json实际版本4.4.0/1.5.0、license MIT也独立读取核实。

- candidate18内容集合SHA：`7a8af9a5cb909275bbbbf4b33bd9008adbb5a2b841c2e46a372a0be8c647f52c`。
- inputs.json文件字节SHA：`a5de38cbece64c52405aa3b6b18991bddb07ba169046b8c93cde66cad8f5d121`。这是清单文件的hash，与上述集合摘要含义不同，没有误判为漂移。
- 当前entry/public三目标提案SHA：`65da0616e759de2157b749e9fe7dff35b223cadb0d83045a34f0f3c2026eb393`。
- 原始browser.txt SHA：`a6cd178feba5115a6decc51021beed7e6a721d5ddabcc58cac425db613311fde`；独立读原文确认四条@C14通过，未仅依赖作者复制的case列表。

## 六项独立结论

| 维度 | 结论/证据层级 | 独立核对 |
| --- | --- | --- |
| 技术准确 | PASS，实装源码/同源SDK/实际浏览器限定配方 | date-contract.ts真实TZDate/公开setter/回读、addDays in上下文、calendarDays与截断整数小时、parseISO前独立policy准确；TZDate默认format保留zone说明符合constructFrom链和增量真实SDK项。 |
| 解释清楚 | PASS，静态/真实结果对应 | guide:1–55用三目标区分civil/zone/instant，给可操作输入输出；guide:22–24明确1901只是三白名单现代配方范围，:51–55独立instant可用0001–9999且UTC输出可能越四位；:77说明format无in并非总设备区。没有假扩大SDK限制。 |
| Demo有用 | PASS，root固定candidate18三目标 | 原始browser.txt中basic/business/advanced三case实际PASS，断言真实当地中午/UTC、无效恢复/重置/离开重进、23/25/24/71小时与结果界、fold/独立低年instant和390px；没有mock SDK/route/clock。审查者没有重跑。 |
| 源码可迁移 | PASS，六源/类型/候选绑定 | examples六文件齐，正常格式、共享合同/策略声明/局部CSS，无Lab alias/宿主依赖；React useId/useState，level key重建session，同步计算无应用timer/监听/请求/实例清理。候选六源与当前一致，原入口strict/共享type-build可复用。 |
| 官方来源可靠 | PASS，双原文/固定版本/真实HTTP；iframe仍unknown | 固定v4.4.0 commit及core4.4.0/tz1.5.0 manifests；双README与实际安装README逐字节一致；完整tree无匹配中文，9实际HTTP记录完整rawHeaders，官网final200且XFO/CSP null，不升级allowed。 |
| 结果可复核 | PASS，本地SDK分段/原FAIL/浏览器证据可绑定 | SDK4+增量1和policy3分别读取原日志，原低年FAIL未删除；25源码/44输入/六候选源/提案/原浏览器log hash独立复核0差异；正式sdk/build/browser依旧NOT_RUN，非正式runner收据。 |

## 核心合同与范围取舍

**共享合同确实执行目标SDK。** examples/example.tsx:2–11导入calculateDateResult等，tests/sdk.test.mjs:7–14也直接导入同一date-contract.ts；不是测试自制同名算法。date-contract.ts:27–51使用公开TZDate.tz(zone,0)、setFullYear/setHours，再完整回读年月日时分秒毫秒，拒绝自动进位。输入四位正则限定上界9999，下界1901是示例guard，不是date-fns全球支持下界。运行时isZone白名单也检查，不只靠TS联合类型。

**原失败没有变造成功。** sdk-checkpoint.txt真实exit1/3PASS1FAIL；low-year-probe.txt显示0096纽约12:00:02、上海11:59:17、UTC12:00:00，1900上海同样有秒级漂移，而纽约1900样本中午为12:00:00。复核没有把某个历史探针读数推广到所有年份/时区，也没有用guard拒绝低年当作SDK低年成功。现代三白名单1901/2024/9999仍真正通过SDK构造/回读；独立instant低高年则走另一条真实parseISO路径。

**日历和持续小时分开。** date-contract.ts:60–73的count安全整数1–14、结果年范围在源中执行；实际addDays.js:50–58通过toDate/in克隆后setDate，不改start。differenceInCalendarDays有目标区上下文，differenceInHours使用epoch差且_lib/getRoundingMethod.js默认Math.trunc。文档明确整数小时不是任意精度持续时长，示例纽约样本23/25、三天71与实际浏览器断言相符。

**instant独立而不误借现代civil限制。** date-contract.ts:95–104只读取input.instant和固定纽约样本，真实SDK测试主动传irrelevant-invalid-draft/count0仍成功，避免无关草稿使advanced失效。instant-policy.mjs要求明确offset、实际公历月日、完整秒/最多3小数/±14:00并拒-00:00；随后parseISO/isValid。独立新增SDK1真实核0001/0096/9999与0096+08，不只是policy。偏移极值可能使UTC输出跨0000/10000，guide已如实说明为另一个存储范围决策。

**format语义核实。** 实装format.js:347调用toDate(date,options?.in)；toDate→constructFrom优先context函数/constructDateFrom symbol；@date-fns/tz/date/index.js的symbol构造同timeZone。故format(TZDate)无in可保留其区，普通Date无in才是host zone。源显式in，新增真实SDK断言还检查NY12:00-05与显式UTC17:00Z，未保留旧误读。

**UI和生命周期。** clearOutput在草稿变化后清结果/错误，calculate失败清旧结果，reset恢复默认，DateSession key=level隔离会话。标签通过useId，本地CSS负责控件宽度/换行/焦点。没有异步工作或可变SDK实例可取消，未造清理计数替代真实行为。候选basic离开重进结果清空已实际通过，未将普通键盘程序化输入说成OS IME验证。

## 官方原文、版本与官网

实际metadata与source-evidence的commit均`cd53d2538cfa318404eff7ade6449b49bf34562e`，v4.4.0 tag对象是commit本身；两个npm版本gitHead都null，固定pkgs/core/package.json4.4.0和pkgs/tz/package.json1.5.0交叉确认，未误借旧独立tz仓库。实际treeTruncated=false，根/core/tz候选无中文；core无独立README，主快照回退根README，tz快照为对应包目录原文。

| 原文 | 原始路径/语言 | 当前独立字节与SHA |
| --- | --- | --- |
| date-fns | README.md，en | 1814B，`87237646806588ea43e8a7d4c13880d09b42b14ab0a4b0bbb944855f25b82232` |
| @date-fns/tz | pkgs/tz/README.md，en | 9377B，`dc3a4466b53f9a5d2f06e0e3a5d38ce2858f565481471ec3747aee5f0718b264` |

两份与实际node_modules包README独立hash一致，同步UTC2026-11-10T17:03:33.235450+00:00。主README元数据版本/语言/ref/path/sourceUrl/SHA/date齐，tz独立包元数据在source-evidence且guide给出固定原文入口；没有把它伪装成另一份自译README。

source-evidence有9条200原始请求，官网最后一条final https://date-fns.org/，body NOT_READ/bytes null、原始响应19项，XFO/CSP null。复读公共官方case只验证快照和有依据unknown/直达按钮，iframe未加载；因此“官方case PASS”不代表iframe允许，保留unknown正确。

fetch-official.py的网络/版本步骤全部成功后才暂存两个README与JSON，再replace；except写独立failed并抛出，不finally破坏原成功文件。受控transport fixture在临时目录测试成功/首请求失败/两个README之后官网失败，并保留三份旧文件和重复头；原3PASS日志仅证明工具，不算新HTTP/SDK/browser。脚本/文档没有谎称跨文件崩溃事务保证。审查未重抓官方。

## 复用的真实执行及只读复核命令

原作者命令实际cwd为Lab，完整argv/UTC/exit在local-runs.json和对应raw txt：SDK现代合同`pnpm exec node --test entries/C14-date-fns/tests/sdk.test.mjs` exit0/4PASS；增量`--test-name-pattern 'actual explicit-offset low/high-year'` exit0/1PASS；纯policy3PASS；原低年FAIL/probe和受控传输3PASS都保留。审查者只读取，不重跑任何套件。

主控浏览器实际cwd Lab，命令`pnpm exec playwright test --config=.local-evidence/quality-playwright.config.ts e2e/quality-remediation-arborist.spec.ts e2e/quality-remediation-date-fns.spec.ts e2e/quality-remediation-primitives-sources.spec.ts --grep '@C11|@C14' --trace=off`，2026-11-10T17:16:01.123522至17:16:10.504722 UTC，exit0、implicitBuild=false；原始根路径docs/library-lab/evidence/quality-upgrade/candidate-18/browser.txt实际8/8，其中@C14三目标与来源共4/4。没有把另四条C11混入C14计数。

审查者实际cwd仓库根，仅执行只读`python -`脚本：逐份读取并hash author.files、audit.files.realPath、候选inputs.json运行源、entry/public提案、两份snapshot与安装README、browser.txt；比较shared-evidence记录的hash并数原始@C14通过行，退出0。工具实际输出摘要如下（不是测试结果模拟）：

```json
{"authorFiles":44,"authorDiffs":[],"installedFiles":25,"installedDiffs":[],"candidateRuntimeFiles":6,"runtimeDiffs":[],"actualC14PASS":4,"formal":"NOT_RUN"}
```

## 未测与停写

不推断任意IANA区、日历1901年前、任意ICU/TZDB/所有浏览器、SSR hydration、系统IME/触屏/读屏、持久化/后台调度/部署或正式收据。上述边界在guide/agent/local-validation已有说明，无需为本次复核重复SDK或新增不相关实验。

**REVIEW STABLE：`2026-11-10T17:28:27.657876+00:00`。本次唯一写入为本报告，现已停止全部C14写入；其他条目未读写/未提前固定下一任务，交root按实时队列调度。**
