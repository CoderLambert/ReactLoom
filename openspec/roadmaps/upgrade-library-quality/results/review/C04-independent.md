# C04 JSON Forms 独立六项复核

非作者 `/root/quality_f05`，UTC `2026-11-10T15:45:14.052560+00:00`；实际 cwd `/home/lambert/githubRepos/lambert/ReactLoom`，HEAD `1218066e706a90ba03fac8dff8c9b843dd2429c4`。依据root单独授权，仅新增本报告；未修改生产源、正式verification、公共文件/依赖/索引或作者日志。读取AGENTS、library/guide/agent/verification/local-validation、全部五源/两测试、原文/来源头、SDK审计/实际安装源码与完整三项browser提案。未重跑作者有效SDK/policy，未运行浏览器、共享构建或新抓取同一来源。

## 结论

当前范围**未发现P1/P2**。静态与真实局部SDK证据一致；整体客户端交互与正式收据仍NOT_RUN，不能由SSR、Ajv、策略或candidate构建替代。以下是独立内容核对，不是实际浏览器验收。

| 项目 | 结论及层级 | 具体依据与范围 |
| --- | --- | --- |
| 技术准确 | PASS（匹配实装源码/类型与有限SDK） | core/react/vanilla三包3.8.0、Ajv8.20.0、MIT；真实JsonForms/Vanilla/Ajv及模块级共享Schema。实装React lib/jsonforms-react.esm.js:113–122以10ms debounce发送core.data/core.errors；additionalErrors独立，不当HTTP/按键同步通知。HIDE确为hidden wrapper保留input/data。 |
| 解释清楚 | PASS（静态） | guide从Schema/UI/renderers/cells/草稿→白名单payload→服务形状错误/取消递进，明确最后已通知草稿、初始化通知不等于保存。前缀与URL解析两层、trim只在payload、真实OS输入法未测等限制与源一致。 |
| Demo有用 | NOT_RUN（真实客户端）；三目标静态成立 | basic真实标签/校验/checkbox；business HIDE保留旧input/data但manual payload无url；advanced422/409、冻结提交快照/编辑取消/重置/卸载。完整三条真实Playwright提案，无SDK/mock服务替身，待root匹配dist执行。 |
| 源码可迁移 | PASS（静态/有效类型）；宿主运行NOT_RUN | 五必要源含mjs声明/局部CSS/demo；无Lab alias/网络/外部资产。input/select局部border-box，稳定配置与源同一Schema。自有timer/controller/generation/epoch/alive有释放与拒绝晚写；不全局清SDK或放宽CSP。 |
| 官方来源可靠 | PASS（固定原文/HTTP记录） | repo eclipsesource/jsonforms，v3.8.0固定commit6075bcee93205c8fbe1f88eec19ed9058ad0f965，同commit React manifest3.8.0。npm三包gitHead缺失记录null、不伪造。原文packages/react/README.md完整4592B/hash618f7fb0bccfab2827effb645a0759a38a0d27b545194ae9a73cb8ab9e32aa0b，tree未截断无中文候选，来源字段齐。官网真GET200头含XFO SAMEORIGIN及强制CSP frame-ancestors self→blocked正确。 |
| 结果可复核 | 局部证据PASS；整体/正式NOT_RUN | 真实SDK3仅SSR/Ajv，policy4仅应用规则，strict入口/提案与格式等原始argv/cwd/UTC/exit保留。初次来源/格式失败历史真实且修正不隐去。42输入hash与实际SDK审计文件hash独立重算全一致；formal三项均NOT_RUN，未伪造固定收据。 |

## 核心边界与源码位置

- [example.tsx](../examples/example.tsx):27复用同subscriptionSchema编译Ajv；47–49以level key创建独立Session；52–70区分草稿、服务错误、提交快照、请求计数、epoch/存活/代际等各自状态。配置schema/ui/renderers/cells均模块级稳定值。初始Schema errors=null先等待真实SDK通知再允许保存。
- example:83–102拒绝未存活/旧provider通知；仅JSON data确变时推进generation、abort旧自有任务、清serverErrors/submitted并回写草稿。仅校验通知仍更新errors，不误抹additionalErrors。实装SDK onChange只发core.errors，guide说服务错误可见但Schema数仍0并允许重试符合真实通道。
- example:104–143在composition门闩和同Schema复验之后，用toSubscriptionPayload新建本次快照；异步返回只读snapshot，成功/错误/finally均受alive/代际检查。不是回包后再读取dataRef。AbortSignal不会自动取消计时器，29–44的abortableDelay确实clearTimeout并reject，完成时removeEventListener，abort时once自清；没有未处理Promise强退。
- example:145–168取消/重置推进代际并abort，只清自有任务。reset推进formEpoch和epoch ref、重挂当前JsonForms、清旧composition；旧10ms通知捕获旧formEpoch故被拒绝。72–81卸载alive=false/推进代际/abort，level独立Session不复用旧标记。应用未取消JSON Forms的内部debounce，只拒绝晚通知，文档准确。
- [submission-policy.mjs](../examples/submission-policy.mjs)导出实际生产Schema/UI，测试同源。HIDE只作用wrapper；manual分支payload明确省url。Schema仅前缀^https://、长度8–200，不等于完整URL；第二层URL解析另拒凭据/fragment/非HTTPS，仍不做DNS/重定向授权或抓取。toServerError只准name/url，未知field抛错，不把任意服务path扩成UI字段。没有HTTP、服务器存储或用户持久化。
- 结构Schema、服务形状错误和请求状态没有混算；requestCount累计本会话模拟提交，SDK notifications含初始化/校验，160/500ms与409/422均本地fixture。UI与guide明确“非HTTP”，不产生真实example.org请求。
- 原生Vanilla label/cell来自SDK真实绑定；additionalErrors通过instancePath映射真实字段，SSR测试只证明初始输出，不证明动态ARIA/焦点或清除行为。compositionstart/end只验证应用门闩，不可称OS候选输入法通过；完整屏幕阅读器/触屏/IME仍未测。

## 测试与浏览器提案核对

已阅读作者[SDK日志](sdk.txt)3 PASS/0SKIP：真实Vanilla SSR label/HIDE、共享Schema Ajv、NoValidation仍渲染additionalErrors；[policy日志](policy.txt)4 PASS/0SKIP只payload/条件字段/URL业务规则/错误路径白名单。两者都自然退出且不模拟浏览器。独立复核没有重跑。

[browser-proposal.txt](browser-proposal.txt)三case：basic实际输入/标签/错误/布尔草稿；business保留原RSS element handle、hidden/value/data、manual无url、trim不反写输入、RSS Schema恢复；advanced真实409/422字段反馈、错误-only通知不抹服务反馈、冻结快照/编辑失效、取消、reset重挂旧DOM断开/代际、composition协议门闩、390px输入几何、pending卸载及重新进入默认状态。使用真实时钟等待超过500ms，无fake timer、伪SDK或page.route；生成的本地延迟fixture与OS IME范围声明清楚。实际命令/断言是否通过由root匹配候选验证，不能从提案可类型检查推运行结果。

## 官方证据核对

实际读取并重算原README字节/hash，来源中tag/manifest、12候选目录和明确中文回退原因齐；它是React包原文，中文教学另存guide。npm缺gitHead的失败历史与初次None ref请求保留，改用真实tag后不声称从npm获得commit。源码审计四包八个安装文件hash与当前字节一致。

实际官网完整响应头同时强制XFO SAMEORIGIN、CSP frame-ancestors 'self'，不能被HTTP200或Report-Only误解为允许。来源明确只取headers/正文NOT_READ、bytes/hash null；先前IncompleteRead保留，没有把截断body当原文或完整网页。此复核没有再次请求官网或运行iframe。

## 剩余与稳定交付

主控负责匹配dist真实三目标、动态onChange/隐藏恢复/错误关联/焦点、编辑与取消/重置/卸载交互；完整SDK资源普查、实际OS中文输入法、读屏/触屏、SSR hydration、远程Schema/HTTP权限均NOT_RUN或未实现。最后已通知草稿是本例明确语义，不宣传按键后立即同步提交最新DOM值，也不把本地abort说成真实服务器未写入。

本报告写毕停止全部C04写入，仅新增此文件；随即恢复自有C06整改，不交叉修改作者源或公共文件。


## 增量维护P2：官方抓取脚本引用未定义名字

UTC `2026-11-10T15:45:39.422472+00:00`，收到作者/主控后续线索后独立复读确认：[fetch-official.py](fetch-official.py):54 在模块级构造evidence['readme']时引用 `read_body`，但该名字仅是14行get函数的形参，模块没有定义。走完公开registry/tag/tree/README成功路径后必然NameError；AST parse不检查运行时名字，不能用现有AST exit0证明抓取器可运行。

影响是**将来重同步的维护路径不可运行**，不是已保存README/完整官网头失实。并且60–62行finally仍会写本轮不完整source-evidence，可能覆盖原成功来源记录，故不应在真实上游再次执行来试探。当前固定原文hash、现有8请求和blocked头的事实独立成立。

主控接管脚本修复与受控HTTP传输fixture的完整执行路径验证，不重抓已有效上游、不当Valibot/JSONForms SDK PASS。复核者未改脚本、未运行HTTP或fixture；该维护P2目前待主控修复/回归，优先于本报告初始“未发现P1/P2”结论。六项的既有SDK/UI边界不变，结果可复核的**抓取脚本复用能力尚未通过**；现有材料来源与真实浏览器NOT_RUN分开保留。

追加后停止全部C04写入，继续自有C06。


## 增量关闭维护P2：抓取器完整路径与失败保留

UTC `2026-11-10T15:52:59.016409+00:00`，仅只读复核root修正并追加本段。当前fetch-official.py构造readme的bodyStatus明确为READ，已无模块级未定义read_body；只有get函数内按参数决定是否读正文。原文不再在请求中途立即覆盖：网络/校验全流程成功才在else写临时文件并replace成功README/evidence；异常单独写source-evidence.failed.json并raise，保留最后成功对。

实读 [source-tool-smoke-red.txt](source-tool-smoke-red.txt) 的原NameError exit1、[source-tool-smoke-green.txt](source-tool-smoke-green.txt)完整8请求路径exit0，以及[source-tool-preservation-green.txt](source-tool-preservation-green.txt) README取得之后注入传输故障仍保留旧成功两文件exit0。读取[source-tool-transport-fixture.py](source-tool-transport-fixture.py)确认：临时独立目录复制实际抓取脚本，unittest.mock仅替换urllib传输为受控registry/tag/tree/manifest/原README/头，成功检查8请求/原文bytes/bodyStatus/blocked；故障发生在README之后的官网请求，比较既有README/evidence字节相同并检查独立failed文件。不是只做AST，也不在真实条目覆盖上游材料。

**维护P2静态与受控抓取工具回归关闭。** 本复核没有重跑该fixture或旧SDK；此证据是抓取脚本传输fixture，不是新官方HTTP、SDK或browser PASS。真实官方原文/头仍以前述成功来源记录为据，不用fixture头冒充上游响应。失败注入覆盖HTTP后阶段，不声称跨两个文件的replace具备任意磁盘崩溃事务保证。

主控另报告candidate15真实C04三目标及官网blocked共4PASS，组件/原README不受此工具修复影响，无需重跑；本次独立增量只核抓取维护路径，未自行运行浏览器或改正式收据。上文Node/浏览器/正式状态层级继续分开。

追加结束，停止全部C04写入；继续自有C06。
