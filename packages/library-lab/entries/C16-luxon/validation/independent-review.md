# C16 Luxon 独立非作者六项复核

Reviewer /root/quality_e11；UTC 2026-11-10T17:33:20.288381+00:00；实际cwd /home/lambert/githubRepos/lambert/ReactLoom/packages/library-lab。作者FINAL已停写；reviewer仅写本报告，未改产品/文档/工具/元数据，未重跑有效SDK/policy/类型或浏览器。

## 结论

**产品计算与三个真实目标未发现P1/P2；两处限定文案/维护P2待原作者修正。** 已读root candidate18 browser-luxon实际3/3 PASS exit0。官方新增metadata/README页与公共文档alias补丁的新构建浏览器尚未运行，不能由3项推断全部内容完成。正式verification三status仍NOT_RUN。本报告写完停止C16写入，交root安排原作者限定修复。

## P2-1：讲解中的私有维护链接被前端策略拒绝

位置：guide.md:29 的local-validation.md，guide.md:75 的official/source-evidence.json。document-utils只发布guide/agent、合法声明README alias与允许examples/tests源码，这两路径不在分支。作者final-inspection的localLinks33只验磁盘存在，不能证明用户可点击。

reviewer在Lab只执行一次纯resolver读数（非SDK/套件重跑）：
pnpm exec node --input-type=module -e 'import {resolveDocumentUrl} from "./src/lib/document-utils.mjs"; for (const value of ["local-validation.md","official/source-evidence.json","official/readme.md"]) console.log(JSON.stringify({value,resolved:resolveDocumentUrl(value,"C16","/","official/readme.md")}));'
实际exit0：前两条resolved=""，README在新公共源码中为/raw/C16/readme.md；这不是新构建UI验证。

建议把两条维护链接留local-validation，guide用普通说明或固定上游HTTPS。不扩大公共策略公开JSON/日志；README可用新增alias或固定原文HTTPS。仅文案/摘要修改，无需重跑SDK。

## P2-2：“完整响应头”超过当前字典捕获能力

位置：validation/fetch-official.py:23，guide.md:75、agent.md:32和local-validation相应段落。工具仅headers:dict(response.headers)，5条历史HTTP无rawHeaders。字典不能保留同名重复头，因此不应无条件称完整原始响应头。

这不是声称已证明某个现有头丢失，也不推翻GET200/没有捕获XFO或CSP/保守unknown；README版本、字节和SHA有效。不能从旧字典事后补造原始重复头。

建议保留当前成功HTTP不重抓，明确历史字典捕获限制；未来抓取用response.headers.items()/raw_items()保存原始列表，敏感cookie值按项目约束摘要脱敏。受控含重复头的fixture可验证未来捕获及首请求/README后失败保留旧对；它不是新官方HTTP/SDK/UI通过。现有完整成功后双暂存、异常独立failed模式正确，不引入finally覆盖。

## 六项结论

| 维度 | 独立结论 | 实际依据 |
| --- | --- | --- |
| 技术准确 | PASS，限定当前配方 | 真实Luxon3.7.2与@types3.7.6分开；同源calendar/wall-time保留语法→isValid→钟面回查→候选→显式offset；SDK8复用，policy2不当SDK |
| 中文解释 | P2-1待修，其余PASS | 三目标/输入处理结果/具体UTC/领域区别/迁移/Intl边界与代码一致，维护链接需校准 |
| Demo有用 | PASS，root三目标实际 | 固定dist18/UTC Chromium context三case3/3，无SDK/Intl/clock mock；新官方metadata页面另待候选 |
| 可迁移 | PASS，静态及真实目标 | 9源含mjs/声明/CSS，全部等于18输入；无Lab alias/远程资产/Settings改写或可变实例需destroy |
| 官方来源 | 原文PASS，P2-2待修 | 固定npm gitHead/manifest、英文2052B与安装原文相同；中文候选和unknown可靠，历史字典完整性需说明 |
| 结果可复核 | 分层有效，限定P2未闭 | SDK8/policy2/strict/提案/格式/metadata有效；19输入与日志、安装4源码+1类型SHA匹配；browser3PASS，正式仍NOT_RUN |

## 实际API、状态与生命周期

- calendar.mjs:3严格YYYY-MM-DD，fromISO拼中午、显式zone/locale，isValid和toISODate回读；拒绝非法日期和Apia整日跳过。中午是实验锚点，不是午夜自然日，更不保证任意历史区安全。
- calendarDayView用默认setZone。实装src/datetime.js:1562 keepLocalTime=false保持this.ts，只clone换zone；重新用source zone解释中午可改变instant，display变换保持epoch。locale不推导zone。
- dailyWindow真实plus(days:1)与plus(hours:24)分开；Interval.fromDateTimes/length，contains源码为s<=value且e>value（interval.js:305）。lastIncluded仅end-1ms观察样本，不把日历差当固定24h。
- wall-time-policy无SDK，只验公历与语法。wallCandidates先真实fromISO isValid，再toFormat回查原钟面，拒绝被规范化gap，随后getPossibleOffsets。源码datetime.js:1428返回同钟面候选，并非“isValid足够”。
- resolveWallTime仅唯一候选且未选offset时使用首项；多候选必须显式选择，给定offset必须匹配。UI默认空选择：overlap可列候选但无resolved，gap候选也清空，12月错offset失败能恢复。
- clearOutput在编辑/选择/预设和run前同步清旧结果/错误/候选。错误不能保留成功JSON；候选展示不表示已保存。没有effect/timer/Worker/全局监听/storage/后台请求，无应用destroy对象，不修改Settings.defaultZone/defaultLocale/now或resetCaches。
- 墙钟语法年0001–9999，日历实验保留SDK四位ISO含0000，文档明确政策不同。普通UI与SDK样本不证明所有历史日期、ICU/TZDB、SSR hydration或真实OS IME；生产保存/权限/任务调度另有owner。

## 官方与验证复用

固定moment/luxon@4262a38ded7762e22608a9feb9f117b40d338ced，npm3.7.2 gitHead与根manifest3.7.2一致；tree未截断，根README与docker/scripts候选，无根官方中文。README.md英文2052B，SHA256 5e57e6afc44eed949d850075c7e1a9206a757c058afa6b93aab83264f07cf622，保存原文与实装README逐字节一致。MIT运行包/独立MIT类型包已核当前manifest。

sdk.txt根cwd，pnpm --dir packages/library-lab exec node --test entries/C16-luxon/tests/sdk.test.mjs，8PASS/0SKIP exit0；Node26.13/ICU78.3/TZ2026e/系统Asia/Shanghai。policy.txt纯输入2PASS exit0。入口与提案strict、格式、metadata均有实际argv/cwd/exit，不重跑这些有效项。

root browser-luxon.json：Lab cwd，pnpm exec playwright test --config=.local-evidence/quality-playwright.config.ts e2e/quality-remediation-luxon.spec.ts --trace=off，UTC17:26:56.701111至17:27:01.032386，exit0，implicitBuild=false，固定dist18/4319。三case实际涵盖source/display同epoch/非法恢复；23/25/24与固定24h/半开；两offset05:30Z/06:30Z、gap/语法/错offset/唯一候选恢复、390控件边界、停止真DOM断开与重挂清状态。官方页面和iframe可用性尚NOT_RUN，不等于这些三目标未测。

独立只读复算19/19作者输入、9/9候选18运行源、安装4源码与1独立类型SHA零差异；日志摘要12/12一致。提案与root实际公共文件字节相同，SHA7ca19087adcb3de317827d3d71d5c57726a6b475b8d8bd6c1ffc3b1b8126d737。作者44文件/19输入是原交付范围，本报告新增后不追写作者摘要。reviewer首次读取candidate inputs时把包装对象当文件map而KeyError，未写文件；读正确files字段后复算成功，与SDK无关，不伪造测试结果。

## 停写交接

两处限定P2已发root。reviewer本报告完成后全部停写，由root release原作者独占文案/维护修正；不改9运行源、不重抓有效HTTP、不重跑有效SDK/policy/三真实目标。修后只做独立delta复读，不自行content_done。


## 限定维护delta独立复核：两P2关闭

UTC 2026-11-10T17:40:32.243052+00:00，root在作者MAINTENANCE FINAL停写后重新授权reviewer仅追加本报告。未运行SDK、policy、类型、维护fixture或browser，未重抓HTTP；实际复读现有修复代码/文案/原日志，并只读复算摘要。

- **P2-1 CLOSED。** guide的local-validation/source-evidence私有链接已移除，维护入口仅留本地记录；README改固定commit HTTPS。metadata-check现在实际调用resolveDocumentUrl，而非只检磁盘；maintenance-metadata.txt实际exit0、7个已发布文档链接。没有放开私有目录或修改公共resolver。
- **P2-2 CLOSED。** 现有5条HTTP及原README没有改字节或补造rawHeaders；guide/agent/library/local-validation明确历史字典不保同名重复头，unknown保持。未来fetch-official.py使用response.headers.raw_items()保存列表，同时保留便利字典；Set-Cookie值摘要替换但属性/同名数量保留。成功仍先全部获取、双暂存replace；异常独立failed、不覆盖旧成功。
- source-tool-transport-fixture.py仅复制实际脚本到临时目录、控制urllib传输；Message重复两个X-Controlled-Repeat/两个Set-Cookie，success验证重复/脱敏、fail1/fail5验证README和evidence旧对保留。source-tool-transport.txt实际3/3 exit0；这是未来工具维护证据，不是新官方HTTP或SDK/UI通过。
- 只读复算当前19/19输入SHA、13/13保护项（9源、2测试、README、历史HTTP）零差异；maintenance-protection/final-inspection/diff均已有exit0，已读原始记录，未重复有效检查。未改原独立报告历史问题段，以上结论覆盖其“待修”状态。

当前产品无未关闭P1/P2。candidate18运行源三目标真实3PASS保持有效，官方新metadata/原文/官网面板匹配构建展示待candidate19，未当第四个官方case通过；iframe仍unknown，正式三status仍NOT_RUN。读屏/真实OS IME/其他ICU、SSR、全面泄漏/性能范围未扩张。

本delta写完再次停止C16全部写入，root接队列和后续公共构建/browser；reviewer立即返回C18当前编译检查点继续实施。
