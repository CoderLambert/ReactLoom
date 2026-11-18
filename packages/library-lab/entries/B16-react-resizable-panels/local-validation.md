# B16 本地整改与真实验收边界

2026-11-10，quality_e11 独占 B16；实际 cwd `/home/lambert/githubRepos/lambert/ReactLoom/packages/library-lab`，HEAD `1218066e706a90ba03fac8dff8c9b843dd2429c4`。候选12释放后开始写入。原7文件条目无初始diff，原文件摘要及问题/目标见 [baseline.json](validation/baseline.json)。仓库还有其他工作者，本轮只写本条目，没有改公共源码、e2e、依赖/锁、索引、队列/results，没有提交/推送。

## 原问题与实际改动

保留已有效的两栏、三栏和纵向/复位三个目标，真实SDK指针/键盘、百分比约束、稳定useId、key重挂均沿用。旧文把“复位清空status直到再次拖动”当保证，与4.14.1 Group挂载主动回调相反；源码布局只存压缩字符串，可迁移必要样式不独立；官方原文与完整头、本库局部检查和可执行浏览器提案缺失。

现在按正常排版分出必要panels.css，保留真实Group/Panel/Separator；snapshot保存SDK layout对象副本和meta.isUserInteraction，尺寸表及可展开原始映射读同一对象。来源区分用户输入与初始化/程序变更，复位/方向切换重新发布真实默认布局，不再承诺空状态一直持续。没有自建求解器、mock测量、网络fixture、storage或全局清理。

中文guide/agent围绕三目标给输入→API→结果、Panel尺寸prop数字px与Layout数字百分比的差异、扣除分割条后的轴空间、相反的separator ARIA轴、F6与Home/End、挂载/用户回调区别、CSS内外层和SDK自身资源所有权。旧未来补丁/历史CI叙述和重复未实现生产片段删去；保留实际未实现边界。

## 六项状态

| 维度 | 当前状态及层级 | 证据与实际边界 |
| --- | --- | --- |
| 技术准确 | PASS（静态匹配源码/局部真实SSR） | 实装4.14.1，React/DOM peer ^18\|\|^19，当前19.3.0。Group挂载回调meta false、布局映射数字、键盘5pp/Home/End/F6、separator ARIA和unmount资源引用计数均对照匹配源码；SDK2只静态SSR，不是事件/几何求解PASS。 |
| 解释清楚 | PASS（作者静态检查） | 双栏约束、三栏身份/边界、纵向与复位独立目标，中文步骤对应实际控件；明确SDK与应用状态、持久化未实现、初始化不是用户操作。独立内容review待主控。 |
| Demo有用 | NOT_RUN（实际浏览器） | 三目标真实源码与完整3case提案就绪，实际指针/键盘/几何/窄屏/卸载由root候选统一跑；SSR输出不能填此项PASS。 |
| 源码可迁移 | PASS（静态/条目严格类型） | 三sourceFiles齐、必要局部CSS无宿主alias/资产依赖；useId稳定、key重挂产品语义、SDK own事件/RO清理，没有清空其他Group。真实客户端清理尚未验收。 |
| 官方来源可靠 | PASS（固定原文/实际HTTP） | npm gitHead与annotated4.14.1 tag→commit0cd376c57a19900d22f33aa8eb46f417a7437c12、匹配manifest；27652B原文hash、未截断tree四候选无中文，7请求完整头。官网GET200无XFO/CSP→unknown，未冒称allowed。tag unsigned，未宣称密码学签名验证。 |
| 结果可复核 | NOT_RUN（整体客户端运行）；局部检查PASS | SDK2、条目/提案类型、格式、metadata exit0，真实cwd/argv/时间/退出码和原始txt日志齐；没有policy求解器替代SDK。formal sdk/build/browser/content保持NOT_RUN，等待独立复核及正式收据。 |

## 真实命令、cwd和日志

下面命令实际 cwd 均为 `/home/lambert/githubRepos/lambert/ReactLoom/packages/library-lab`。每条由 `python3 entries/B16-react-resizable-panels/validation/run-local.py <label> ...` 执行并保留原始输出；官方fetch使用同等subprocess捕获。完整结构化执行记录见 [local-runs.json](validation/local-runs.json)。本表省略外层日志包装器，保留真实被执行argv。

| 实际命令 | exit | 原始日志 |
| --- | --- | --- |
| `python3 entries/B16-react-resizable-panels/validation/fetch-official.py` | 0 | [official-fetch.txt](validation/official-fetch.txt) |
| `pnpm exec biome check --write entries/B16-react-resizable-panels/examples entries/B16-react-resizable-panels/tests entries/B16-react-resizable-panels/library.json entries/B16-react-resizable-panels/verification.json entries/B16-react-resizable-panels/official/source-evidence.json entries/B16-react-resizable-panels/validation/metadata-check.mjs entries/B16-react-resizable-panels/validation/sdk-source-audit.json` | 0 | [biome.txt](validation/biome.txt) |
| `node --test entries/B16-react-resizable-panels/tests/sdk.test.mjs` | 0 | [sdk.txt](validation/sdk.txt) |
| `pnpm exec tsc --ignoreConfig --noEmit --target es2022 --module esnext --moduleResolution bundler --jsx react-jsx --strict --skipLibCheck --esModuleInterop --types vite/client,node entries/B16-react-resizable-panels/examples/demo.tsx` | 0 | [typecheck.txt](validation/typecheck.txt) |
| `node entries/B16-react-resizable-panels/validation/metadata-check.mjs` | 0 | [metadata.txt](validation/metadata.txt) |
| `pnpm exec biome check --write entries/B16-react-resizable-panels/validation/browser-proposal.check.ts` | 0 | [proposal-format.txt](validation/proposal-format.txt) |
| `pnpm exec tsc --ignoreConfig --noEmit --target es2022 --module esnext --moduleResolution bundler --strict --skipLibCheck --types node entries/B16-react-resizable-panels/validation/browser-proposal.check.ts` | 0 | [proposal-typecheck.txt](validation/proposal-typecheck.txt) |

SDK测试是普通 `node --test`，真实2/2、0skip，进程自行退出；没有force-exit/process.exit/SDK mock。第1项确认水平组真实SSR、2面板百分比默认样式/可聚焦竖向separator与无服务端挂载回调，第2项确认纵向3面板/2横向separator及数字80→80px、字符串45%→45%。不证明SSR后的测量、约束、onLayoutChanged客户端时序、指针或焦点。

提案检查将browser-proposal.txt字节复制为同目录browser-proposal.check.ts，经Biome整理同步回.txt后实际strict tsc，随后删除临时.ts。没有第二份执行Demo或依赖扩展；没有运行全目录generate/typecheck/build，没有改formal状态。

## 来源与所有权证据

[官方原README](official/readme.md)固定 `bvaughn/react-resizable-panels@0cd376c57a19900d22f33aa8eb46f417a7437c12/README.md`，英文27652B，SHA-256 `d27812bc8cf8a5e07f0a58bcf68a8f48cc3cac4d22f917777e62662ab61c231c`。同步时间、registry/tag/tree/manifest/readme/官网7个匿名GET的最终URL、完整headers/字节/hash在[source-evidence.json](official/source-evidence.json)，原文未交给格式器。未截断tree仅根README与next/vike/vite集成README，无中文候选。

官网 `https://react-resizable-panels.vercel.app/` GET200；完整头无X-Frame-Options/Content-Security-Policy，证据两个字段明确null。缺限制头不能证明Lab-origin iframe成功，status保持unknown。未用GitHub/raw头冒充官网。

[sdk-source-audit.json](validation/sdk-source-audit.json)保存当前安装位置、包version/peer/license，真实package.json/d.ts/JS/source-map四摘要和Group/Panel/ResizeSeparator/onDocumentKeyDown/mountAxis原文。SDK为每轴注册RO和键盘等，文档指针监听按ownerDocument引用计数；Group卸载只清自己的轴，最后一个同document Group才移除共享监听。应用没有全局资源，禁止为测试清全局SDK状态。该源码证据不是已运行浏览器资源普查。

## 浏览器交接与剩余

完整真实Playwright源码：[browser-proposal.txt](validation/browser-proposal.txt)。没有SDK mock、page.route、人工触发DOM事件、假boundingBox或截图代替断言。

- basic：原始布局35/65和初始化来源；真实指针拖动/释放、左右键、Home16/End60；库映射与实际DOM几何匹配，ID不变，尺寸表同源。
- business：25/45/30三栏；第一边界右键→30/40/30，F6第二边界右键→30/45/25，Shift+F6回移；检查真实id/DOM存活及全部约束。
- advanced：切换纵向使旧Group离开DOM、默认比例重新发布、ARIA横向；右键不变/下键变化；复位重新挂载回25/45/30和初始化来源；窄屏几何/外框、停止卸载后原DOM不存活、重新运行恢复默认水平。

区域“可调整尺寸的工作面板”；b16-workshop有data-level/data-orientation；第一/二分割条名字“调整项目资源和主编辑区域”“调整编辑区域和检查面板”；高级控件“纵向排列”“复位布局”；b16-layout-source显示来源。先展开“查看 SDK 原始布局映射”再读取b16-layout；面板外层[data-b16-panel=explorer/main/inspector]的id与原始映射一一对应。

真实指针/键盘/约束、RO/共享监听动态清理、窄屏、正式browser仍NOT_RUN。触屏/读屏、SSR hydration、实际OS键盘差异、Grid/嵌套/折叠/持久化/HTTP不在本轮验收。没有新增公共依赖或接线缺口；所有正式结果由root对稳定候选与匹配收据判定，不以本轮SSR或shared build替代。

## 变动文件

修改library/guide/agent/verification和examples/example.tsx；demo.tsx仅正常排版；新增examples/panels.css、tests/sdk.test.mjs、official原文/完整证据及validation基线/源码审计/执行包装/metadata/日志/提案。原AGENTS保留。最终输入摘要见validation/input-hashes.json；不修改其他条目。交付STABLE后停止全部写入。

最终收尾：`git diff --check -- entries/B16-react-resizable-panels`，cwd同上，exit0，原始[diff-check.txt](validation/diff-check.txt)。README与运行源码在上述有效检查后未改。候选13冻结前全部材料齐，B16最终STABLE；此后停止包括日志/文档在内的全部写入。

## 主控candidate13真实闭环

非作者quality_e05六项无P1/P2，实际安装源码与13输入摘要已核；真实双栏pointer/keyboard约束/物理几何，三栏边界/F6焦点/稳定节点，纵轴/重挂reset/窄屏/卸载3项全部PASS，官方原文/unknown展示1PASS。SDK初次mount来源与真实用户回调区分正确，未用SSR2冒充几何。候选2350输入SHA3cbda8e4be7cfa3712e353275387d3de64b794898d59cb92ebb47da4266fa0d1，lint/type/build/catalog全部0且changed=[]。candidate13/browser.txt实际8项6PASS2FAIL，两失败均其他B12 Escape，不能扩推但本条4PASS有效。命令/cwd/exit/dist绑定/产物在对应candidate13目录；正式三项仍NOT_RUN，不为recorder擅自提交。
