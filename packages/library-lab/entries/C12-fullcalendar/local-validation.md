# C12 FullCalendar：作者完整整改与本地验证

UTC FINAL记录时间见文末；实际仓库cwd `/home/lambert/githubRepos/lambert/ReactLoom`，HEAD `1218066e706a90ba03fac8dff8c9b843dd2429c4`。原11文件无diff，逐项SHA与状态保留[baseline](validation/baseline.json)。只写C12独占目录，保留他人工作；未改公共src/scripts/e2e、依赖/锁/队列/results/索引，没有install、全目录generate/typecheck/build、提交或推送。两次共享候选暂停点保留[checkpoint1](validation/checkpoint1-local-validation.md)和[checkpoint2](validation/checkpoint2-local-validation.md)，不会把中间状态写成完整验收。

## 问题、工程目标与前提

原条目有有效严格时间/ID策略和真实FullCalendar入口，但SDK测试第二项仅Date差值，不能证明库行为；三层均围绕同日历且没有真实回调/API观察，指南缺v7插件/主题/Temporal和所有权说明，缺固定官方原文与官网证据。本次保留输入算法和自制事件，把三个独立目标补为真实路径：

1. basic：月/周/列表、datesSet可见范围、getApi().getEvents真实模型及全天半开end；readonly不改事件。
2. business：非空标题/严格日历日与唯一local-N创建，真实eventDrop/eventResize提出改期后接受回写React。
3. advanced：纽约两次01:30的不同instant，真实拖动fold-early后同步业务拒绝并调用SDK revert，React/API模型保持原事件；停止重跑恢复默认。

运行前提是浏览器、React/DOM19.3、已锁定的 `@fullcalendar/react7.1.3` 与 `temporal-polyfill1.0.4`，两包MIT，无远程资源/付费插件/许可证密钥。v7原生React，daygrid/timegrid/list/interaction/theme/locale均来自react包子路径；不套v6经验补装独立core等包。React包peer为17–19与polyfill^1.0.1，实际1.0.4满足。官方在线示例核对时已7.1.4，关键API以安装7.1.3为准。

## 六项逐项与真实范围

| 项 | 作者结论与证据边界 |
| --- | --- |
| 技术准确 | 已完成源码/类型核对：v7共享插件、三CSS、真实datesSet/API/drop/resize/revert/JSX内容hook；真实Node SDK2及纯策略4通过，Calendar DOM交互仍NOT_RUN。 |
| 解释清楚 | 中文guide/agent按事件数组→SDK模型→真实DOM讲解，再三目标，说明半开全天end/zone与locale/同步本地409/接受回写与清理；独立review待安排。 |
| Demo有用 | 三目标完整实现，完整真实Playwright源码与strict通过；作者不以静态源码或formatter代替运行。root尚需真实执行3交互case。 |
| 源码可迁移 | 六sourceFiles、真实包子路径/三官方CSS与局部样式齐，无Lab alias/共享组件依赖或外部资产。独立迁入宿主/SSR hydration未测。 |
| 官方来源可靠 | 匹配React目标包原文2405B、固定annotated tag/commit/manifest、中文候选、8真实GET与官网DENY/强制frame-ancestors none证据齐；原文安装字节一致。取证维护3受控场景通过，非新官方HTTP。 |
| 结果可复核 | 实际argv/cwd/UTC/exit/原始日志、SDK与策略分层、源码审计/metadata、3完整提案和摘要齐；candidate17共享构建及C12官方展示PASS单独绑定；formal三项NOT_RUN。 |

本表是作者完整交付及局部验证状态，**不记content_done，不代表三个真实交互目标已PASS**。独立review与root匹配候选browser仍是剩余验收。

## 数据、SDK与资源所有权

`calendar-contract.ts`共享五个真实插件、zh-cn、America/New_York和种子。显式firstDay=0覆盖中文默认周一，使11月1日DST与11月2日复盘在同一可见周；否则初始周不含复盘。事件数组为React内存权威；getApi.getEvents按钮实际读模型，导航实际gotoDate，datesSet复制SDK范围，API快照在业务更改后清null而非冒充同步状态。eventClass是匹配v7真实hook，仅给真实SDK事件根稳定类；eventContent用JSX文本，不插HTML或画影子日历。

实际drop/resize回调在任何revert前复制SDK oldEvent.startStr、新event id/start/end/allDay，验证显式时间/当前ID，再接受不可变React数组或同步调用真实info.revert。receipt日期来自SDK，kind/decision/counters是应用观察。本地409只针对advanced fold-early，无HTTP、服务端revision、异步事务或远程取消。保留原UTC/显式offset严格策略，拒进位、无offset、未知-00:00和超±14:00，但不伪称完整IANA/TZDB一致性检查。全天end排他，[11月3日,11月5日)仅含3、4日。

标题onChange不trim、创建时才trim，composition标记与blur/unmount清理；不用合成事件来声称OS IME验收。ID分配跳已占local-N及检查安全整数。level是独立Session；显式reset才epoch增加/key重挂，清序号/输入/种子与本轮观察，普通输入不换日历key。alive/epoch只拒旧树回调，没有后台请求/存储/Worker/临时URL。

[安装源码审计](validation/sdk-source-audit.json)读两包21文件/sha与关键类型/源码片段。7.1.3 React组件effect调用calendarDataManager.destroy，其内部方法停止nowTimer；交互子树另有所属清理路径。这里只证明静态路径，不承诺所有监听/timer/活跃拖动均已验收。应用不全局清监听或伪派mouseup。提案节点断开只证明自己节点替换，不冒称完整资源普查。

## 官方固定来源与取证维护

8次真实匿名GET命令已exit0，原始[official-fetch](validation/official-fetch.txt)，请求最终URL/status/日期/已记录响应字段见[source-evidence](official/source-evidence.json)。npm React与polyfill metadata没有gitHead；官方v7.1.3 annotated tag对象 `38e3df0e36a7197889be8c67148b8bc87c7700b4` 解引用commit `6b890e803c66d1e6db2fb21c449936155b7e81fc`，同commit React manifest为7.1.3，不伪写npm gitHead匹配。

未截断tree按目标包实际找README，未见React包官方中文，选择 `packages/react/README.md` 英文原文 **2405B**，SHA256 **9deb5ffbab60d6d8010097a95149614ec8ae0c41b06508db187b80c136ac983b**，与安装README逐字节相同。未翻译/裁剪/格式化上游，library的repo/commit/path/lang/version/date/sha精确绑定。

官网 `https://fullcalendar.io/` GET200，已记录头同时XFO DENY与强制CSP frame-ancestors 'none'，因此blocked有明确依据；正文NOT_READ不造正文hash，不因200推allowed。candidate17原文/blocked区域真实展示PASS，不意味着允许嵌入。

原成功证据的headers为字段映射，没有保留同名头重复数量/次序，不能倒推补造rawHeaders；现有XFO/CSP拒绝值明确。后续工具已保留逐项rawHeaders/匿名cookie属性及值sha；此维护不重复有效外网请求。源脚本原本全HTTP成功才写、失败另存，但仅顺序write；已改为完整获取/来源校验/JSON序列化后双暂存再replace，异常独立source-fetch-failure.json保留旧成功对。不是跨两文件的OS事务/崩溃原子性承诺。

[受控传输fixture](validation/source-tool-transport-fixture.py)仅在TemporaryDirectory复制脚本，以标准库传输fixture执行真实8请求路径结构；成功、首请求失败、README已取得后官网失败三场景均exit0。检查成功两件暂存、失败旧成功两件逐字节不变、失败URL/type/部分请求单独留存、暂存清除、重复Set-Cookie属性/值脱敏与首页NOT_READ。真实条目官方两件未改、无外部HTTP/SDK/Calendar/browser执行；这些不能算新官方或SDK PASS。日志[source-tool-transport-fixture](validation/source-tool-transport-fixture.txt)。

## 实际命令与有效结果

[local-runs](validation/local-runs.json)逐次保存cwd、完整argv、UTC起止、exit与日志。除明确仓库根，以下cwd为 `/home/lambert/githubRepos/lambert/ReactLoom/packages/library-lab`：

| 实际命令/范围 | exit与产物 |
| --- | --- |
| `python3 packages/library-lab/entries/C12-fullcalendar/validation/fetch-official.py`（仓库根） | 0，[8真实HTTP](validation/official-fetch.txt)，固定原文/源证据。 |
| `pnpm exec -- biome check --write entries/C12-fullcalendar/examples entries/C12-fullcalendar/tests entries/C12-fullcalendar/library.json` | 0，[format-code](validation/format-code.txt)，原helper3 info后仅等价模板排版，不因此重跑SDK/策略。 |
| `pnpm exec -- tsc --ignoreConfig --noEmit --target es2022 --module esnext --moduleResolution bundler --jsx react-jsx --strict --skipLibCheck --esModuleInterop --types vite/client,node entries/C12-fullcalendar/examples/demo.tsx` | 0，[types](validation/types.txt)。增加firstDay/eventClass后仅直接受影响入口再严格0，[checkpoint-types](validation/checkpoint-types.txt)；实际root cwd与pnpm --dir参数见local-runs。 |
| `node --test entries/C12-fullcalendar/tests/sdk.test.mjs` | 0，[sdk](validation/sdk.txt)，真实共享插件/locale与公开SDK formatDate，2PASS/0SKIP。旧纯Date差值不再冒充SDK。 |
| `node --test entries/C12-fullcalendar/tests/calendar-policy.test.mjs` | 0，[policy](validation/policy.txt)，4PASS/0SKIP，只为自建严格时间/ID合同。 |
| `pnpm exec -- biome check --write`（checkpoint仅examples/library/source-evidence，仓库根） | 0，[checkpoint-format](validation/checkpoint-format.txt)，8文件。 |
| `python3 entries/C12-fullcalendar/validation/source-tool-transport-fixture.py` | 0，维护三受控场景，不是上游HTTP/SDK。 |
| `pnpm exec -- biome check --write`（metadata-check/audit/完整提案临时.spec.ts） | 0，[final-format](validation/final-format.txt)，3文件；提案随后保存.txt并删除临时目录。 |
| `pnpm exec -- tsc --ignoreConfig --noEmit --target es2022 --module esnext --moduleResolution bundler --strict --skipLibCheck --esModuleInterop --types vite/client,node <所属临时browser-proposal.spec.ts>` | 0，[proposal-types](validation/proposal-types.txt)，与交付.txt代码一致；全参数/实际临时路径在local-runs。 |
| `node entries/C12-fullcalendar/validation/metadata-check.mjs` | 0，[metadata](validation/metadata.txt)：共享schema/gate、3目标6源、双包版本/MIT/21源码hash、固定原文及安装字节、blocked/正式NOT_RUN。 |

只读查包时一次直接resolve temporal-polyfill/package.json遇实际ERR_PACKAGE_PATH_NOT_EXPORTED；随后从已安装文件系统读取manifest，没有补装/改exports，不当SDK执行失败。目录/路径读取的小型准备错误未伪装成产品red。最终只读范围/文档链接与scoped diff检查另记final-check/diff-check，不重复有效SDK2/policy4。

主控candidate17对上述生产运行源完成共享lint/type/build/catalog exit0、输入changed=[]；实际C12官方展示1PASS，绑定与公共日志sha见[platform-binding](validation/platform-binding.json)。当次12PASS其余C06/C10/C13不算C12。三个交互目标未在该命令中执行，不用共享构建/README展示代替。

## 浏览器完整交接与剩余

[完整提案](validation/browser-proposal.txt)三条真实Playwright源码经strict和Biome，公共由root接线，本作者不写e2e：

- basic真实datesSet/月周列表、事件click/真实API含半开end、实际readonly拖动不触发drop与事件不变、reset旧SDK节点断开/新模型恢复。
- business原生标题/日期创建与拒空，trim后纯文本/unique ID的实际模型；真实mouse跨日拖review产生SDKdrop，再拖SDK末端resizer产生resize，比较receipt/React/API日期与计数。
- advanced先读真实API两fold instant差1h，再真实拖fold-early改日，核真实回调reverted、authority及API恢复；停止旧节点断开与重新运行默认模型。

只用匹配7.1.3导出protected-styles找真实mirror/end-resizer，升级重核；日期列取真实data-date几何。无SDK mock、影子DOM、直接回调/revert调用、force click或合成drop。没有拦截HTTP或伪造API输出。节点替换不是所有SDK资源普查。提案未执行，不假定初始布局/拖动几何一定通过；真实失败由原作者按证据修。

仍NOT_RUN：三个真实Calendar交互目标、触摸/移动/读屏、OS IME/剪贴板/undo、活跃拖动卸载与全资源普查、SSR hydration、独立迁入业务宿主；独立六项复核待root安排。生产后端、租户/权限、HTTP PATCH/服务端revision/异步取消、Premium资源视图均不在实现范围。正式verification的sdk/build/browser始终NOT_RUN，未生成正式收据。

## 文件与稳定交付

原example/demo/时间helper与声明/两测试保留有效规则并正常排版；新增共享calendar-contract、局部CSS、SDK实际formatDate检查、匹配原文/来源及可安全维护工具、21文件源审计、metadata checker、3完整提案、真实命令日志/公共候选绑定。guide/agent/library/verification.notes同步，AGENTS不改。实际文件清单在validation/final-files.txt，生产/内容摘要在validation/input-hashes.json，日志hash在validation/log-hashes.json。

**FINAL AUTHOR STABLE：2026-11-10T16:48:52.682279+00:00。完整交付内容已齐；完成最终摘要后停止全部C12写入含文档/日志/metadata，无后台进程，交非作者review与root匹配候选真实交互，不自行记content_done。**

最终受影响检查：notes-format（verification与platform-binding）exit0/2文件无修改；final-check.py只读验证六生产源与candidate17输入逐字节一致、三完整提案、文档本地链接/Python语法/无临时提案或二进制，exit0；scoped git diff --check exit0。原始[final-check](validation/final-check.txt)、[diff-check](validation/diff-check.txt)与实际argv/cwd/UTC见local-runs。新取证fixture、提案格式/strict、metadata均已通过；最终文档/notes不触不变SDK2/policy4/运行源，所以不重复。最终停止时刻 `2026-11-10T16:49:56.441853+00:00`，以下摘要生成后不再写C12，等待非作者review。

## candidate17 两个UI观察失败：独立真实诊断（2026-11-10T16:55:45.718543+00:00）

主控原始完整3case结果见candidate-17/browser-fullcalendar.txt：advanced DST两真实SDK instant与drop→revert PASS；basic等待button“周”超时，business创建与drop已过、resize计数0未到1，exit1。原日志/错误上下文保留，不重跑advanced、SDK2/policy4/官网、不install或隐式build。

作者固定同一candidate17 dist、私有1280×720真实Chromium context用[candidate17-ui-probe](validation/candidate17-ui-probe.mjs)复现：

- **basic是提案角色错误**：DOM确为BUTTON，但显式role=tab，实际ARIA“月/周/日程”；旧getByRole(button).filter(/^周$/)匹配0，getByRole(tab, name周, exact)匹配1。原文指南点击视图的UI行为无误，不改生产源。
- **business是提案手势出视口**：真实review事件flexDirection=column，末端cursor=s-resize（不是先前假设的横向布局）；手柄x613.984/y715.453/w109.312/h8，中心y719.453，旧提案硬拖y+75到794.453超过720视口。真实mousedown trusted命中SDK end-resizer，mouseup trusted target=HTML，resizes0，API end仍10:00，receipt仍上次drop。

[原诊断RED](validation/candidate17-ui-probe-red.txt) exit1，精确保存按钮角色、SDK真实事件/手柄rect、命中元素与trusted mousedown/up、计数/receipt/API；首断言为旧button0!=1，但两症状先完整采集。没有用SDK替身或伪造失败。

单变量business修正仅把真实handle scrollIntoView({block:'center',inline:'nearest'})再重新测量；同一viewport手柄中心y360.453→目标435.453，真实mousedown/up命中SDK resizer/mirror；resizes从0到1、reverts0、receipt kind=resize/accepted、真实SDK API end由10:00到11:30。basic按真实tab角色切换三视图，实际datesSet依次timeGridWeek/listWeek/dayGridMonth。[局部GREEN](validation/candidate17-ui-probe-green.txt) exit0。是精确原因/局部修正证据，不替代两个完整原case；探针finally关闭私有浏览器，无生产事件拦截/SDK改写/全局清理。

完整entry提案仅两处修正：真实getByRole('tab',{name:text,exact:true})；resizeEnd居中实际handle→重新bbox→断言目标y+75在真实viewport内，再执行相同原生mouse手势。**resizes=1、receipt accepted、真实API与权威一致/结束时间增加、半开end等原断言全部保留**。没有增大viewport、force click、直调SDK回调或改UI/包。横向布局假设已由实际cursor否证；探针最后仅正常排版与删除未采用的横向分支，实测纵向路径不变，复用有效GREEN。

实际两probe命令cwd仓库根，argv为node加所属绝对路径，第二次加--corrected，exit1/0；完整argv/cwd/UTC/原始输出在local-runs。新增probe/提案局部Biome exit0/2文件、提案strict exit0见[ui-diagnosis-format](validation/ui-diagnosis-format.txt)和[ui-proposal-types](validation/ui-proposal-types.txt)。仅修改提案/验证记录与agent/verification.note；六运行源与candidate17保持逐字节一致，故不重复入口类型、SDK或策略。

原完整失败/部分PASS与局部probe日志绑定见[ui-diagnosis-binding](validation/ui-diagnosis-binding.json)。六项增量：技术/中文/迁移/官方无生产缺陷；三个目标中advanced已真实PASS，basic/business原观察错误已定位并在局部GREEN，仍交root仅重跑完整这2case。正式三项NOT_RUN。原失败保留，不把诊断GREEN冒称整库通过。诊断交付后全部C12写入停止，等待非作者review。

## candidate17完整本地验收闭环（2026-11-10T16:59:48.764917+00:00）

root对同固定candidate17 dist只重跑受影响完整basic/business：browser-fullcalendar-basic-retry.txt真实1PASS/exit0，browser-fullcalendar-business-retry.txt真实1PASS/exit0。advanced原始真实DST两个instant/drop→revert PASS与官网原文/blocked展示PASS继续有效，合并为C12三个目标+官方展示4PASS。不是同一次整套4项运行；原3case1PASS/2FAIL及诊断red/局部green完整保留。最终entry提案与root真实运行public spec逐字节相同，没有放宽回调/半开日期/权威或API断言。

非作者e11的[完整独立review](validation/independent-review.md)已落盘且停止报告写入，无残留P1/P2；六项本地闭环可接受。真实日志/提案/review SHA绑定在[browser-completion-binding](validation/browser-completion-binding.json)。仅更新本记录、verification.browser.note和绑定/摘要；六生产源没有修改，不重复SDK2/policy4/类型或任何已PASS浏览器项。formal sdk/build/browser仍NOT_RUN。OS IME/触摸/读屏/SSR/独立迁入及全资源普查等原剩余继续未测，不从本次观察外推。

C12最终记录收口，摘要生成后全部作者写入停止，无后台任务，转C15独占整改。
