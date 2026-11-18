# C08 AG Grid 独立六项复核

非作者 `/root/quality_f05`，UTC `2026-11-10T16:02:22.260062+00:00`；实际 cwd `/home/lambert/githubRepos/lambert/ReactLoom`，HEAD `1218066e706a90ba03fac8dff8c9b843dd2429c4`。在作者FINAL STABLE后读取AGENTS、library/guide/agent/verification/local-validation、七生产源/三测试、SDK审计/真实安装源码类型、原README/完整官网头、原始日志和三完整提案。仅新增本报告，未修改作者/公共源码、依赖/锁、正式收据、现有证据或生成索引；未运行SDK/policy、浏览器、共享构建或新上游抓取。

## 结论与问题

核心演示与匹配SDK依据中未发现P1/P2。确认一项 **P2维护缺陷：来源抓取失败会覆盖旧成功evidence**，已即时上报主控；修复与受控工具回归待主控/作者。现有上游原文与成功响应头事实可信，维护脚本未来失败路径与既有事实不能混同。真实网格DOM/编辑/分页/生命周期仍NOT_RUN。

### P2：失败同步覆盖成功来源记录

[fetch-official.py](fetch-official.py):44–46的finally无条件写official/source-evidence.json。registry/tree/manifest/README或官网任何获取失败时，evidence可能只有requests，缺commit/path/snapshot/homepage；仍会覆盖旧完整成功记录。README直到43行全部成功才写，失败时旧README仍在却失去与成功来源证据的一致绑定。与“失败保留既有成功快照/来源”的同步约定不符。

这不是旧成功HTTP/原文hash错误，也不是SDK故障；无需重复真实上游请求或原2SDK/6policy。建议作者/root将异常独立写failed尝试、全流程成功再提交原文/证据，临时目录受控传输注入README之后失败并比较旧两文件字节，运行完整成功/失败路径而非只AST。复核者未执行该失败同步，未破坏旧证据、未越权修脚本。

## 六项结论

| 项目 | 独立结论及层级 | 证据与实际边界 |
| --- | --- | --- |
| 技术准确 | PASS（匹配实装源码/类型与有限配置SDK） | 两包36.2.0/MIT；Provider+AllCommunityModule/Theming API、稳定getRowId、真实readOnlyEdit请求与开始revision快照一致。GridApi读取模型/页码，应用CAS/合并不是SDK自带事务。Node2仅配置/主题/真实适配器导入，不证明createGrid运行。 |
| 解释清楚 | PASS（静态） | guide按数据→过滤/排序模型→分页DOM→受控编辑→快照/冲突主线。明确event.data是提交时数据，开始版本由应用复制；1500对象不是性能、客户端分页不等服务端、旧版本按钮仅policy、无HTTP。 |
| Demo有用 | NOT_RUN（实际客户端）；三独立目标静态成立 | basic12行排序与业务数组身份；business150行过滤/分页及真实编辑器/CAS；advanced1500行慢快/取消/较新状态保留。三提案真实DOM/键盘/picker/时钟/卸载，没有伪RowNode或SDK回调。 |
| 源码可迁移 | PASS（静态/有效strict）；宿主运行NOT_RUN | 七必要源含共享grid-contract/edit-session、policy声明/CSS，无Lab alias/远程素材/旧CSS主题叠加。370px高度/局部border-box和内部滚动；应用清自有controller/timer/代际/session/API，SDK负责网格。SSR hydration/完整SDK资源普查未测。 |
| 官方来源可靠 | 成功快照/头PASS；同步维护P2待修 | 固定npm gitHead/双manifest36.2.0，React目标README45598B，hash与安装原文一致，固定源/时间/英文/中文候选完整。真实官网强制CSP frame-ancestors排除Lab→blocked。不得以未来失败路径破坏既有证据，见P2。 |
| 结果可复核 | 局部证据PASS；抓取失败保留FAIL；整体/正式NOT_RUN | 实读SDK2/policy6/strict/格式/metadata日志，18输入/16日志及6个SDK审计文件hash重算无变化。提案可类型检查不是运行；正式三项NOT_RUN。来源工具只AST不足证明失败保留，需定向维护回归。 |

## 编辑快照、身份与CAS

- [example.tsx](../examples/example.tsx):90–98在真实cellEditingStarted复制{id,revision}；99–125在cellEditRequest只用提交时data.id匹配会话并消费开始revision，不把提交时event.data.revision当原始版本。非法/missing/mismatched会话拒绝，stopped/Escape及卸载清session。全量rowsRef在同一applied分支先更新再setRows，不用shown过滤子集写业务行。
- [edit-session.ts](../examples/edit-session.ts)确实拷贝两个标量；测试修改原data.revision后会话仍为旧版本，并由真实applyStatusEdit得到conflict。这是应用快照policy，不是SDK事件运行测试。
- 实装Community `dist/package/main.esm.mjs`:4189起RowNode.setDataValue readOnlyEdit分支解构this.data后dispatch cellEditRequest；handleStopOrCancel先processEdits，再stopCommitted/cleanup。该次序支持消费开始快照后清会话的设计，但React事件实际接线/先后仍待browser，不能仅源码记交互PASS。
- [edit-policy.mjs](../examples/edit-policy.mjs)验证枚举/安全非负expectedRevision、ID存在/当前revision相等；unchanged不加版本，applied只替对应ID新对象并revision+1。reconcile只遍历incoming ID，本地status/revision仅更高时覆盖，其余字段仍归incoming，缺失ID不复活。fixture的ID唯一；没有宣传策略替代服务端授权/冲突协议。

## 实际模型、分页与任务所有权

example:66–88确实调用getDisplayedRowCount/getDisplayedRowAtIndex/paginationGetCurrentPage/PageSize/TotalPages；firstIds从page*pageSize开始最多3项，不从React数组/可见DOM猜模型。匹配SDK main.esm.mjs:37866–37871两显示API分别返回rowModel.getRow/getRowCount；56336起分页API由pagination服务读取。对于本例固定行高、无分组的client模型，模型全行与页偏移区分正确。React名过滤与SDK列过滤会叠加，文档说明先清其他过滤。

example:134–163 reload推进generation并abort前controller，自己的timer在abort时clearTimeout/reject、完成时移除监听；await后检查代际和signal，再用当前全量rowsRef合并快照；finally只有controller身份相同才清引用。取消推进代际，卸载/level effect清controller/session/API并推进代际；旧catch无资格改“已取消”或新请求状态。没有真实服务事务，也没用假clock。

SDK网格销毁归React适配器。实读ag-grid-react `dist/package/index.esm.mjs`:4081附近setOutermostRef(null)调用自身destroyFuncs并清数组；4135–4137注册ctx.destroy，另清apiRef。此源码支持“卸载自己网格”的所有权说明，不是完成全资源泄漏普查；应用没有全局stop/DOM事件伪派。

## 许可、来源与验证复用

只导入Community/React两MIT包并Provider注册AllCommunityModule，列过滤、排序、分页、agSelectCellEditor和Theming API均属于这里实际配置。官方目标README的86/484–490行区分Community MIT与Enterprise Commercial；本例没有Enterprise模块/license key/SSRM/Infinite，未绕许可或把付费能力当免费运行。

原文repo ag-grid/ag-grid，commit `0fee5b7b1e839ae23fe860e404042448f3c1375d`，path packages/ag-grid-react/README.md，36.2.0/en/45598B，SHA256 `7070a8bcf54603483e9b617fce91e7bcaec8e30f77b75ca02809ad0512ca340c`。与实际安装React README字节一致；完整未截断tree及目标包候选只有英文原文，非根README替代。两个npm gitHead及同commit manifests支持版本，未以曾404的tag探测推定版本不存在。

官网实际GET200完整头的Content-Security-Policy包含frame-ancestors 'self' https://*.ag-grid.com，仅AG Grid origin允许，loopback Lab不在列表；blocked是强制头事实，不是Report-Only、raw/GitHub头或iframe load推测。7成功请求的最终URL/date/status/bytes/hash/完整头保留，独立review没有重复HTTP。

阅读作者SDK2日志确认正常Node真实SDK/module/theme/共享合同调用，不创建DOM；policy6是原CAS/合并4+session2，不叫GridApi浏览器PASS。输入18项、日志16项、实际安装审计6文件独立重算一致。入口/提案strict与共享candidate15按未变生产源复用，不重跑有效检查。

## 提案和剩余

完整[browser-proposal.txt](browser-proposal.txt)三个目标均用真实页面、SDK DOM/keyboard/picker和原生计时：排序后firstIds12/11/10对照真实row-id；分页25/下一页26与过滤50/2页；真实状态编辑开始1→2/Escape无变化/再编辑2→3；版本2经慢700/快100/等待800ms仍保留、旧版本按钮明确是policy、取消和pending卸载/重挂。没有page.route、fakeRowNode、隐藏handler调用或clock替换。窄屏检查实际网格boundingBox，pageerror收集不是泄漏检测替代。

提案没有在真实编辑器仍开启时让同ID revision外部变化再提交的browser冲突case，纯session测试只支持复制/CAS规则，不能称该端到端竞态已经验收；可由root按真实编辑器能力补定向并发探针，现文档已保留“事件次序客户端尚NOT_RUN”。此覆盖边界不构成已确认产品故障。

主控负责匹配候选的真实3场景/官方blocked展示、焦点/滚动/销毁；OS读屏/触摸/IME、SSR hydration、完整资源/内存/帧率、多实例与服务端并发授权仍NOT_RUN。正式verification三项未升级。维护P2交root/作者修正并受控工具验证，本报告不自行content_done。

写毕停止全部C08写入；只新增本文件，保留作者及主控所有改动。


## 增量关闭维护P2：失败保留与受控传输回归

UTC `2026-11-10T16:05:16.031220+00:00`，作者quality_e05发最终稳定后只读复核：当前抓取器已将except失败尝试单独保存source-evidence.failed.json（含尝试URL/错误类型），不再finally覆盖成功evidence；所有获取/断言完成后在else的TemporaryDirectory暂存完整README和evidence，再分别replace成功文件。异常时旧成功对保持。没有改SDK/页面/原README字节。

读取[source-tool-transport-fixture.py](source-tool-transport-fixture.py)确认复制实际抓取器到临时目录，仅unittest.mock替换urllib传输，成功路径7受控响应+固定原README/头；首请求与第7官网请求（README已取得）两种故障均比较旧README/evidence原字节、检查独立failed信息及暂存目录清除。真实条目原文/evidence末尾再次逐字节确认未改。

[source-tool-transport-fixture.txt](source-tool-transport-fixture.txt)记录实际仓库cwd、argv、UTC与exit0，输出成功/首请求失败/README后失败三场景PASS。[source-tool-maintenance-hashes.json](source-tool-maintenance-hashes.json)记录18保护输入差异为空；本复核另重算其3维护文件hash全一致。没有重跑fixture、SDK2/policy6、真实上游HTTP或browser，不将这些受控头/响应当官方新抓取。

**维护P2关闭（静态处置+作者受控工具回归已复读）。** 两份文件分别replace不宣称任意磁盘崩溃的跨文件事务原子性；验证范围是本次完整成功与网络传输失败保留。既有原文/7次真实HTTP与browser/formal边界仍按上文，不为工具修复升级SDK或客户端状态。

报告追加完成，再次停止全部C08写入；继续C12仅只读预审。


## 增量静态复核：真实编辑期间的权威外部更新fixture

UTC `2026-11-10T16:07:47.639980+00:00`。root新增限定业务fixture及公共第四case后，仅只读核对并追加本段。初版“七生产源与中间点相同/18输入hash一致”是此前阶段事实；**本轮UI和guide已经明确改变，不能套旧SHA或把旧源码稳定日志当本次证明**。

当前 [example.tsx](../examples/example.tsx):134–143的simulateExternalUpdate只从rowsRef找feed-0001，选不同的合法status，再把**当前权威revision**传给原applyStatusEdit；只有applied分支同步rowsRef/setRows并显示fixture状态。advanced专属按钮224行data-testid=c08-external-update。没有timer、异步/服务器、假SDK事件、直接改RowNode/event.data或绕过React权威数据的api.applyTransaction。

当前guide新增“编辑期间的外部更新观察”段落，准确说普通实体点击可能先blur结束编辑；专项以程序化原生button.click触发真实业务刷新以保留焦点，然后观察SDK是否保留原编辑器。它是明确可见的应用fixture，不是伪造用户物理同时操作，也不说SDK必定保持编辑或一定走CAS冲突。

只读核对公共 `packages/library-lab/e2e/quality-remediation-ag-grid.spec.ts` 第四case：真实dblclick开picker，先断言开始版本1并持有实际editor DOM；对c08-external-update的evaluate只调用真实按钮.click，没有调用隐藏SDK回调。先读c08-data权威revision2/status error并核实际grid版本列，再分支：

- 原真实editor仍存在且原节点connected：通过真实picker选paused，要求SDK真实request导致409，权威status error/revision2保持，未手造cellEditRequest。
- SDK已结束旧编辑：要求编辑器0/原节点断开且权威error/revision2保留；重新真实编辑后要求开始2→新3。此分支只证明SDK结束旧编辑及重新编辑，不谎报旧request的冲突分支已覆盖。

JSON attach real-external-update-outcome保存sdkRetainedEditor、staleRequestConflictExercised和权威行，真实分支将随运行结果落盘。静态设计符合之前指出的覆盖缺口；**第四case运行仍待root匹配候选，不因条件分支存在记browser PASS**。如果实际SDK在更新时有别的合法生命周期，需按原始DOM/事件证据分析，不通过强造回调或放宽CAS断言处理。

读取[external-update-format.txt](external-update-format.txt)及[external-update-type.txt](external-update-type.txt)确认root实际scope格式/严格入口+公共spec类型均exit0。本轮没有重跑这两项或不变的SDK2/policy6；grid-contract、edit-session、edit-policy与原模型检查保持原有效范围，UI增量由新类型/下一次真实browser验证。公共第四case是root拥有的接线；entry原三条proposal仍作为三目标基础提案，未假称其文件已包含第四case。

本次静态核对字节：example.tsx SHA256 `5149d888ebca8e255484b92a2987bf1b86580d5ebbc334aeb5d1e854b3ecea61`，guide.md `7590ab8582648b487cd65b0bfcba1a950d056647a2d9749d79e0871f55b122a3`；公共spec只读 SHA256 `89a8e27159c05805e2f9deea1e2c49ebbb52ab78ae792733c8d2db4ddf07a5f0`。正式sdk/build/browser状态未改。

未发现本次fixture/第四case新增P1/P2；不修改源码或公共文件。追加完毕停止全部C08写入，供candidate16收集稳定输入；继续C12仅只读。
