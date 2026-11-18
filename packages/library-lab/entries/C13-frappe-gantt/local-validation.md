# C13 Frappe Gantt 本地质量验收

作者最终检查点 2026-11-10T16:29:54.425031+00:00；owner /root/quality_e11。实际cwd /home/lambert/githubRepos/lambert/ReactLoom/packages/library-lab，HEAD 1218066e706a90ba03fac8dff8c9b843dd2429c4。原13文件无初始diff，原SHA见validation/baseline.json。仅改C13；C09原作者诊断和C06独立delta报告按root明确授权另行处理且已经停写。没有改公共runner/协议/源码/e2e/依赖锁/队列/索引，没有安装/提交/推送或全目录generate/typecheck/build。现在 **FINAL STABLE，停止全部C13写入**，不自行content_done。

## 六项结论

| 维度 | 本地结论 | 证据与边界 |
| --- | --- | --- |
| 技术准确 | PASS（静态、类型与限定真实SDK） | 实装1.2.2/MIT、实际8文件源码SHA；真实Gantt原型任务/日期配方4PASS，六组边界输出；不证明DOM构造/绘图/监听。 |
| 解释清楚 | PASS（作者源码对应复核） | 中文guide/agent对应三目标，明确草稿/权威、SDK/自建隔离/fixture、转义/ID/日期和无destroy限制，精简重复反例。 |
| Demo有用 | PASS（root candidate17五核心case） | 三目标真实图/表、边界拒绝和生命周期已实际通过；字面标签/新增JSON字段未被逐项专项断言，范围见末尾记录。 |
| 源码可迁移 | PASS（静态与严格入口类型） | 六必要源码/声明/CSS正常排版，guide完整说明额外SDK基础CSS解析与隔离文档前提；六文件不冒充完整独立宿主工程。 |
| 官方来源可靠 | PASS（实际原文/版本/HTTP） | npm1.2.2 gitHead/固定manifest一致，树只有英文README，原15874B/SHA与安装原文逐字节相同；官网完整GET XFO SAMEORIGIN→blocked。 |
| 结果可复核 | PASS（局部证据与root匹配候选运行） | 命令/失败/来源/SDK与candidate17五核心case+官网共6PASS可复核；formal sdk/build/browser仍NOT_RUN。 |

## 目标和整改结果

原有隔离时间线、语义表格和三层业务逻辑保留，没有机械改成新宿主或可拖编辑图。目标分别是“隔离时间线与完整依赖”“表格草稿到权威计划”“拒绝、冲突与文档销毁”。仍为browser-frame、原demoId/level与空capabilities，现有4321会话/方向/origin/source/session/UUID/sandbox/服务端allowlist全部保持公共所有权，不跨界修改。

运行源码正常排版。readonly图与可键盘编辑表格、完整计划校验/Kahn拓扑/空进度NaN/730UTC日规则、传入副本、alive阻止import晚到、一文档一次构造及refresh/change_view_mode保留。当前无HTTP、真实项目服务、服务器revision、自动冲突重试或持久化，409仅本地分支。

新增权威计划JSON和revision，拒绝/409后uncontrolled输入草稿保留，但权威tasks/图不变；成功才增加revision并更新同源图，修正旧指南“表和图都恢复/409丢弃编辑”的错误描述。语义表单noValidate明确由同一validatePlan输出领域拒绝，原生required/min/max仅提示。原控件名称保留，新增c13-workshop data-level/revision、c13-status、c13-plan。

SDK bar.js:226对任务名innerHTML独立于popup，popup:false不等于名称安全。toChartTasks只在副本转义文本字符，权威名称与React表格仍原文；种子“需求评审 <草稿> & 确认”用于真实图/表字面一致验收，不支持富文本。副本仍隔离SDK对_start/_end/_index/dependencies等修改。

ID限制1–64位ASCII字母数字开头、后续字母数字/_/-，排除Object.prototype保留名，拒SDK空格归一化撞名与普通对象dependency_map原型键。日期限定0101-01-01…9998-12-31，关闭infinite_padding，只开放D/W/M，数据730UTC日跨度与图轴padding分开。旧0100输入虽避开直接parse低年映射，padding到0099后后续SDK add仍映射1999，已经真实配方复现。保守边界不是SDK全部视图/语言/日期的官方保证。

## 真实SDK与资源所有权

validation/sdk-source-audit.json保存实际安装package、dist JS/CSS、index/bar/date_utils/defaults/svg_utils共8文件SHA与摘录。SDK没有发布类型，frappe-gantt.d.ts仅是核对当前源码后的有限适配声明，增加infinite_padding:false不伪造SDK选项。

Node配方通过真实导出Gantt.prototype创建自身原型实例，调用实际setup_tasks/setup_gantt_dates/setup_date_values，没有DOM构造、方法替换或假浏览器；这是版本固定的内部方法验证配方，不是公开headless API。4项PASS证明导出/无destroy、descriptor复制转义/真实SDK修改、旧低年失败原因、两端D/W/M日期递增边界。SDK采用本地Date构造；日志保留历史上海LMT偏移，不能把ISO字符串偏移当UTC日历渲染保证。

边界单case定向输出6组（sdk-date-output.txt）：0101端D/W/M列数16/10/5，本地年[100,101]；9998端16/10/6，本地年[9998,9999]，都递增且不跨0–99/10000。SDK默认无限padding原为true，示例明确关闭，避免合法数据也无限扩轴。

document mouseup由SDK构造绑定，无公开destroy；条目只释放自己的DOM/ref并用alive拒迟到import，**父级移除整份frame/context才是SDK资源边界**。Lab父级session/协议与4321runner属于自建平台，不宣称SDK提供这些能力。没有全局清监听、伪造清理ACK或在主树绕过隔离。真实监听计数、context销毁仍待root五case，Node不能升级为浏览器PASS。

## 原文/官网来源

固定frappe/gantt，npm1.2.2 gitHead与同提交manifest均为4c82fccce9bf4237ded41680869529cea4385a90；主README路径README.md，完整未截断树只有该候选，没有官方中文。英文原文 **15874B**，SHA256 **6f8ef7a60672fbcdb9aafc9920cf64789e118d8f56d5ab1855a7d9553253fc46**，独立只读比较与已安装README字节相同。原文没有格式/翻译覆盖。README的tasks.append/tasks.refresh片段与匹配源码不一致，guide说明实际调用chart.refresh(tasks)，不修改原文来掩盖冲突。

官网https://frappe.io/gantt实际最终GET完整头含XFO SAMEORIGIN，无强制CSP frame-ancestors覆盖，故blocked；正文NOT_READ/bytes与SHA为null，HTTP200不是允许嵌入。rawHeaders保留重复头；匿名公共set-cookie值仅保留SHA及属性，未读取或使用用户凭据。完整URL/版本/语言/日期/源HTTP在official/source-evidence.json、library.json；没有下载/复制外部媒体资产。

## 实际命令、cwd、exit与原始日志

下列cwd均为上述Lab，完整argv/UTC/exit在validation/local-runs.json。未运行全目录检查、浏览器或隐式build。

| 实际命令 | exit | 日志 |
| --- | --- | --- |
| node --test entries/C13-frappe-gantt/tests/sdk.test.mjs | 0 | [sdk.txt](validation/sdk.txt) |
| node --test entries/C13-frappe-gantt/tests/plan-policy.test.mjs | 1 | [policy.txt](validation/policy.txt) |
| node --test --test-name-pattern '^span calculation' entries/C13-frappe-gantt/tests/plan-policy.test.mjs | 0 | [policy-date-retry.txt](validation/policy-date-retry.txt) |
| node --test --test-name-pattern '^real Day/Week/Month' entries/C13-frappe-gantt/tests/sdk.test.mjs | 0 | [sdk-date-output.txt](validation/sdk-date-output.txt) |
| python3 entries/C13-frappe-gantt/validation/fetch-official.py | 0 | [official-fetch.txt](validation/official-fetch.txt) |
| pnpm exec biome check --write entries/C13-frappe-gantt/examples entries/C13-frappe-gantt/tests entries/C13-frappe-gantt/validation/sdk-source-audit.json | 0 | [format.txt](validation/format.txt) |
| pnpm exec tsc --ignoreConfig --noEmit --target es2022 --module esnext --moduleResolution bundler --jsx react-jsx --strict --skipLibCheck --esModuleInterop --types vite/client,node entries/C13-frappe-gantt/examples/frappe-gantt.d.ts entries/C13-frappe-gantt/examples/demo.tsx | 0 | [typecheck.txt](validation/typecheck.txt) |
| pnpm exec biome check --write entries/C13-frappe-gantt/library.json entries/C13-frappe-gantt/verification.json entries/C13-frappe-gantt/official/source-evidence.json entries/C13-frappe-gantt/validation/metadata-check.mjs entries/C13-frappe-gantt/validation/browser-proposal.check.ts（临时副本，完成后删除，同代码保留为.txt） | 0 | [final-format.txt](validation/final-format.txt) |
| pnpm exec tsc --ignoreConfig --noEmit --target es2022 --module esnext --moduleResolution bundler --strict --skipLibCheck --esModuleInterop --types vite/client,node entries/C13-frappe-gantt/validation/browser-proposal.check.ts（临时副本，完成后删除，同代码保留为.txt） | 0 | [proposal-typecheck.txt](validation/proposal-typecheck.txt) |
| node entries/C13-frappe-gantt/validation/metadata-check.mjs | 0 | [metadata.txt](validation/metadata.txt) |
| git diff --check -- entries/C13-frappe-gantt | 0 | [diff-check.txt](validation/diff-check.txt) |


SDK首次4/4 exit0后，为root所需原始日期输出仅重新运行边界那1case，exit0；没有重复其他3个有效SDK断言。policy首次13中12PASS/1FAIL，失败因新测试9996-01-01到9998-01-01跨闰日实际731天；改为9996-03-01到9998-03-01后只重跑该1case，exit0。生产730日上限未改，另外12个有效结果复用；这里是“有效13已覆盖”，不虚写首次13全绿或另一次全量13PASS。失败原始policy.txt保留。

源码/8文件审计Biome exit0，含18条useTemplate信息级建议，未声称零诊断；入口strict0。最终metadata/正式NOT_RUN与提案五case、固定原文/SHA、8安装文件SHA验证0；完整提案strict/格式0。纯排版/文档/元数据变化不重复SDK/策略。曾有一条长工具调用在JavaScript解析层SyntaxError、尚未启动shell或修改文件，已拆分后执行，不记成SDK失败/通过。

## 完整浏览器提案与剩余

validation/browser-proposal.txt为完整五条实际Playwright测试源码，复用既有公共c13-preview-boundary.spec.ts的真实隔离/键盘/拒绝/延后import/双页所有权case，并补图标签字面文本/无SVG子元素、权威快照/revision、拒绝/409后输入草稿保留等断言。公共root已将跨度探针改为0101并加0100范围拒绝；没有交叉改公共e2e。

全部针对真实SDK/DOM/CDP context与原生事件，不用SDK mock。延后chunk case保持现有真实SDK chunk仅延后route.continue放行，原SDK字节不替换；其他交互不拦HTTP。监听以实际document CDP读数，节点与context真正销毁才通过，不以SVG清空替代。

NOT_RUN：新运行源的真实SVG/键盘保存/标签字面/草稿-权威一致、5case隔离协议/监听/context销毁、移动设备/真实OS IME、辅助技术、极端日期浏览器体验、任意计划导入/时区/真实项目服务/独立迁入及正式收据。root在匹配冻结候选统一执行，当前verification三个status仍NOT_RUN。没有自行content_done。

变动：原example/demo/有限声明/gantt.css/policy声明/两测试正常排版和上述边界；guide/agent/library/verification准确说明；official原README/源证据与validation基线/SDK审计/命令日志/提案/报告/摘要。AGENTS与共享runner没有改。中间暂停诊断C09的报告/摘要保留intermediate-validation.md/intermediate-input-hashes.json。最终所有文件SHA见validation/input-hashes.json；现在停止全部C13写入。


## 17 release 后限定维护P2修复（作者重新稳定）

reviewer f05确认fetch-official.py在官网前提前写README，finally无条件覆盖source-evidence，刷新失败会破坏已有成功证据对。root在candidate17稳定构建后仅释放工具/fixture/记录范围；运行源码、metadata、SDK/策略输入及当前官方成功原文/响应证据全部未改。

现在移除提前写与finally覆盖：先完成所有必要网络请求及来源校验，成功后用所属official目录中的临时目录同时暂存README和JSON，再分别replace；失败只写独立source-evidence.failed.json，包含attempted URL、异常类型/消息与已完成请求，再抛原异常。暂存目录由TemporaryDirectory清理。不宣称跨两个文件的OS事务/崩溃原子性；本项证明网络/来源获取失败不覆盖旧成功对。

受控传输fixture仅在标准库TemporaryDirectory复制抓取脚本、patch urllib.urlopen，按真实5个固定URL返回已保存原文/版本结构，零外部HTTP、零SDK/browser。三场景是完整成功替换、首请求失败保留、README已收到后官网失败仍保留。后两者以不同的旧成功README/匹配摘要sentinel检查两文件字节都不变，失败尝试只另存failed；并检查暂存目录清除、当前真实条目成功对全程字节不变。fixture结果不是新的官方响应或SDK PASS。

真实命令cwd仍为Lab，完整argv/UTC/exit见local-runs.json：
- python3 entries/C13-frappe-gantt/validation/source-tool-transport-fixture.py：source-tool-transport-red.txt exit1，旧脚本1成功/2失败；增强旧pair sentinel后同脚本source-tool-transport-red-pair.txt仍1成功/2失败，分别捕获finally毁旧证据/提前写毁旧README。
- 首次修正运行source-tool-transport-green.txt exit1：临时JSON尾部误写字面反斜杠n而非换行，三个场景JSON解析失败；只影响可丢弃fixture，真实官方对仍一致。修正转义后相同完整3场景 source-tool-transport-green-fixed.txt exit0，3/3 PASS。
- git diff --check -- entries/C13-frappe-gantt：maintenance-diff.txt exit0。
- 标准库SHA只读比对pre-maintenance input-hashes里的examples/tests/official/library/verification全部一致，详情maintenance-preservation.json；没有重跑SDK/策略/browser/全目录检查，也没有重抓有效官方资料。

本项关闭维护缺口，不扩大六项的浏览器或正式verification范围；所有正式status仍NOT_RUN。当前成功README15874B/SHA与官网SAMEORIGIN证据不变。作者FINAL maintenance STABLE，停止全部C13写入，交f05仅增量复读报告。


## candidate17实际运行与维护复核闭环（最新）

root的docs/library-lab/evidence/quality-upgrade/candidate-17/browser.txt已经实际读取：总批12PASS/exit0中，仅C13既有五核心交互case+官方原文/blocked官网1项计入本条目，合计6PASS。包括完整图/视图不加document监听、真实键盘进度保存、非法区间/0100及9999范围拒绝/0101跨度730/拒绝草稿保留与原bar几何不变、重置切场景离开真实frame和CDPcontext销毁、延后真实SDK chunk放行前停止、两个独立页面realm所有权。没有重复这些有效case来验证抓取工具。

维护修复P2由f05独立delta复读关闭，报告validation/independent-review.md；其重新核44作者输入/12保护项SHA一致，无新增SDK或官方HTTP执行。现在仅同步本地结果和browser.note，所有formal status仍NOT_RUN。最新完整五case提案直接同步root当前公共c13-preview-boundary.spec.ts；真实chunk只延后route.continue放行，没有伪造SDK字节/结果。

精确边界：这五核心case没有逐项断言旧增量提案中的字面bar-label内容/无子元素和c13-plan逐字段/revision。标签副本转义已有真实SDK任务处理+策略证据，核心权威不变由实际bar/草稿边界验证；不得声称这些新增展示字段已专项浏览器断言。真实OS IME、辅助技术、极端日期浏览器、多视图全部时区/任意计划导入、独立迁入和正式receipt仍NOT_RUN。没有因为维护补丁把已验证运行源重写。

六项最新：技术准确/解释清楚/源码迁移静态/官方来源/局部结果可复核PASS；Demo三目标的五核心真实case及官网6PASS按上述范围闭环，其他观察不扩大。作者再次FINAL STABLE，停止全部C13文件写入。

同步公共测试SHA256：cff690124e3c5bcdc9f27b7a2c68d03ae566d43f8d499807fcbdc3a00e032bd6。
