# C16 Luxon本地质量整改

Owner quality_e05；实际cwd `/home/lambert/githubRepos/lambert/ReactLoom`，Git HEAD `1218066e706a90ba03fac8dff8c9b843dd2429c4`。原13文件接手时无diff，原bytes/SHA在[baseline.json](validation/baseline.json)；调度冻结的中间事实保留在[handoff-checkpoint.md](validation/handoff-checkpoint.md)。从实际目录接手，没有从HEAD覆盖；只写C16、保留其他工作者，没有公共src/scripts/e2e/依赖/锁/索引/队列/results或安装、提交推送。作者未运行全目录generate/typecheck/build或隐式浏览器build。

## 六项复核

| 维度 | 当前结论与层级 | 证据/边界 |
| --- | --- | --- |
| 技术准确 | PASS（作者静态/实际SDK） | 实装Luxon3.7.2与独立@types3.7.6分开；固定npm gitHead/manifest匹配。共享日期与墙上时间合同、同瞬间/日历单位/半开Interval/getPossibleOffsets和回读语义已用实际SDK8验证，未用policy代替SDK。 |
| 解释清楚 | PASS（作者静态） | guide从每天纽约中午排程问题→日历/wall/offset/instant→3目标→关键输入输出→消歧/迁移/成本；中午锚点不是自然日边界，locale不是zone，年份政策范围明确。非作者review由root安排。 |
| Demo有用 | PASS（root18三目标+19原文/unknown展示） | 已读18原始三客户端3PASS与19原文/unknown单项PASS；19整批11PASS1FAIL/exit1单独保留，不冒充全命令通过。作者未重复运行。 |
| 源码可迁移 | PASS（静态/入口strict） | sourceFiles9齐含共享mjs/声明/局部CSS，真实SDK调用，无Lab alias/网络/远程资源。明确实装类型依赖与Intl支持，不改全局Settings；无需应用destroy的可变SDK实例。SSR/读屏/移动与时区矩阵另验。 |
| 官方来源可靠 | PASS（固定原文/真实HTTP） | npm3.7.2 gitHead4262a38…与根manifest一致；无匹配中文，保留根英文2052B原字节/SHA，且与实装包README逐字节同hash。5历史GET仅字典捕获，不保同名重复头；原文仍可靠、官网保守unknown有依据。未来rawHeaders工具另验，不补造旧HTTP。 |
| 结果可复核 | PASS（本地分层闭环）；正式NOT_RUN | SDK8/policy2/入口strict/11文件格式/完整提案strict与格式/metadata19输入0，实际argv/cwd/UTC/exit/stdout齐。candidate18真实客户端3PASS与19已匹配新官方单项PASS可复用；整批19仍exit1，非正式收据。两P2已由e11独立delta关闭。 |

## 保留与实现

保留parseCalendarDay的YYYY-MM-DD形状、显式zone中午构造、isValid/toISODate回读，保留dailyWindow用plus(days:1)与Interval的原语义。抽calendar.mjs与声明后，页面和SDK直接共用；旧SDK自建noon计算改为验证页面共享dailyWindow，仍直接import真实DateTime/Interval作对照。

保留wall-time-policy原公历/语法合同，拒绝秒/偏移和非法月日/年0000；它能接受形状正确的gap而不证明时刻存在。resolveWallTime原“语法→isValid→钟面回读→getPossibleOffsets→多候选显式且匹配offset”完整保留，只抽内部wallCandidates供新增inspectWallTime共用。唯一候选仍允许不选offset，错误offset仍拒绝，未静默拿第一候选替用户决定overlap。

新增basic显示zone转换的sameInstant/epoch观察，source重解释和display变换区别可见。business输出after24Hours和containsStart/containsEnd/lastIncluded，三个本地预设仍需用户运行；中午窗口不是自然日午夜。advanced默认offset未选择，候选检查可以展示但resolve失败不产结果；gap时没有候选与resolved。所有输入变化先清旧结果/错误，失败可修正再运行，状态和错误都是组件内输出，不是浏览器alert弹框。

9源包括example/demo、calendar mjs+d.mts、wall-time mjs+d.mts、policy mjs+d.mts、styles.css，必要源全部展示。应用无网络/timer/Worker/全局监听/存储/可变实例租约，不修改Settings.defaultZone/defaultLocale/now，也不为“清理”调用全局resetCaches。DateTime不可变，卸载丢弃组件state；静态归属不代表浏览器卸载/全球泄漏已测。

## 实际命令、cwd、exit和日志

外层cwd均仓库根；pnpm --dir使包命令cwd为packages/library-lab。下列日志由[run-command.py](validation/run-command.py)真实捕获，首行保存完整argv/UTC/exit和外层cwd；[local-runs.json](validation/local-runs.json)汇总，不生成正式收据。

| 实际命令范围 | exit/实际结果 | 原始日志 |
| --- | --- | --- |
| pnpm --dir packages/library-lab exec tsc --ignoreConfig --noEmit … --types vite/client,node entries/C16-luxon/examples/demo.tsx | 0，完整9源入口strict，完整参数见日志 | [types.txt](validation/types.txt) |
| pnpm --dir packages/library-lab exec node --test entries/C16-luxon/tests/sdk.test.mjs | 0，真实SDK8PASS/0SKIP | [sdk.txt](validation/sdk.txt) |
| pnpm --dir packages/library-lab exec node --test entries/C16-luxon/tests/wall-time-policy.test.mjs | 0，纯policy2PASS/0SKIP，不算SDK/DOM | [policy.txt](validation/policy.txt) |
| pnpm exec biome check --write 本条目examples/tests | 0，11文件正常格式化 | [format-code.txt](validation/format-code.txt) |
| python 本条目validation/fetch-official.py | 0，5真实GET，版本/目录/原文/官网headers字典（同名重复项不可恢复） | [official-fetch.txt](validation/official-fetch.txt) |
| pnpm --dir packages/library-lab exec node --input-type=module -e checkpoint metadata | 0，中间3目标/9源，完整脚本argv在日志，不冒充最终来源检查 | [checkpoint-metadata.txt](validation/checkpoint-metadata.txt) |
| pnpm exec biome check --write 临时browser-proposal.check.ts | 0，1文件，正常格式后回写txt并删临时 | [proposal-format.txt](validation/proposal-format.txt) |
| pnpm --dir packages/library-lab exec tsc --ignoreConfig --noEmit … --strict --skipLibCheck --types node entries/C16-luxon/validation/browser-proposal.check.ts | 0，完整3case提案strict，不执行browser | [proposal-types.txt](validation/proposal-types.txt) |
| pnpm exec biome check --write library/verification/source-evidence/sdk-source-audit/metadata-check | 0，5文件，README原文字节未格式化 | [format-metadata.txt](validation/format-metadata.txt) |
| pnpm --dir packages/library-lab exec node entries/C16-luxon/validation/metadata-check.mjs | 0，19输入/9源/实装版本与类型/原文hash/官网unknown依据；运行源与candidate18零差异 | [metadata.txt](validation/metadata.txt) |
| git diff --check -- packages/library-lab/entries/C16-luxon | 0，最终范围空白检查 | [diff-check.txt](validation/diff-check.txt) |

SDK8的真实边界：非法日期/shape；共享日历23/25/24、日历天数1/固定24小时后钟面13/11/12与半开端点；真实getPossibleOffsets两偏移；gap与隐式overlap拒绝；两个offset精确UTC及错误offset；候选检查与唯一候选；basic换display保持epoch且Settings.defaultZone/now未变；不支持zone与Apia整日跳过回读拒绝。原5个SDK意图保留、增加共享UI合同覆盖。SDK日志记录Node v26.13.0/ICU78.3/TZ2026e/系统Asia/Shanghai，只有这一个实际Node环境，不当浏览器矩阵通过。policy2仅验证字符串形状/公历规则。

运行源在SDK/类型后只作Biome正常格式化，无语义变化；candidate18全局输入SHA `7a8af9a5cb909275bbbbf4b33bd9008adbb5a2b841c2e46a372a0be8c647f52c`、2961文件，root报告public e2e lint/type/build/catalog全0且changed=[]。冻结后9运行源与2测试仍逐字节等于[checkpoint-inputs.json](validation/checkpoint-inputs.json)，最终只补文档/元数据/提案/审计，因此复用有效8+2/入口strict和公共编译，不重复全量检查或SDK。library当前已补正式来源与新讲解标题，旧checkpoint library摘要保留其历史绑定。

## 官方原文和维护安全

[官方README](official/readme.md)固定moment/luxon@4262a38ded7762e22608a9feb9f117b40d338ced/README.md，npm3.7.2 gitHead、同commit根package.json3.7.2，未截断tree候选为根README/docker/scripts，没有根中文候选。英文2052B，SHA256 `5e57e6afc44eed949d850075c7e1a9206a757c058afa6b93aab83264f07cf622`，同步UTC2026-11-10T17:08:12.781404+00:00，与已装包README hash也相同。没有自译/拼接或用API网站摘要代替原文。

[历史来源证据](official/source-evidence.json)有registry/tree/manifest/README/官网5次真实GET的finalUrl/status/checkedAt/headers字典/已读body bytes与SHA；同名重复头未保留，不能据此声称完整原始头；官网正文NOT_READ、bytes=null。官方README指向moment.github.io/luxon首页，最终200的字典未捕获XFO/CSP，但从Lab origin的实际iframe可用性未验→unknown，不能据load/HTTP200升级allowed。

[fetch-official.py](validation/fetch-official.py)使用成功后双暂存再replace模式；任一网络/版本步骤失败写独立source-evidence.failed.json并抛错，不在finally覆盖旧成功原文/evidence。原真实请求全成功；后续维护仅在临时目录运行受控传输3PASS，验证未来rawHeaders重复列表和两种失败保留；它不是新官方HTTP，不为维护重抓有效上游。实际API/类型和Installed文件hash及定位在[sdk-source-audit.json](validation/sdk-source-audit.json)，第三方@types版本单独记录。

## 浏览器交接与未测

[三case完整Playwright提案](validation/browser-proposal.txt)已strict/格式0：basic明确sourcezone与displayzone的epoch、非法日期恢复/旧结果清空；business三个NY预设23/25/24、固定24h钟面对照与半开端点、上海不跨DST；advanced无选择两候选无resolved→两offset精确结果→gap/语法/不匹配offset拒绝→唯一候选恢复、390px控件和输出、停止DOM断开/重挂清状态。提案用实际Playwright UTC context，与Node系统Asia/Shanghai不同；不mock Luxon/Intl/clock/时区数据，不把固定JSON替换真实计算。

保留luxon-result；c16-workshop/data-level，luxon-candidates/luxon-error，c16-status/environment。控件使用 Luxon 运行、日历日期/时区/显示时区，纽约春季/秋季/普通窗口，纽约本地时间/显式 UTC 偏移、模拟春季不存在的本地 02:30/纽约回拨 01:30。输出数字来自SDK返回；环境输出只说明当前Intl，不宣称跨环境完全一致。

仍NOT_RUN：本条目新官方元数据/原文官网页的匹配构建展示与iframe可用性、跨浏览器/系统ICU矩阵、读屏/原生移动日期控件、SSR hydration、性能/全局泄漏普查。没有SDK环境或网络资源阻塞当前本地检查；没有正式匹配收据，verification三status都NOT_RUN。root已在固定dist18完成三个客户端目标；官方展示仍待下一候选，本地不自行content_done。

## 文件和稳定交付

保留AGENTS原字节及原13基线/冻结checkpoint。修改guide/agent/library/verification、example/demo/wall-time及声明正常格式、SDK测试/原policy正常格式；新增共享calendar/声明、局部CSS、官方原文/完整证据、源码审计/抓取/metadata/提案/定向日志。当前19输入在[input-hashes.json](validation/input-hashes.json)，完整清单[final-files.txt](validation/final-files.txt)，日志摘要[log-hashes.json](validation/log-hashes.json)，最终输入/链接检查[final-inspection.txt](validation/final-inspection.txt)。非作者复核与真实browser交root，正式状态不升级。

初次作者FINAL STABLE：`2026-11-10T17:22:23.837451+00:00`（当时未运行browser；后续candidate18真实三目标3PASS及本次限定维护见下文）。原停写交接与原19输入归档保留，不自行content_done。

## 非作者P2限定维护与真实客户端收口

原独立报告[independent-review.md](validation/independent-review.md)指出两P2，作者在root重新授权后只修文案/抓取工具/记录：guide不再链接local-validation.md或source-evidence.json等发布器拒绝的维护路径；维护链接留在本记录，README采用固定上游HTTPS，未扩大公共私有文件策略。metadata-check现在调用真实resolveDocumentUrl验证guide/agent前端可点击链接，磁盘存在检查不再冒充发布可访问。

历史5条HTTP证据保持原字节：没有为补重复头重抓上游，也没有给旧requests补造rawHeaders。guide/agent/library与本记录将“完整响应头”收窄为历史headers字典，缺少同名重复项的原始列表。未来fetch使用response.headers.raw_items()保留原始重复列表，字典只作便利映射；公开cookie值在未来记录中摘要替换，属性/同名数量保留。受控fixture把实际脚本复制进临时目录，只mock urllib传输验证工具：完整成功保留重复头与cookie数量、首请求失败/README后官网失败保留旧README+证据两文件；三项exit0原始日志[source-tool-transport.txt](validation/source-tool-transport.txt)。不是新HTTP、SDK或UI结果。

已实际读取root候选18 [browser-luxon原始日志](../../../../docs/library-lab/evidence/quality-upgrade/candidate-18/browser-luxon.txt)及配套browser-luxon.json：Lab cwd，pnpm exec playwright test --config=.local-evidence/quality-playwright.config.ts e2e/quality-remediation-luxon.spec.ts --trace=off，2026-11-10T17:26:56.701111至17:27:01.032386 UTC，exit0、implicitBuild=false、固定dist18/4319。真实三目标3/3PASS，包括UTC context显式zone/同epoch、23/25/24与半开端点、gap/overlap/错误恢复/窄屏/实际卸载重挂；未重跑。新官方metadata/README页及公共alias新构建尚NOT_RUN，不能算第4个官方case通过，iframe仍unknown。

原19输入与原本地日志摘要保留在input-hashes-before-review.json及原日志；新当前19内容输入另刷新。维护保护清单[review-protected-inputs.json](validation/review-protected-inputs.json)比对9运行源、2测试、README与历史source-evidence共13文件，均保持原字节，不重跑SDK8/policy2/真实3case。受影响publisher/metadata/格式/输入检查另存maintenance日志，原独立报告由e11 delta复读后决定关闭，不由作者自行改报告。

维护定向命令均外层仓库根cwd，由run-command记录完整argv/UTC/exit：python source-tool-transport-fixture.py exit0/3项工具断言；Biome仅3份维护metadata exit0（1条非阻断template字面量info）；node metadata-check exit0/19输入及7发布器链接；只读Python保护13文件exit0。没有运行SDK/policy/browser或HTTP。原SDK8/policy2/三真实case继续有效；最后受影响diff与输入/链接检查见maintenance-diff.txt及maintenance-final-inspection.txt。

MAINTENANCE FINAL STABLE：`2026-11-10T17:38:29.907548+00:00`。13保护文件零差异，历史HTTP未变、维护fixture3PASS/发布器7链接/metadata19输入/范围diff/最终输入检查均0。C16全部写入停止；请原非作者e11只读delta关闭两P2。正式3status仍NOT_RUN，客户端3PASS、新官方展示NOT_RUN、iframe unknown分别保留。

## 最终本地闭环记录（2026-11-10T17:54:38.708949+00:00）

已实际读取candidate19/browser.txt及browser.json：C16“original fixed README and evidenced homepage unknown”单项PASS；**整批12项为11PASS/1FAIL、exitCode1**，不记为全命令成功。实际cwd Lab，命令pnpm exec playwright test --config=.local-evidence/quality-playwright.config.ts e2e/quality-document-links.spec.ts e2e/quality-document-security.spec.ts e2e/quality-remediation-react-i18next.spec.ts e2e/quality-remediation-primitives-sources.spec.ts --grep '@platform-document|@C15|@C16|@C18' --trace=off；UTC2026-11-10T17:49:40.684796至17:50:03.680897，implicitBuild=false。原始日志入口docs/library-lab/evidence/quality-upgrade/candidate-19/browser.txt。

结合固定18三目标实际3PASS，本库四个局部目标（3运行+1原文/unknown展示）已验证；九运行源与19输入SHA96454723c7f9a50081fab71d073f84d7962329c60c5b34dc784c58bc8f1e0c95直接比对无变化。e11独立维护delta已关闭P2-1/P2-2；没有重跑SDK8/policy2、HTTP或UI，没有修改9源或历史evidence。final-browser-completion.json绑定两个候选证据、19全批exit1/本casePASS、源SHA与独立报告SHA。前文“新官方待19”是维护当时记录，由本节明确更新。

本地六项在已验证配方闭环，未验证OS/其他Intl矩阵/SSR等缺口继续保留；iframe只验证unknown面板展示，没有从Lab-origin确认官网内容可嵌入。formal三个status仍NOT_RUN，不自行content_done。

**FINAL BROWSER RECORD STABLE：`2026-11-10T17:54:38.708949+00:00`。C16全部作者记录写入停止，回C19独占实施；本次仅local-validation/verification.note及必要绑定摘要。**
