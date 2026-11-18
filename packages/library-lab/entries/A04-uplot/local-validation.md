# A04 uPlot 内容整改与局部验证

本记录只证明列出的局部检查，不是平台正式sdk/build/browser收据。主控执行共享候选及真实浏览器；本工作者未运行全目录generate/typecheck/build或隐式build浏览器，未改公共文件、依赖锁、索引、queue/results，也未提交/推送/发布。

## 输入、范围和实际变化

- 实际仓库cwd：`/home/lambert/githubRepos/lambert/ReactLoom`；pnpm检查cwd：`/home/lambert/githubRepos/lambert/ReactLoom/packages/library-lab`。Git HEAD `1218066e706a90ba03fac8dff8c9b843dd2429c4`；开始时本条目9个受控文件，无本条目已有diff。Git HEAD不是条目输入摘要。
- 只写`entries/A04-uplot/**`。保留原有每列100点上限、Unix秒、先进样本窗口、650ms interval、减少动态/可见性策略、ResizeObserver+rAF/实例身份检查与destroy清理。
- basic教列式数据→同Canvas setData→真实setSize；business教不同频率真实join、缺测null与测得0、两单位轴和setSeries；advanced教手动追加/旧点淘汰、真实定时推进、暂停/重置/销毁。没有HTTP遥测、ring buffer、导出、Worker、FPS或堆内存结果。
- `series-data.ts`提取原有有界公式；business新增真正uPlot.join对齐分钟/三分钟数据，把SDK产生的undefined对齐槽位归一为null。错误时间轴是延迟轴子集，合并后仍最多100点；不把这一上限推广到任意多源并集。
- `chart-options.ts`提取真实配置；`example.tsx`保留有效生命周期，新增实际SDK setData/setSize/setSeries/ready hooks观察plot.data、宽高、轴/scale对应关系。instance编号、事件计数和data-uplot-destroyed是本例自建观察，结果来自真实SDK事件，不是SDK公开内存指标。
- advanced追加1/10个模拟采样触发新的有界快照→setData；不是不存在的SDK append API。100点只约束应用保留的列长度，不能证明总堆内存/Canvas backing store受同样上限。

## 六项复核

| 维度 | 当前结论 | 证据和边界 |
| --- | --- | --- |
| 技术准确 | PASS（源码/类型/SDK工具局部） | 安装1.6.32与固定提交匹配；AlignedData、默认Unix秒、setData默认reset、setSize/setSeries/destroy与hooks均核对。真实Node join工具3项已通过；不包含Canvas执行。 |
| 解释清楚 | PASS（静态自审） | guide先工程问题、输入输出/所有者，再三个独立实验、关键参数与迁移取舍；说明null/0、两轴单位、秒/ms、数据保留/内存、更新/重建、SDK/示例的分界。 |
| Demo有用 | NOT_RUN（真实browser待主控） | 三目标有真实控件/源码/观察点，Playwright提案逐项覆盖；Canvas绘制、同实例更新、实际resize、定时暂停和销毁尚未运行。 |
| 源码可迁移 | PASS（条目类型/格式/文件） | 6份必要本地运行文件均列sourceFiles，包内CSS导入保留，类型与相对依赖检查通过；没有模板/公共宿主耦合。 |
| 官方来源可靠 | PASS（固定原文/完整GET头） | tag1.6.32固定commit、官方package.json与安装版本匹配，原文10889B/hash一致、英文回退范围明确；官方仓库XFO deny/CSP frame-ancestors none明确blocked。 |
| 结果可复核 | NOT_RUN（整体验收） | 实际命令/cwd/时间/exit/原始日志与输入摘要齐全；SDK工具和4纯策略不能代替真实图表、隐藏页面/原生资源、移动布局与正式收据。 |

## 版本、API和来源

本地`node_modules/uplot/package.json`为1.6.32、MIT，无React peer，类型在dist/uPlot.d.ts。实际读dist/uPlot.esm.js的domEnv、join、setData、setSize、setSeries、destroy及hooks：Node导入工具可用，但没有document来创建真实DOM/Canvas。没有安装或注入伪DOM/canvas。

- `git ls-remote --tags https://github.com/leeoniya/uPlot.git '*1.6.32*'`实际解析commit`e995b061e9fc5476a6d862cd2fb2ebc7452ca012`。固定ref package.json GET200，version1.6.32。
- 官方[README固定来源](https://github.com/leeoniya/uPlot/blob/e995b061e9fc5476a6d862cd2fb2ebc7452ca012/README.md)，repository=`leeoniya/uPlot`，path=`README.md`，language=`en`，version=`1.6.32`，snapshot=`official/readme.md`。固定根目录实际只有README.md候选，没有中文根README，保留英语原文。
- 原文10889字节，SHA256=`8fd11454911e4e8db65d53fe9791daec932dd4208d51f07a68c3f3721ad5947b`，同步时间`2026-11-10T10:55:52.694814+00:00`。没有把本地讲解或翻译插入快照；上游性能表是上游特定环境材料，不当作Lab测量。
- 官方包的homepage为仓库。实际GET `https://github.com/leeoniya/uPlot`返回200、最终URL不变，完整头有X-Frame-Options deny和CSP frame-ancestors none，状态blocked并保留直达。仅读取完整官网GET头，不声称取得其HTML正文摘要；Lab-origin iframe未运行。
- [source-evidence.json](official/source-evidence.json)保存目录、原文、固定package.json和主页完整响应头/最终URL/状态；原文等已读正文有真实bytes/hash，官网头请求明确NOT_READ正文。实际来源脚本[fetch-official.py](validation/fetch-official.py)与日志[source-fetch.txt](validation/source-fetch.txt)可复查。

## 实际定向检查

以下命令实际cwd均为`/home/lambert/githubRepos/lambert/ReactLoom/packages/library-lab`，经Python subprocess实参数组执行，日志含完整ARGV、UTC起止、exit、stdout与stderr。未对通过的SDK/策略反复执行。

| 命令 | 真实结果 | 原始日志 |
| --- | --- | --- |
| `pnpm test:sdk --entry=A04` | exit0；真实join工具3 PASS；当次历史还有Canvas说明占位1 SKIP | [sdk.txt](validation/sdk.txt) |
| `pnpm test:policy --entry=A04` | exit0；原4项暂停纯策略PASS | [policy.txt](validation/policy.txt) |
| `pnpm exec -- tsc --ignoreConfig --noEmit --target ES2022 --lib ES2022,DOM,DOM.Iterable --module ESNext --moduleResolution Bundler --jsx react-jsx --strict --skipLibCheck --esModuleInterop --allowImportingTsExtensions --types vite/client,node entries/A04-uplot/examples/demo.tsx` | exit0；最后新增真实轴/scale观察后只重跑受影响类型 | [entry-typecheck-final.txt](validation/entry-typecheck-final.txt)，原次[entry-typecheck.txt](validation/entry-typecheck.txt) |
| `pnpm exec -- biome check --write entries/A04-uplot/examples entries/A04-uplot/tests` | 最初exit1指出level重置effect显式依赖；保留语义依赖并注释后exit0 | [format.txt](validation/format.txt)、[format-final.txt](validation/format-final.txt) |
| 单条目examples/tests/library/verification/source-evidence的Biome | exit0；11文件无修复 | [biome.txt](validation/biome.txt)，收尾metadata另见format-metadata-final.txt |
| `pnpm exec -- biome check --write --stdin-file-path=entries/A04-uplot/validation/browser-proposal.ts` | exit0；完整提案正常格式/规则 | [proposal-format.txt](validation/proposal-format.txt) |
| `pnpm exec -- tsc --ignoreConfig --noEmit --target ES2022 --lib ES2022,DOM --module ESNext --moduleResolution Bundler --strict --skipLibCheck --types node entries/A04-uplot/validation/.browser-proposal-check.ts` | exit0；临时同内容.ts随后删除 | [proposal-typecheck.txt](validation/proposal-typecheck.txt) |
| `node --input-type=module`单条目metadata/运行依赖/原文/状态断言 | exit0；3目标/6文件/hash/状态一致，SDK恰3真断言且无占位 | validation/entry-metadata.txt（完整stdin） |

主控指出SDK套件不应放一个仅说明用的Canvas SKIP占位。本轮删除那个从未执行的空占位，仅保留3个真实join断言，未重跑内容未变的3 PASS或原4 policy。sdk.txt保留真实历史3 PASS/1 SKIP，不篡改为一次“3/3运行”；当前可发现SDK套件恰有3个真实工具断言。Canvas构造/setData/setSize/destroy移至本记录和browser待办，继续NOT_RUN。正式sdk/build/browser三项一直NOT_RUN。

最终仓库根cwd的`git diff --check -- packages/library-lab/entries/A04-uplot`记录于validation/diff-check.txt；运行输入、证据日志和提案摘要在validation/input-hashes.json。该文件不是平台正式source fingerprint。

## 文件与迁移

修改guide/agent/library/verification，examples/example.tsx补实际观察和控件，demo.tsx/stream-policy.ts及原stream-policy.test.mts仅正常格式；新增examples/series-data.ts、chart-options.ts、workshop.css、tests/sdk.test.mjs、official/readme.md/source-evidence.json、本记录及validation脚本/日志/提案。AGENTS.md未改，没有二进制资产或新依赖。

运行需要React浏览器环境、uplot1.6.32、包CSS及上述本地CSS/相对文件。sourceFiles每目标6份：demo、example、series-data、chart-options、stream-policy、workshop.css。生产还需要自己的数据校验、来源/身份、点数/CPU/DPR预算和跟随策略；本例没有这些HTTP服务。

## 主控浏览器交接

[完整Playwright源码提案](validation/browser-proposal.txt)已通过类型/Biome，尚未接公共e2e或运行。覆盖所有声明目标，不能把提案静态检查写成browser PASS。

- 保留region“uPlot 实时数据示例”、采样数量28/60/100、开始/暂停模拟采样、清空增量并重置、明确允许在减少动态偏好下采样。新增使用窄面板、business显示错误数、advanced追加1/10个采样。
- testid：a04-workshop、a04-plot、a04-sdk-summary、a04-data-summary、a04-plot-stats、a04-series-json。stats来自实际SDK hooks，含instance、dataEvents/sizeEvents/seriesEvents、宽高/点数/首末X、errorsVisible、seriesScales/axisScales/axisSides；JSON data来自plot.data副本。
- basic验证真实非空Canvas像素、Unix秒/28→60、同Canvas/instance、面板320px触发实际setSize；business验证3列/null≠0、errors右轴side1、setSeries隐藏/恢复但保留数据；advanced验证100点追加10后首末+600秒、不增实例，减少动态暂停→显式覆盖采样→手动暂停/重置。
- 卸载前保留实际宿主ElementHandle，切换Agent指南后检查SDK destroy hook写入旧宿主data-uplot-destroyed=true及DOM断开；再resize无pageerror。该观察没有替换SDK或给出假Canvas。逐个native observer/listener detach还需单独证据，不能仅凭DOM消失推出。
- 仍NOT_RUN：真实图表与所有上述交互、实际隐藏页签状态切换、移动布局、完整原生资源解绑观测、堆内存/性能和正式收据；用户数据处理/HTTP从未实现。主控匹配本轮候选后验证。

稳定检查点：2026-11-10T11:07:55.905817+00:00；A04 STABLE，此后停止所有条目写入，交主控独立复核。


## 主控本地运行闭环

已由/root/quality_f05独立只读复核，无未处置阻断问题；candidate-07稳定构建/类型/目录通过且真实Chromium对应全部场景通过。本库content_done，正式sdk/build/browser仍NOT_RUN。实际命令、日志、首次FAIL及定位器处置与范围见[最终逐库结果](../../../../openspec/roadmaps/upgrade-library-quality/results/A04.md)，独立审查见[报告](../../../../openspec/roadmaps/upgrade-library-quality/results/review/A04-independent.md)。未重复有效SDK/策略/浏览器检查。
