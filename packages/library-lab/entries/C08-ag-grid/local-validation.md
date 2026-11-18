# C08 AG Grid 本地质量整改

Owner quality_e05；实际cwd `/home/lambert/githubRepos/lambert/ReactLoom`，Git HEAD `1218066e706a90ba03fac8dff8c9b843dd2429c4`。原11文件无本条目diff，原逐文件bytes/SHA见[baseline.json](validation/baseline.json)。只写C08，保留其他工作者与共享依赖接线，不安装依赖，不改公共src/scripts/e2e/锁/索引/队列/results，不提交推送。原中间检查点记录保存在[intermediate-local-validation.md](validation/intermediate-local-validation.md)。

## 六项复核

| 维度 | 当前状态/层级 | 依据与剩余 |
| --- | --- | --- |
| 技术准确 | PASS（作者静态/匹配实装/局部真实SDK） | React/Community36.2.0实装类型与源码；真实SDK2导入页面共享grid-contract的模块/列/ID/fixture/主题及React适配器。readOnlyEdit的data为提交时值，开始revision用自建快照保存；事件次序源码已核，客户端接入尚NOT_RUN。 |
| 解释清楚 | PASS（作者静态） | guide从订阅中心问题→数据/网格模型/DOM→受控编辑→快照竞态，三个独立目标；原未接Infinite/SSRM大量反例与维护历史已收敛为必要能力边界。对象数不是性能、fixture不是后端。独立review交root。 |
| Demo有用 | PASS（candidate16真实浏览器四交互） | 三目标交互及真实外部revision更新分支均已通过；原文/官网blocked展示另1PASS。精确日志、初败保留与绑定见文末。 |
| 源码可迁移 | PASS（静态/有效入口strict） | 七生产源含共享合同、编辑快照/helper声明/局部CSS，无Lab alias/外部资产/旧主题CSS。React拥有数组/事务/timer，SDK拥有网格/监听；退出清理保留。实际布局/焦点/SSR hydration与内存未测。 |
| 官方来源可靠 | PASS（匹配原文/实际HTTP） | npm gitHead固定0fee5b7…、两包manifest36.2.0匹配。React包原README45598B/SHA一致且与安装字节相同，en/日期/候选树齐。7实际GET200完整头；官网CSP frame-ancestors排除loopback Lab→blocked，浏览器iframe仍NOT_RUN。 |
| 结果可复核 | PASS（本地六项闭环）；formal仍NOT_RUN | 非作者复核/抓取维护P2已闭环，真实交互4+官网1PASS，原SDK2/policy6与类型/日志继续按输入范围复用，精确记录见文末。 |

## 改动与真正的合同

原applyStatusEdit/reconcileFeedSnapshot及原policy断言算法保留，仅正常排版。新增grid-contract.ts让页面和真实SDK测试读同一模块/theme/列/fixture/ID合同。原UI直接拿CellEditRequestEvent.data.revision，文档却声称它是开始时版本；实际36.2 SDK的RowNode.setDataValue在提交时读取this.data。现cellEditingStarted复制{id,revision}，request消费它做原CAS，stopped含Escape/卸载清session；纯policy新增2断言证明数据之后变动不会改开始快照，以及缺失/错ID不得提供revision。

SDK源码handleStopOrCancel先processEdits（触发request），后stopCommitted/编辑器清理；读数来自真实事件接入，客户端次序仍交浏览器。源码位置/实际文件SHA和相关原文片段在[sdk-source-audit.json](validation/sdk-source-audit.json)。没有伪造RowNode/编辑事件来填PASS。

行模型观察是实际GridApi getDisplayedRowCount/getDisplayedRowAtIndex/paginationGetCurrentPage/PageSize/TotalPages；不是React数组推测。basic12、business150、advanced1500；默认pageSize25、选择25/50/100。React频道过滤和网格列过滤会叠加；client分页不发请求。数据详情只显示全量前3，firstIds显示当前页起点最多3项，虚拟DOM不是全量模型。

保留全量rowsRef+setRows同步、不可变CAS、稳定ID、AbortController+generation、只incoming ID的revision快照合并。自然timer移除abort监听，取消清timer，finally只清自己controller；卸载作废generation/abort/session/API引用，SDK网格由AgGridReact销毁，不全局stop。旧版本按钮只是调用本例policy，不假造HTTP409或SDK回调；缺失ID不复活只在原policy验证，刷新fixture不删除行。无HTTP/Query/Infinite/SSRM/Enterprise/服务器授权功能。

## 实际命令与原始日志

外层命令实际cwd均仓库根；`pnpm --dir packages/library-lab`让内层脚本/tsc cwd为Lab。完整argv/utc/exit/stdout在对应txt；增量执行列表见[local-runs.json](validation/local-runs.json)。没有安装或全目录generate/typecheck/build，也没自启动带build浏览器。

| 命令 | exit/结果 | 原始日志 |
| --- | --- | --- |
| `pnpm exec biome check --write packages/library-lab/entries/C08-ag-grid/examples packages/library-lab/entries/C08-ag-grid/library.json` | 0 / 中间8文件 | [intermediate-biome.txt](validation/intermediate-biome.txt) |
| `pnpm --dir packages/library-lab exec tsc --ignoreConfig --noEmit --target es2022 --module esnext --moduleResolution bundler --jsx react-jsx --strict --skipLibCheck --esModuleInterop --types vite/client,node entries/C08-ag-grid/examples/demo.tsx` | 0 / 入口strict | [intermediate-types.txt](validation/intermediate-types.txt) |
| `python3 packages/library-lab/entries/C08-ag-grid/validation/fetch-official.py` | 0 / 7实际GET | [official-fetch.txt](validation/official-fetch.txt) |
| `pnpm exec biome check --write packages/library-lab/entries/C08-ag-grid/examples packages/library-lab/entries/C08-ag-grid/tests` | 0 / 10文件 | [format-final-code.txt](validation/format-final-code.txt) |
| `pnpm --dir packages/library-lab test:sdk --entry=C08` | 0 / 2pass、0skip | [sdk.txt](validation/sdk.txt) |
| `pnpm --dir packages/library-lab test:policy --entry=C08` | 0 / 原4+新增session2，6pass/0skip | [policy.txt](validation/policy.txt) |
| `pnpm exec biome check --write`当前library/verification/metadata-check/sdk-source-audit/source-evidence五文件 | 0 / 5文件，精确argv见日志 | [format-final-metadata.txt](validation/format-final-metadata.txt) |
| `pnpm exec biome check --write`提案临时.check.ts | 0 / 1文件 | [proposal-format.txt](validation/proposal-format.txt) |
| `pnpm --dir packages/library-lab exec tsc --ignoreConfig --noEmit --target es2022 --module esnext --moduleResolution bundler --strict --skipLibCheck --types node entries/C08-ag-grid/validation/browser-proposal.check.ts` | 0 / 提案strict | [proposal-types.txt](validation/proposal-types.txt) |
| 同类strict加`--allowImportingTsExtensions entries/C08-ag-grid/tests/edit-session.test.mts` | 0 / 新session测试类型 | [session-types.txt](validation/session-types.txt) |
| `node packages/library-lab/entries/C08-ag-grid/validation/metadata-check.mjs` | 0 / 三目标/七源/18输入 | [metadata.txt](validation/metadata.txt) |
| `git diff --check -- packages/library-lab/entries/C08-ag-grid` | 0 | [diff-check.txt](validation/diff-check.txt) |

提案临时.ts格式/类型后同步回browser-proposal.txt并删除，不把它接进公共e2e。SDK普通Node自然退出，无force-exit、伪DOM/clock/Canvas。两个SDK断言真实目标适配器/模块和共享Theming API调用，**不创建网格，不证明行模型/编辑器/分页DOM**。六policy只本例CAS/合并/编辑快照。

[source-stability.txt](validation/source-stability.txt)实际只读比对七生产文件与中间输入，0差异：中间入口strict和主控报告candidate15编译仍可复用；主控candidate15全局输入SHA f76964af6e3bfa520b3e9e1d78c67a00b09713e1987c8adcce994b46c3e53857/type-build-catalog0是共享构建范围，非本条目正式收据。该日志另记录Python维护脚本AST有效，以及从已保存完整头解析CSP得到blocked；没有为修正分类重复获取HTTP或冒充新浏览器结果。此前只读查询v36.2.0 tag API404不等于版本无效；最终匹配依据真实npm gitHead和固定两包manifest。

## 官方原文/官网

[原README](official/readme.md)固定ag-grid/ag-grid@0fee5b7b1e839ae23fe860e404042448f3c1375d/packages/ag-grid-react/README.md，36.2.0/en/45598B，SHA `7070a8bcf54603483e9b617fce91e7bcaec8e30f77b75ca02809ad0512ca340c`，syncedAt `2026-11-10T15:44:38.354958+00:00`。未截断tree候选无中文；实际安装包README逐字节一致，没有取更泛的仓库根代替React包。

[source-evidence.json](official/source-evidence.json)保存7次实际匿名GET200的URL/最终URL/完整headers/date/bytes/SHA，以及npm两包/固定manifests/tree候选。官网https://www.ag-grid.com/react-data-grid/的有效CSP有`frame-ancestors 'self' https://*.ag-grid.com`，目标站'self'不是本地Lab origin；因此blocked，不因XFO缺失写unknown，也不以iframe load判allowed。浏览器从Lab验证官网仍NOT_RUN，不冒称实际运行。

## 浏览器交接/剩余

完整[三case源码提案](validation/browser-proposal.txt)未执行，root统一接公共并匹配构建：

1. basic实际ID列两次排序，GridApi firstIds12/11/10与实际行对应，React原数据firstID仍1；modelRows12。
2. business原生下一页→page1/first26，Frontend过滤50/2页，清空；真实picker状态提交→开始1/新2，原生Escape取消不变，再编辑→开始2/新3，过滤隐藏恢复仍同ID状态。
3. advanced真实编辑版本2→700/100先后加载，真实等待越过旧timer仍100结果且状态/版本保留；旧版本policy冲突不变，取消不写，390px实际几何、带pending timer卸载/DOM断开，再挂初始1500/no pageerror。

没有page.route/SDK mock/假RowNode/隐藏回调/clock替换。原生picker/ARIA和页面定位如宿主差异应核真实DOM，不改预期掩盖产品缺陷。静态SDK事件顺序不能代替该真实接入；退出前后焦点、键盘滚动、读屏/触摸/OS输入法、SSR hydration、实际内存/RAF泄漏与多实例仍NOT_RUN。

## 文件/状态

修改example/demo/原helper与声明及原policy测试正常排版、library/guide/agent/verification说明；新增grid-contract/edit-session/局部CSS、共享SDK与session测试、官方原文/证据、定向日志与提案/metadata/audit。本例不修改AGENTS；三正式status均NOT_RUN。完整清单见[final-files.txt](validation/final-files.txt)，18输入摘要见[input-hashes.json](validation/input-hashes.json)，日志摘要见[log-hashes.json](validation/log-hashes.json)。最终完成由root独立review和真实browser决定，不自行content_done。

FINAL STABLE：`2026-11-10T15:55:54.985284+00:00`。18当前输入摘要与本地链接复读一致、scoped diff exit0；停止所有C08写入（含文档/日志/metadata）。交root独立review与匹配候选browser，formal保持NOT_RUN。

## 抓取维护工具P2增量整改

独立review f05确认原fetch-official.py的finally总会写正式source-evidence.json；中途网络失败虽然保留README，却会破坏上一份完整成功证据。这是维护工具缺陷，未改产品/官方原文/实际成功响应记录。

现仅异常分支写official/source-evidence.failed.json，附失败URL/异常类型/已完成请求后重新抛错；不会覆盖成功对。全部请求和版本/候选/原文核验成功后，先在official内临时目录暂存README与完整证据，再分别替换正式产物，临时目录自动清理。保留同一固定npm gitHead、目标包路径和CSP分类逻辑。

新增[受控传输fixture](validation/source-tool-transport-fixture.py)，只在TemporaryDirectory复制脚本，拦截该工具的urllib传输并拒绝未声明URL；不调用外网，不mock SDK。成功场景从旧sentinel对开始，验证7次受控传输后README/完整证据正确替换且暂存目录清理；故障场景在第1和第7请求注入OSError，第7已取得README后官网失败，两次都验证旧成功README/证据逐字节保留，另有failed记录。外部正式official目录不产生failed或tmp文件。

实际cwd仓库根，`python3 packages/library-lab/entries/C08-ag-grid/validation/source-tool-transport-fixture.py` exit0，3场景通过，原始argv/UTC/退出码/stdout见[source-tool-transport-fixture.txt](validation/source-tool-transport-fixture.txt)。同轮两脚本ast.parse成功；scoped `git diff --check -- packages/library-lab/entries/C08-ag-grid` exit0见[source-tool-diff.txt](validation/source-tool-diff.txt)。[维护摘要](validation/source-tool-maintenance-hashes.json)记录维护脚本/fixture及18内容输入0变化证据。

这些测试只证明抓取工具的提交/失败保留行为，不是新的真实HTTP获取、SDK、策略或浏览器结果；没有重新抓取有效官方原文，没有改七运行源、schema/helper或依赖，不重复已有SDK2/policy6/入口类型/浏览器。正式verification仍NOT_RUN。旧完整清单/日志摘要归档before-source-tool，当前清单/摘要随维护记录更新。

维护 FINAL STABLE：`2026-11-10T16:04:32.148303+00:00`。停止所有C08输入/文档/日志写入，交f05独立增量复读后由root关闭P2。

## root外部更新运行覆盖增量

独立复核明确原控件不能在编辑保持打开时改变权威revision，原旧版本按钮只是结果展示，未误记已覆盖。root新增明确本地业务更新fixture和第四个真实case：UI只用applyStatusEdit当前权威版本更新rowsRef/setRows，不伪造SDK事件；程序化点击仅保留实际编辑焦点，后续按真实SDK是否保留编辑器分别记录冲突或结束，不强造cellEditRequest。JSON附件保存实际分支。运行源仅example.tsx与guide增量，原七源candidate15字节一致属于之前作者阶段；入口+提案strict0/format0见external-update日志，core/helper/SDK2/policy6未变有效复用。需candidate16实际运行，尚NOT_RUN。

## candidate16真实浏览器最终闭环与当前提案

已实际读取主控原始日志：初轮[browser.txt](../../../../docs/library-lab/evidence/quality-upgrade/candidate-16/browser.txt)保留4个交互失败及官网原PASS；[browser-observation-retry.txt](../../../../docs/library-lab/evidence/quality-upgrade/candidate-16/browser-observation-retry.txt)中basic/advanced/外部更新3交互PASS，business当轮仍FAIL；[browser-targeted-observation-retry.txt](../../../../docs/library-lab/evidence/quality-upgrade/candidate-16/browser-targeted-observation-retry.txt)中business最终PASS。**C08四交互最终全部PASS，原文/官网状态原PASS有效复用，共5case本地闭环**；不声称每次重试整批全通过。

公共观察改为36.2真实role=row/row-id和实际picker，筛选归位等待真实行动画退场后唯一行，不用.first遮住新旧重复行。当前[完整四case提案](validation/browser-proposal.txt)逐字节同步root公共e2e/quality-remediation-ag-grid.spec.ts，旧提案归档browser-proposal-before-observation-fix.txt。未修改业务源码或重跑SDK。

第四case的真实JSON reporter分支保存在[external-update-observed-branch.json](../../../../docs/library-lab/evidence/quality-upgrade/candidate-16/external-update-observed-branch.json)：sdkRetainedEditor=true、staleRequestConflictExercised=true，权威feed-0001保持status=error/revision2，未被旧paused编辑请求覆盖。这是实际SDK编辑保留分支，fixture对权威模型写入仍是本地应用业务，不是伪造cellEditRequest或真实HTTP。为保留原list记者未落盘分支体，主控单独重跑过该case一次；该JSON明确不是formal receipt。

原七运行源与candidate15一致的结论只适用于作者初交付阶段；后续example/guide的外部更新fixture增量已有独立日志，当前输入以本次重绑摘要为准。初始candidate16输入e951352e1bbb43925c1af2fef1d6b59f6d2dad1bfcfaa1daccfc1d138aa2b8cd与后续fixture/观察重试应按相应日志区分，不能把所有阶段偷换成同一旧摘要。源码合同/helper/SDK2/policy6未变，原有效检查不重复。

六项本地层级：技术/讲解/迁移/来源按独立静态及局部检查、Demo/结果按实际四交互和官网case闭环。官网XFO/CSP证据仍blocked，不标allowed；OS读屏/触摸、SSR hydration、真正服务器并发控制、帧率/全局泄漏仍未验。正式verification三status全部NOT_RUN，本地browser通过不等于固定记录器正式收据。根结果/队列仍由root汇总。

记录 FINAL STABLE：`2026-11-10T16:28:05.003788+00:00`，停止全部C08写入（含文档/提案/摘要），继续独占C10。
