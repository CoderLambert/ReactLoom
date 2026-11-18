# C12 FullCalendar 独立六项复核

非作者quality_e11，UTC 2026-11-10T16:58:06.402210+00:00，实际cwd /home/lambert/githubRepos/lambert/ReactLoom。作者f05诊断/文档/提案/摘要FINAL并停止全部写入后，才写本报告；此前只有只读检查。作者该稳定点51文件，目录SHA70fc69b9537e288bf18d0668f3a5d2657ce790698463e0f096f7e455d477c153，提案SHA78b4293c041578f0a300d8018c74deda131a941f303579301c6639b6e8899c8f。本人仅写报告，不改源/文档/公共测试，不重跑SDK2/policy4/类型/格式/作者探针或浏览器，不重抓官方。

范围：AGENTS、library、guide/agent、全部六生产文件、两测试、verification、最终local-validation/全部相关原始日志、21文件实装审计、固定原文/来源、完整三case提案和root原始/定向回归日志。独立只读复算 **50/50作者文件hash匹配、21/21安装审计hash匹配**，原README2405B及SHA与安装原文逐字节一致。生产六源与candidate17绑定保持一致。

**无未关闭产品P1/P2。** 原两个完整case的观察缺陷已由真实红/绿证据及root完整定向回归关闭；原始FAIL保留，不以修改SDK/弱化业务断言换绿。根级状态由root登记，本报告不自行content_done。

## 六项结论

| 维度 | 独立结论 | 证据与范围 |
| --- | --- | --- |
| 技术准确 | PASS（匹配实装/限定SDK与实际DOM） | v7.1.3 React子路径插件/theme/locale、三CSS和Temporal运行peer匹配；datesSet/API/drop/resize/revert实际使用正确，非v6拼装；同步本地拒绝与服务端事务分开。 |
| 解释清楚 | PASS（静态源码对应） | React权威数组→SDK模型→真实DOM/改期提议主线；半开全天end、locale与zone、API末次快照/计数、可读清单与资源边界说明清楚。 |
| Demo有用 | PASS（root candidate17分段真实4PASS） | advanced原PASS；basic/business观察修正后各完整case1PASS；官方展示原PASS。创建/真实drop/resize、API/权威一致、同步revert和停/重跑均有真实结果，不把probe绿算另一个完整case。 |
| 源码可迁移 | PASS（静态/有效入口严格类型与运行） | 六源共享合同/声明/样式齐、无Lab别名/远程资产；同版本三CSS和polyfill不能删；level/epoch/alive隔离本轮，没有自造后台服务。SSR/触摸/完整资源普查仍未验。 |
| 官方来源可靠 | PASS（固定原文/完整已记录HTTP） | annotated v7.1.3 peel提交与同commit React manifest匹配、npm gitHead缺失保留；目标React原README2405B/英文/SHA与安装原文相同、无目标中文候选。官网DENY+frame-ancestors none支持blocked。 |
| 结果可复核 | PASS（局部日志+匹配候选真实回归） | 原SDK2/policy4、strict/格式/metadata、50输入/21安装hash、原UI FAIL/probe red-green/root完整重试都可复核；formal三status仍NOT_RUN，未伪造收据。 |

## 事件、模型与视图所有权

calendar-contract.ts共享真实daygrid/timegrid/list/interaction/classic theme、zh-cn和America/New_York种子。显式firstDay=0保证DST周包含11月1日与11月2日复盘；语言不替代时区。三份官方CSS从7.1.3包公开子路径导入，temporal-polyfill1.0.4满足peer^1.0.1，React/DOM19.3满足peer17–19。没有导入v6独立core插件、Premium或license key。

React events数组为本例权威；eventsRef在commit同步更新避免同一批回调读旧数组。API按钮真实getApi().getEvents读取实例并映射id/title/startStr/endStr/allDay，业务事件改变后清null，不用state复制伪造API返回，也不eventsSet反写成环。datesSet复制可见range，不能计成保存/HTTP成功；全天[11月3日,11月5日)的end不含5日，与实际模型/中文说明一致。

move先复制真实oldEvent/new Event日期/id/allDay，再验证严格时间和当前ID；合法提议仅回写React数组，advanced fold-early或无效/未知ID调用真实info.revert，不写权威。receipt日期来自SDK；decision/kind/计数是应用观察，409是同步本地分支，不是HTTP/版本冲突引擎或异步取消。eventContent JSX文本和真实eventClass定位避免影子日历，用户标题不当HTML；root创建含尖括号标题的完整业务case实际通过。

严格calendar-policy拒无偏移、未知-00:00、超±14:00、进位日期/非法时分秒；它不承诺IANA墙上时间与固定offset完整TZDB往返。ID分配跳已占local-N且检查安全整数，非Date.now碰撞键。标题普通输入不trim，创建时才trim；composition/blur/unmount标记是应用守卫，OS IME未冒称通过。

## 生命周期与资源边界

外层key=level独立Session，显式reset才epochRef/epoch递增并重挂FullCalendar；旧回调current()同时检查alive与闭包epoch，普通标题输入不换日历实例。reset清事件/序号/输入/API/receipt/计数本轮状态。应用无后台请求、存储、Worker、临时URL或自己业务timer；没有全局destroy/清监听。

实装React effect确实在卸载调用calendarDataManager.destroy，审计记录其内部停止nowTimer；交互子树还各自管理资源。作者只声明静态所有权路径，不把旧节点断开推广为所有SDK timer/监听/活跃拖动普查，剩余范围准确。真实停止/重跑DOM与默认模型由advanced完整case证明，SSR hydration/活跃拖动中卸载和全资源普查仍NOT_RUN。

## 原观察P2与修正闭环

原candidate17/browser-fullcalendar.txt完整3case只有advanced1PASS，basic/business2FAIL、exit1，报告与错误上下文均保留。

1. basic的DOM是BUTTON但显式role=tab，原getByRole(button).filter(周)匹配0；正确tab/周匹配1。只改变测试可访问角色定位，生产view切换未改。
2. business原手柄实际s-resize，viewport1280×720，末端中心y719.453→固定+75到794.453，真实mouseup落HTML而非SDK，resizes0。作者把真实handle居中后重测中心y360.453→435.453，trusted down/up命中SDK resizer/mirror，resizes1/accepted、真实API end10:00→11:30。没有改成横向虚构手柄，没有force或直调回调，也没有扩大viewport、放宽结束时刻增加/权威与API一致断言。

candidate17-ui-probe-red exit1/green exit0只是因果诊断，不是完整原case。随后本人实际读取root：
- candidate17/browser-fullcalendar-basic-retry.txt：原完整basic单case1PASS/exit0（2.2s）。
- candidate17/browser-fullcalendar-business-retry.txt：原完整business单case1PASS/exit0（2.9s）。
- advanced原完整PASS及browser.txt中官方原文/blocked展示PASS按运行源不变复用。
合计本条目三实际交互目标+官方展示4PASS，未计别库或把probe重复算数。未重复SDK、策略或已过advanced。作者最终local-validation仍记录完整重试待root是当时交接状态；本独立报告以已落盘的最新root日志补足，不私改作者产品/记录。

## 来源与维护核对

仓库fullcalendar/fullcalendar，v7.1.3 tag对象38e3df0e36a7197889be8c67148b8bc87c7700b4解引用到6b890e803c66d1e6db2fb21c449936155b7e81fc；npm React/polyfill元数据没有gitHead，未捏造npm SHA。固定React manifest7.1.3、目标packages/react/README.md，英文2405B，SHA9deb5ffbab60d6d8010097a95149614ec8ae0c41b06508db187b80c136ac983b。完整树有其他框架README，未见目标React中文，选择目标原文，不拿根/别框架替代。

8真实请求原始最终URL/字段头/时间与bodyStatus记录可读，官网GET200包含XFO DENY和强制CSP frame-ancestors none→blocked，正文NOT_READ无假hash。原历史headers是字段映射，不能补造同名重复数/次序；文档明确这个界限，新捕获才保留rawHeaders。受控维护3场景只验证失败保护/重复头与匿名cookie处理，不当新的官方HTTP或SDK。抓取全部成功暂存replace、失败独立记录，避免finally破坏旧成功对；本人不重新执行该有效fixture。

## 实际复核与剩余

本人没有跑任何SDK/策略/browser；只读原始sdk.txt2PASS/0SKIP、policy.txt4PASS/0SKIP、strict/metadata/format/final日志，以及上述root浏览器日志。原SDK第二项已替换为真实FullCalendar formatter，双fold05:30/06:30；共享插件/locale一项确实导入实际SDK，不是纯Date差值。21文件审计和50作者hash用标准库逐文件sha256独立核对，exit0，README与安装原文逐字节相同。

仍NOT_RUN/未实现：真实OS IME、触摸/读屏排程、trusted剪贴板/undo、活跃拖动中卸载、全局资源普查、SSR hydration、独立迁入、租户权限/真实服务端revision/HTTP PATCH/异步取消及Premium视图。formal sdk/build/browser三个status保持NOT_RUN，不能从局部与共享日志自动升级收据。

## 复核输入摘要

| 文件 | SHA-256 |
| --- | --- |
| library.json | 3a8f43bd017075956e81df2aa0aeee59bf448c866d3527516e5661ba20160ead |
| guide.md | daecff282fcbb413769ef6bcfaa5a3ffb6efa4d154356557ee09c5ef86425b44 |
| agent.md | 5f6f9019db62fcacb1289d31be18082c5349a7b87eb508e5eb87f226c39cc31a |
| verification.json | 5eeb41c8f9a4e31eedafb28b00b6f313cbbe75c79aaea5663793754ce352c252 |
| examples/example.tsx | af776b7a050a284e720347915bd40d770ea43878531565174dda60e00faa8ed5 |
| examples/calendar-contract.ts | 691107fb09915159e4ac6202f2b61efa27eaf7a48ef60e9e179423d8af2a7d59 |
| examples/calendar-policy.mjs | afec0b2fc664750ca15cf54bd340dd51a1f36f3dfafe92bc40ccc98075a314da |
| examples/calendar-policy.d.mts | c08ee6a5b212393de5eb1ace42165517cdd41bb725e38a84bf336d653a80e603 |
| examples/styles.css | d466b064353f371da9bd6ffb2c9b2f666388b3fd43257aa3aeca5919bf40b2bb |
| examples/demo.tsx | f2284fc30009ceaaf34ecc200ff988948d95eba2717c8cf3ec70a978a2dc4038 |
| official/readme.md | 9deb5ffbab60d6d8010097a95149614ec8ae0c41b06508db187b80c136ac983b |
| official/source-evidence.json | 8fddbf2f4c9a8532a1cae737edd61f26deba003ac12afacb09c07ec96beab5b0 |
| validation/browser-proposal.txt | 78b4293c041578f0a300d8018c74deda131a941f303579301c6639b6e8899c8f |
| validation/input-hashes.json | f083bc1d95e8c2e122ce2e245a12016736c5f40798b5085688f06959a13c3ecc |

本报告是唯一写入。现在停止全部C12报告写入，恢复C14已授权整改，不自行登记content_done。
