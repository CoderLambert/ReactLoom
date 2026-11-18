# C09 React Virtuoso 本地质量验收

作者最终检查点 `2026-11-10T15:55:57.067440+00:00`；owner `/root/quality_e11`。实际 cwd `/home/lambert/githubRepos/lambert/ReactLoom/packages/library-lab`，HEAD `1218066e706a90ba03fac8dff8c9b843dd2429c4`。原条目 11 文件无初始 diff，queue owner 已核，原文件 SHA 见 [baseline.json](validation/baseline.json)。只改 C09；另按 root 明确授权追加 B22 独立 delta 报告，没有改其产品。没有提交、推送、安装、改公共/依赖锁/队列/索引或执行全目录 generate/typecheck/build。**FINAL STABLE，停止全部 C09 写入**，不自行登记 content_done。

## 六项结论

| 项目 | 结论 | 证据层级与边界 |
| --- | --- | --- |
| 技术准确 | PASS（静态、类型与真实 SDK SSR） | 实装 4.18.19 类型/分发与固定提交源码核对；实际两条 SSR 内容、initialItemCount/firstItemIndex 2/2；没有用空壳证明滚动。 |
| 解释清楚 | PASS（作者源码对应复核） | guide 按数组→SDK测量→DOM/回调解释；三目标真实控件与预期对应，纠正 rendered range/可见交集、零宽字符和 SDK/本地任务分界。 |
| Demo 有用 | PASS（root candidate16 真实浏览器） | basic/business及官网原3PASS复用；advanced仅校准滚动完成采样门禁后真实PASS，原8px/缺ID/底部跟随不变；详见末尾闭环记录。 |
| 源码可迁移 | PASS（静态与类型） | 5个 sourceFiles 正常排版，必要 CSS/声明齐全；无内部别名/私有资源/外站数据；实际迁入浏览器未测。 |
| 官方来源可靠 | PASS（实际来源核验） | npm4.18.19、annotated tag→commit/同提交manifest/实际树、9703B 原README及SHA；官网完整GET头保存，未浏览器确认→unknown。 |
| 结果可复核 | PASS（本地证据）；运行 NOT_RUN | 实际cwd/argv/UTC/exit/日志、失败历史、SDK审计、提案/输入SHA齐全；formal sdk/build/browser均NOT_RUN。 |

## 基线问题与处理

保留现有三层真实 Virtuoso：basic 一万条变高文章、business 本地筛选分页、advanced 稳定消息前插/展开/按底部状态跟随，没有换成模拟窗口。原高密度源码和重复长反例整理为正常源码及对应中文步骤；保留 recreated/originalRecovery 来源事实。

原 basic 把 rangeChanged 文案写成“实际可见范围”，现改为已渲染区间；官方文档/类型明确其可能含缓冲，不能当精确交集或性能报告。原 SSR 测试接受任何 div，第二条相同HTML也不能证明真正重挂；改成实际2个 article 的内容/缺失第三条与 firstItemIndex=1000/1001，不宣称测量和滚动成功。

保留查询 NFC、C0/DEL、80码点、revision 同名重挂和260ms任务 generation 门禁；增加明确取消入口、alive迟到防护、pending/所属timer清理、空态恢复和可观察 data-loading/view-revision。原指南“去控制字符所以零宽字符会消失”不成立，现按实际C0/DEL范围说明。输入maxLength160为UTF-16草稿限制，规范查询再截80码点。

高级保留 firstItemIndex/data 原子更新与 article.id Set，位置初始未知先等待实际SDK通知；增加真实 LAST 跳底，避免只写跟随却难以操作。fixture封顶1000条，早期消息与正数firstItemIndex有边界，不静默裁剪数组。展开按钮名包含业务ID，源码保留aria-expanded。SDK测量用自身ResizeObserver，应用不清全局资源。

## 源码/SDK/fixture 所有权

生产 sourceFiles 是 examples/example.tsx、view-policy.mjs/.d.mts、workshop.css、demo.tsx。数据、筛选、limit、展开Set、自有260ms计时器归应用；SDK拥有滚动容器、测量/窗口和scroll监听。cancel/search/unmount清自有timer并generation失效；alive拒绝卸载迟到任务。真实服务器请求/AbortSignal/游标/错误重试、TableVirtuoso、Query、DOMPurify和收费MessageList都未实现，不冒充目标库能力。

实装包 manifest/types/dist 路径与SHA见 [sdk-source-audit.json](validation/sdk-source-audit.json)；同版本上游源码原件/行片段见 [upstream-source-audit.json](validation/upstream-source-audit.json)。SDK useSize回调ref对所属元素unobserve，useScrollTop effect移除所属scroll监听；SDK可能已排测量RAF，脱离布局元素有offsetParent检查。本例没有宣称卸载瞬间全局observer/RAF为零，真实cleanup仍待浏览器。未挂载文章不在无障碍树，未实现全文分页/导出入口，不能写成全量读屏支持。

## 官方原文与官网

官方 `petyosi/react-virtuoso`，对应包 `packages/react-virtuoso`，4.18.19 tag为 annotated tag，实际解引用到 **324f632f2fc745257cc46c28d1cb952eb7c68464**；同提交manifest确为4.18.19。npm版本响应省略gitHead，保留null而非伪造tag与npm SHA相同。固定提交未截断树实际列出README候选；目标包/根无中文README，选 `packages/react-virtuoso/README.md` 英文原文 **9703 bytes**，SHA256 **67bcd5ac56f7697428bdeb2bf6ec5eea7ffbb078a16b5979f123411ff6e559df**。未翻译/改写原文；本地中文教学独立。日期/源URL/语言/完整响应头见 [source-evidence.json](official/source-evidence.json) 与 library.json。

首次官网TLS握手超时，没有HTTP头；仅重试官网，真实GET200完整headers已取全，未提供XFO/CSP，正文NOT_READ/bytes/hash null。没有实际Lab origin浏览器iframe确认，故 **unknown**，不从200或缺限制头推allowed。没有重取有效README。

Context7查询返回月配额耗尽，web错误旧API路径404；随后官方搜索定位现行API与range-change-callback，核心判断以匹配4.18.19安装类型/固定源码为准，未把检索失败当SDK缺失。包exports不开放react-virtuoso/package.json子路径，初次require.resolve子路径报ERR_PACKAGE_PATH_NOT_EXPORTED；改以真实node_modules包路径只读manifest，不改exports或依赖。

## 实际命令

以下真实cwd均为上述Lab；由run-local.py记录完整UTC、argv、exit与输出。[local-runs.json](validation/local-runs.json) 是实际收据列表。局部检查不等于正式verification收据。

| 实际命令 | exit | 日志 |
| --- | --- | --- |
| `python3 entries/C09-react-virtuoso/validation/fetch-official.py` | 1 | [official-fetch.txt](validation/official-fetch.txt) |
| `python3 entries/C09-react-virtuoso/validation/fetch-official.py` | 1 | [official-fetch-fixed.txt](validation/official-fetch-fixed.txt) |
| `python3 entries/C09-react-virtuoso/validation/fetch-homepage.py` | 0 | [homepage-retry.txt](validation/homepage-retry.txt) |
| `node --input-type=module -e 'import React from "react"; import {renderToStaticMarkup} from "react-dom/server"; import {Virtuoso} from "react-virtuoso"; const data=[{id:"rss-a",title:"first"},{id:"rss-b",title:"second"},{id:"rss-c",title:"third"}]; console.log(renderToStaticMarkup(React.createElement(Virtuoso,{data,initialItemCount:2,firstItemIndex:1000,computeItemKey:(_index,item)=>item.id,itemContent:(index,item)=>React.createElement("article",{"data-article-id":item.id},index+":"+item.title),style:{height:240}})));'` | 0 | [ssr-inspect.txt](validation/ssr-inspect.txt) |
| `pnpm exec biome check --write entries/C09-react-virtuoso/examples entries/C09-react-virtuoso/tests entries/C09-react-virtuoso/library.json entries/C09-react-virtuoso/verification.json entries/C09-react-virtuoso/official/source-evidence.json entries/C09-react-virtuoso/validation/sdk-source-audit.json entries/C09-react-virtuoso/validation/metadata-check.mjs` | 1 | [format.txt](validation/format.txt) |
| `pnpm exec biome check --write entries/C09-react-virtuoso/examples/view-policy.mjs` | 0 | [format-fixed.txt](validation/format-fixed.txt) |
| `pnpm exec tsc --ignoreConfig --noEmit --target es2022 --module esnext --moduleResolution bundler --jsx react-jsx --strict --skipLibCheck --esModuleInterop --types vite/client,node entries/C09-react-virtuoso/examples/demo.tsx` | 0 | [typecheck.txt](validation/typecheck.txt) |
| `node --test entries/C09-react-virtuoso/tests/sdk.test.mjs` | 0 | [sdk.txt](validation/sdk.txt) |
| `node --test entries/C09-react-virtuoso/tests/view-policy.test.mjs` | 0 | [policy.txt](validation/policy.txt) |
| `node entries/C09-react-virtuoso/validation/metadata-check.mjs` | 0 | [metadata.txt](validation/metadata.txt) |
| `pnpm exec biome check --write entries/C09-react-virtuoso/validation/browser-proposal.check.ts（临时副本，核对后删除，同代码保存为browser-proposal.txt）` | 0 | [proposal-format.txt](validation/proposal-format.txt) |
| `pnpm exec tsc --ignoreConfig --noEmit --target es2022 --module esnext --moduleResolution bundler --jsx react-jsx --strict --skipLibCheck --esModuleInterop --types vite/client,node entries/C09-react-virtuoso/examples/demo.tsx entries/C09-react-virtuoso/validation/browser-proposal.check.ts（临时副本，核对后删除，同代码保存为browser-proposal.txt）` | 0 | [proposal-typecheck.txt](validation/proposal-typecheck.txt) |
| `python3 -c 'import ast,pathlib; paths=[pathlib.Path('"'"'entries/C09-react-virtuoso/validation/fetch-official.py'"'"'),pathlib.Path('"'"'entries/C09-react-virtuoso/validation/fetch-homepage.py'"'"')]; [ast.parse(p.read_text(),filename=str(p)) for p in paths]; print('"'"'2 evidence scripts parse; no HTTP re-fetch'"'"')'` | 0 | [evidence-script-syntax.txt](validation/evidence-script-syntax.txt) |
| `git diff --check -- entries/C09-react-virtuoso` | 0 | [diff-check.txt](validation/diff-check.txt) |


来源初抓exit1是错误假定tag为轻量commit；实际tag是annotated，原响应保留source-initial-tag.json，随后按tag object解引用真实commit。修正抓取的源/README全部成功，最后官网TLS超时导致exit1，保留完整日志；官网单独重试exit0只表示HTTP头抓取成功，不能说可嵌入PASS。

首次Biome exit1仅原policy用于删除C0/DEL的regex告警，已加精确理由并单文件check0，未全局放松规则或改变过滤语义。SDK **2/2**、policy **4/4**、入口strict类型、入口+完整提案strict类型、提案格式、metadata、证据脚本语法与diff均exit0。提案临时.check.ts已删除，最终格式化代码保留为.txt。SDK/策略未因文档变化重复。

## 浏览器交付、剩余与稳定点

[完整三项Playwright源码提案](validation/browser-proposal.txt)：basic真SDK窗口/9001跳转/缩窄；business取消/追加/同名scroller脱离重建、空态恢复、IME协议/离开重进；advanced真实卡片高度+SDKdata-known-size、稳定ID展开/相对锚点、历史追加不跳、LAST主动跳底/贴底跟随。无SDK mock、假图、page.route或假时钟。composition事件分发仅验证应用事件协议，不等于OS输入法。

**NOT_RUN**：三项目标真实浏览器，实际ResizeObserver/scroll/锚点/跟随、取消与卸载交互、操作系统IME、辅助技术、真实网络服务、独立迁入、共享type/build/catalog与官网iframe。正式verification.json sdk/build/browser均NOT_RUN，由root候选构建与真实浏览器另记证，不把本地SSR/策略/提案通过当成运行闭环。

变动：guide.md、agent.md、library.json；examples/example.tsx、view-policy.mjs/.d.mts、demo.tsx正常排版及新增workshop.css；两个测试；official原README/来源；本地validation脚本/审计/日志/提案/报告/指纹。原AGENTS与verification未改含义。全文件摘要见 validation/input-hashes.json。现在停止C09所有文件写入，供root独立复核与集成，不自行content_done。


## candidate16 advanced 锚点采样诊断与重新稳定

UTC `2026-11-10T16:21:23.176473+00:00`，实际cwd `/home/lambert/githubRepos/lambert/ReactLoom/packages/library-lab`。root原始 `docs/library-lab/evidence/quality-upgrade/candidate-16/browser.txt` 中basic/business/官网三项PASS保留；advanced在历史追加后的8px锚点比较失败，不能被后续诊断抹去。父级运行使用trace=off，无原始trace，只有错误上下文，原日志完整保留。

按diagnosing-bugs建立仅失败路径的真实反馈环。原公共advanced原封不动以trace=on执行一次exit0、有限repeat5次exit0；这6次不证明原失败不存在，trace时间开销改变了采样。随后独立诊断脚本仅在自己的Chromium页面观察真实SDK/DOM与原生scroll事件，不mockSDK/回调，不改scrollTop或时钟，不改生产源：原采样流程 **3/3 FAIL，exit1**（validation/anchor-probe-original.txt/json），等实际测量/滚动完成的同阈值差分 **3/3 PASS，exit0**（anchor-probe-settled.txt/json）。

每次失败都在scrollTop=1640、atBottom=false时捕获article-502、offset164.453125；约15ms之后真正native scroll事件才到2040（恰好请求的400px wheel），窗口变503/504/505，旧502正常卸载，故比较返回null。追加本身未新增滚动事件或跳底。成功差分先确认折叠已测量，wheel后等待实际scrollTop>原值+390，再捕获article-504、offset135.890625；追加后仍2040/同ID同offset，delta=0，**原8px门槛及缺ID失败都不变**。原始JSON保留performance.now、scrollTop、scrollHeight、行ID/真实height/known-size、原生事件时间线。SDK、数据与运行源码相同。

根因是测试oracle把滚动前已成立的data-at-bottom=false当作wheel完成信号。[Playwright官方mouse.wheel文档](https://playwright.dev/docs/api/class-mouse#mouse-wheel)明确该方法不等待滚动结束。候选16运行源无需修复；只同步本条目提案与guide解释，公共e2e交root修正相同前置条件。不能把未稳定采样的正常虚拟化当SDK追加缺陷，也没有降低断言。

新增实际命令均由run-local.py记录，完整argv/cwd/UTC/exit见local-runs.json：

- `pnpm exec playwright test --config=.local-evidence/quality-playwright.config.ts e2e/quality-remediation-virtuoso.spec.ts --grep "@C09 advanced" --trace=on --reporter=line --output=entries/C09-react-virtuoso/validation/candidate16-repro-artifacts --workers=1` exit0；candidate16-repro.txt。
- 相同失败路径加`--repeat-each=5`、输出candidate16-repeat-artifacts，exit0；candidate16-repro-repeat.txt。没有重复basic/business/SDK/policy。
- `pnpm exec node entries/C09-react-virtuoso/validation/anchor-probe.mjs` exit1，原流程三次锚点消失；anchor-probe-original.txt/json。
- 同脚本加`--settle` exit0，三次delta0；anchor-probe-settled.txt/json。脚本明确放在validation诊断目录，其原生事件观察仅存于自有页面，finally关闭页面/browser，无产品调试代码。
- 受影响提案临时副本Biome exit0、strict类型exit0，日志anchor-proposal-format.txt、anchor-proposal-typecheck.txt；格式后同代码回存.txt并删除临时.check.ts。运行入口/metadata/依赖未变，原SDK2/policy4结果按影响复用。

**C09再次FINAL STABLE，停止全部C09写入。** formal三项仍NOT_RUN；root公共advanced修正后的最终候选回归由root执行，不能从诊断差分或trace-on通过自动升级正式状态。现在恢复C13已授权整改。


## root candidate16 真实场景闭环（最新状态）

root实际执行的 candidate16/browser-targeted-observation-retry.txt 已只读核实：cwd为Lab，三个其他条目失败路径合并定向运行共3/3PASS、exit0，其中 @C09 advanced 2.2s通过；没有将另外两个条目计作C09测试数。原browser.txt的C09 basic/business/官网三PASS按运行输入不变复用，因此C09本候选三个真实目标+官方展示共4PASS。

公共观察已增加真实折叠测量/scrollTop完成门禁；旧3/3原采样FAIL及诊断记录保留。运行源码/SDK/依赖无变化，原8px、缺ID必须失败、真实prepend/展开/按底部状态跟随均未放宽。未重复已有SDK2/policy4或basic/business检查。guide与entry提案仅说明实际采样边界。

六项最新：技术准确PASS（静态/类型/SDK2），解释PASS，Demo有用PASS（匹配candidate16三个实际交互目标），迁移静态PASS，官方来源PASS（官网unknown并非iframe允许），结果可复核PASS（局部命令和root匹配候选真实日志）。正式verification三项仍NOT_RUN；OS IME/辅助技术/真实后端/独立迁入仍未验收，不能扩大该4PASS的含义。verification只同步browser.note，不伪造收据或升级status。现在停止C09所有写入。
