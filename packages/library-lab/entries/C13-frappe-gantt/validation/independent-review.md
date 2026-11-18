复核时刻：2026-11-10 16:37:39 UTC。candidate17冻结结束release后落盘，运行NOT_RUN状态不因候选构建成功自动升级。

# C13 Frappe Gantt 独立质量复核

审查者：quality_f05（非作者）。范围：C13 条目及直接相关的现有隔离 runner，只允许本报告写入。复用作者已有有效检查；未执行 SDK、policy、浏览器或公共套件，未改运行源/官方快照/正式 verification。审查时作者 FINAL_AUTHOR_STABLE 输入 36 项逐字节匹配，安装 SDK 审计 8 项逐字节匹配。目录实际为 6 个 sourceFiles，包含仅再导出的 demo.tsx 和两份本地声明，并非 5 个。

## 结论与问题

运行实现、中文教学、三目标、迁移范围及现有官方成功证据静态可接受；新候选真实浏览器仍 NOT_RUN。发现维护 P2，关闭前不将完整质量复核记为全通过：

- **P2：失败抓取会覆盖已有成功证据。** validation/fetch-official.py:40 在官网请求前直接写入 official/readme.md，:46–47 在 finally 无条件覆盖 source-evidence.json。若 README 已取得而官网请求失败，新 README 与不完整 evidence 会替换旧成功对；更早失败也会用局部失败记录覆盖旧成功 evidence。当前成功快照/官网证据事实不因此失效，但重跑维护不安全。建议仅全流程成功后创建两份临时文件再 replace；失败独立写 failed 文件并保留旧成功对，受控传输验证 success、首请求失败、README 后请求失败。该 fixture 不计新官方 HTTP 或 SDK PASS。已同步作者 e11 与 root，候选17冻结期间不改源。
- 未发现另一个需修改运行源的 P1/P2；以下静态结论不能代替真实图与清理验收。

## 六项逐项

| 项目 | 独立结论 | 依据及限制 |
| --- | --- | --- |
| 技术准确 | 静态可接受 | frappe-gantt1.2.2/MIT；有限本地 d.ts 对应真实 constructor/refresh/change_view_mode；日期、ID、转义和无 disposer 边界与安装源码一致。Node 模型仅真实内部方法。 |
| 解释清楚 | 可接受 | guide 从数据流/所有权开始，再给三目标、输入限制、迁移和验证边界；明确图 readonly、表格草稿、内存权威计划及本地409，不暗示服务端。 |
| Demo 有用 | 三目标静态可接受，运行 NOT_RUN | basic 隔离图/完整依赖/尺度，business 键盘保存及表格过滤，advanced 拒绝/模拟冲突/会话销毁。提案对应真实 SVG、DOM、CDP 与权威快照；待 root 匹配候选执行。 |
| 源码可迁移 | 范围说明充分，独立迁入项目 NOT_RUN | 六 sourceFiles 完整列出；gantt.css 是覆盖样式，另须同版本基础CSS、自有专用文档及父子生命周期接线，未把六文件冒充完整宿主。 |
| 官方来源可靠 | 已有成功快照可接受；抓取维护 P2 待处置 | 固定提交、npm gitHead/同提交 manifest、原文长度/hash及安装README一致；无中文候选；官网完整头支持blocked。 |
| 结果可复核 | 局部证据真实，维护 P2 待处置，browser NOT_RUN | SDK4、六日期输出及有效13 policy 分段清楚；原失败保留，未把纯策略当SDK/DOM。正式三项NOT_RUN正确。 |

## 实现与实际 SDK 核对

- examples/plan-policy.mjs:2–6、30–85：任务 ID 为 1–64 位 ASCII 字母/数字/_/-且字母数字开头，排除 Object.prototype 自有名；先完整身份索引，再检查依赖、重复/自依赖/未知 ID、Kahn 环。对应 SDK src/index.js:212 的空格归一化及:224–230 的普通对象 dependency_map，避免原型键/归一化撞名。
- examples/plan-policy.mjs:8–22 复制每个 descriptor，仅在副本 name 中编码 &、<、>、双/单引号；与 SDK src/bar.js:226 的 innerHTML 及 src/svg_utils.js:14 相配。权威名称不被改成实体。popup:false 与 readonly 不承担净化职责。当前内部任务无嵌套可变字段；dependencies 为字符串，SDK随后重赋数组不影响源对象。
- examples/plan-policy.mjs:24–27 对严格四位ISO日历日作UTC往返；:44–58限定0101-01-01…9998-12-31，整份计划最早开始至最晚结束 <=730 UTC日（包括空档）。进度空输入转NaN，拒绝非有限/越界。它是保守业务合同，不是SDK所有时区/语言/视图日期保证。
- examples/example.tsx 的 new Gantt 显式 readonly:true、popup:false、infinite_padding:false，视图仅Day/Week/Month；对应实际 defaults.js:55/70/84 的7d/1m/2m有限padding。Node 六配方与这些单位/步长一致，未开放SDK无限扩轴。
- 真实低年因果是 numeric Date 的0–99别名：0100年初留白进入0099后，后续 add 可能进入1999。保守0101下界及9998上界的实际模型输出在本地年100–101与9998–9999，六组日期严格增长。上海历史LMT的ISO偏移仍原样保留，不声明古代日期浏览器体验或UTC绘图已验证。
- example.tsx:124–159 的保存先生成整份候选并 validatePlan，通过且非本地qa冲突后才 setTasks/revision++；拒绝时uncontrolled输入继续保留草稿，authority/图不变。成功后 form key 变化使已接受行的默认值重建；过滤只影响 shown，GanttCanvas 始终接完整 tasks。409 无网络/真实服务器版本。
- SDK1.2.2没有公开 destroy/dispose，src/index.js:1346 文档mouseup闭包捕获实例，即使readonly也注册；DOM replaceChildren 不能解除。条目 effect 的 alive 只防 import 晚到、清本实例 ref/host。现有 runners/gantt/main.tsx 在专用文档 createRoot 且不启用StrictMode，父 gantt-frame-session.mjs 以固定origin/source/UUID/session/方向验证消息并在dispose移除frame。这是文档realm所有权，不是“SDK已销毁”或“主文档随意挂卸安全”。平台源码只读复核，未另造宿主或全局删监听。

## 已有真实检查的边界

- validation/sdk.txt：作者从 Lab cwd 执行 node --test entries/C13-frappe-gantt/tests/sdk.test.mjs，exit0，4 PASS。tests/sdk.test.mjs:13–27 Object.create(Gantt.prototype) 后配置匹配版本的日期字段，直接运行真实 setup_tasks/setup_gantt_dates/setup_date_values，没有替换方法、假DOM或构造器输出。它是内部版本配方，并非公开headless API、constructor/Canvas/SVG/监听通过。
- validation/sdk-date-output.txt：只重跑 ^real Day/Week/Month，exit0，六实际JSON输出；0101 Day/Week/Month列16/10/5，9998列16/10/6。日期首尾本地年分别100–101和9998–9999，非固定假输出。
- validation/policy.txt 首轮13项为12 PASS/1 FAIL；原9996-01-01→9998-01-01是731日，作者只把边界fixture改为9996-03-01→9998-03-01，validation/policy-date-retry.txt 仅 ^span calculation exit0。有效13项来自12旧PASS+直接失败项重跑，不能写成一次全套13绿；生产730阈值未放宽。
- local-validation 与原始 typecheck/final-format/proposal-typecheck/metadata 日志相符。格式日志exit0但保留18个useTemplate info；报告不把它写成零诊断。此次仅只读复算36个作者输入和8个安装源码SHA，均0差异，没有重跑已有效套件。

## 官方证据

- repository=frappe/gantt，npm1.2.2 gitHead 与固定提交manifest均为1.2.2，commit=4c82fccce9bf4237ded41680869529cea4385a90，path=README.md，language=en。
- 实际原文15874B，SHA256=6f8ef7a60672fbcdb9aafc9920cf64789e118d8f56d5ab1855a7d9553253fc46；与library.json、source-evidence及本次读取的安装README逐字节相同。未截断树候选只有README.md，没有伪造中文优先结果。guide如实指出原README tasks.append/tasks.refresh与实际1.2.2数组/API片段差异，并保留原文。
- 2026-11-10实际5次GET成功记录，固定README200与manifest/npm/tree各自字节hash留存；官网 https://frappe.io/gantt 最终200完整rawHeaders包含重复Set-Cookie（匿名值sha+属性保留），X-Frame-Options:SAMEORIGIN，未见强制CSP frame-ancestors覆盖，故blocked有依据。官网正文NOT_READ、Lab-origin实际嵌入NOT_RUN；200未被当allowed。
- P2仅关乎未来失败维护，未改变上述已有成功内容真实性；待作者维护修复及独立delta。

## 提案与剩余验收

validation/browser-proposal.txt 五条完整case覆盖三目标：真实SVG标签字面文本/无新增子元素、尺度切换的真实document监听数；真实键盘/保存驱动bar-progress比与authority/revision；过滤仅表格；日期/730跨度/0100与9999拒绝、本地409及依赖环；CDP旧executionContext销毁；实际SDK chunk传输暂缓后stop；双页面独立会话。实际route.continue保留原SDK字节，不伪造SDK方法/回调/画图结果。isComposing合成事件仅证明事件guard，不是OS输入法验收。

root仍需对匹配候选真实执行这些case及官方展示；不把Node配方、监听静态源码或iframe标签消失当真实资源清理PASS。极端日期浏览器渲染、辅助技术/OS IME/移动键盘、独立迁入业务工程均NOT_RUN。verification.json sdk/build/browser正式状态保持NOT_RUN。

当前只读审查已结束；报告之外无条目写入。维护P2处置后只追加delta，不重复有效SDK/policy/browser。


## 增量关闭：维护工具与candidate17（2026-11-10T16:44:37.301548+00:00）

原P2保留为历史发现，现判**已关闭**。只读复核新fetch-official.py:43–64：README不再提前写；所有版本/树/原文/官网请求成功才进入else，TemporaryDirectory先写两件再replace；except仅另存source-evidence.failed.json并抛错，记录URL/type/message。没有finally覆盖成功证据。此结构保障获取失败保留旧对，不是跨两文件的OS事务承诺。

复读source-tool-transport-fixture.py和既有原始日志，未重跑：旧脚本red及增强旧pair sentinel的red均1成功/2失败；green.txt为fixture字面\\n误写导致的三ERROR，保留；green-fixed.txt真实exit0/3场景PASS。新fixture在可丢弃目录检查完整成功、首请求失败、README后官网失败，以**不同旧README及其匹配摘要**验证两件字节均保留，并检查独立failed和暂存清除；不触真实条目成功对、不请求外网、不算SDK/browser。标准库只读复算当前作者44项均0差异，maintenance-preservation.json列12项生产/元数据/官方/SDK策略输入与修前一致，成功README/源证据hash不变。无需重复任何SDK/policy/浏览器。

root的candidate17/browser.txt与browser.json已只读核对：固定dist、implicitBuild=false、exit0，整次12PASS中C13五条真实隔离/图表/键盘/拒绝/传输晚到/双页case与官方展示共6PASS。其他6项不计C13。旧frame真实executionContext销毁、同文档监听边界、权威/草稿及字面标签由实际case覆盖；官方blocked展示通过不代表官网允许iframe。运行源/官方不受维护工具改动影响，复用该候选有效结果。

因此上述六项的本地审查与对应已执行运行闭环可接受，没有遗留P1/P2；正式verification仍NOT_RUN、OS IME/辅助技术/极端日期真实浏览器体验/独立迁入工程等未测边界保留。作者将在本报告停写后独占同步六项/本地browser note，避免同条并写。此次仅追加本报告，其他C13输入不动。**C13独立报告FINAL STABLE：全部审查写入停止，无后台任务。**
