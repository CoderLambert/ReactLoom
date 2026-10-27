# Library Lab 实施计划

用户已审核并授权 v2 直接实现。主任务 #4；独立应用 packages/library-lab，private；集成分支 feat/library-lab，初始基线 05b4e41a693663b63d8389abbb1e7b07195a4ed0。保留已有模板与 PR #3。完整 v2 来源为会话文件 REQUIREMENTS-V2.zh-CN.md（file_0000000046c082309dd28c0aebf26ed7），不得将其“待实施”状态当成需要重新询问用户许可。

## 已落地的公共协议

每条 library.json 是元数据事实源，examples 是运行及展示源码事实源，verification.json 是真实执行摘要。统一 guide.md、agent.md、AGENTS.md。分类119项：A17/B22/C22/D21/E19/F18。四个 Tab：Demo/文档/Agent/相关。React 示例按需动态加载、显式启动、离开卸载。源码视图从实际文件生成 SHA-256，不手写另一份。

## 开发队列

- [x] LL01 身份目录恢复：119条；原件缺失E11/F05明确保留。
- [x] LL02 元数据/源码路径校验、重复ID/关联与生成器初版。
- [x] LL03 独立SPA源码、路由、布局、CI bootstrap；实际依赖安装/构建仍待验证。
- [x] LL04 四Tab、安全Markdown、目录（ATX/Setext）、按需高亮、受限同源相对链接、源码与raw文档已接线；真实Chromium/生产预览仍待验收。
- [x] LL05 React DemoHost初版；Worker/SW/frame/node证据runner待实现。
- [ ] LL06 六风险切片：ECharts/Floating UI/RHF/p-limit/Monaco/MSW。
- [ ] LL07 存储、WASM、历史依赖等特殊环境。
- [ ] LL08 六组逐批真实SDK、文档和Agent笔记完整接入。
- [ ] LL09 Agent从目录定位并迁移实现。
- [ ] LL10 发布回归、许可、性能、旧模板不回归。

## 约束

只在私有开发分支操作，不擅自合main或公开部署。不执行上传ZIP里的脚本和旧AGENTS。根依赖/锁文件和公共组件单一owner，条目分组并行。每轮尽量连续完成一批，不因一个检查阻塞停止所有独立任务。

测试从原全套放宽为定向检查，但类型/构建/关键交互仍保留；测试状态PASS/FAIL/NOT_RUN/BLOCKED清晰。使用业务Mock不能冒充SDK验证。当前Node平台测试17 PASS，SDK测试因依赖未安装BLOCKED，TSX静态解析不是完整类型检查。

## 用户启动

pnpm --filter @reactloom/library-lab dev
端口4319。首次需要真实pnpm安装及锁文件更新。产物不默认公开；原研究全文仍待按条目审查导入。


## 第1轮公共平台增强（2026-10-27）

新增离线 `library:find` 命令给 Agent 精准查找库说明、示例及验证路径；源码面板改为每文件按需请求+摘要校验，不再一次下载整库源代码；`catalog:check` 增加实际依赖声明静态一致性。离线 Node `test` 与要求真实 SDK 的 `test:sdk` 严格分离。以上仅代表代码与离线逻辑层交付，不表示生产依赖与浏览器已经验收。详见 `progress/PLATFORM.md`。


## 第2轮集成进展（2026-10-27）

A/B #16八条与C/D #18四条完整工作坊已实际合入集成分支，新增SDK包统一声明。当前 GitHub 文件树与根索引一致：119已收录，47个条目有三层源码和独立guide/agent，共141项演示选择；72项仍缺完整示例。只属于代码及文档接入，真实SDK运行、tsc、构建、Chromium仍缺独立执行证据。增加根目录索引一致性工具及CI条件检查、修正Markdown本地源码引用，详见progress/PLATFORM.md。所有内容仍留在Draft PR #8。


## 第4轮集成开发（2026-10-27）

已分别 squash 合并 AB PR #23（6库）与CD PR #24（5库）到集成分支；119目录中已有74库的完整指南与示例源码，45库仍缺。平台增加SDK Node测试按ID/按组选择器，并提供缺测失败语义；公共 package声明已补齐本批14个版本条目，根Agent索引保持119条同步。尚未生成实际pnpm锁文件，不以静态版本匹配、离线单测或GitHub无runner的失败job声称生产验收。进度与实测边界见progress/PLATFORM.md。


## 第5轮持续集成进展（2026-10-27）

已审核并集成EF #25、AB #26、EF #27共17条真实库研究源代码，#27 EF进度冲突通过保留两批记录的双亲合并修复。总计119个目录中91个具有guide.md/agent.md/实际示例源码，273项分层场景配置，28项未实现；实际官方SDK/browser PASS仍无本轮新证据。公共package登记实际条目版本；固定F04/F10/F16/F18 Node CLI verifier，修正示例复现命令并防止任意demo.level注入，离线定向Node纯逻辑14 PASS。根pnpm-lock/真实生产build/SDK/浏览器BLOCKED或NOT_RUN，F06/F07 PDF.js版本冲突仍在#22。详情见 progress/PLATFORM.md。


## 第5轮最终合入状态（增量CD #28与内容门禁）

#28额外合入Valibot、IMask、react-arborist、nuqs、Dexie、Comlink六条（squash `c58f18ea8656aebebc09c204b89739065c643150`）。合计本轮四个worker PR (#25、#26、#27、#28)新接入23条，最新为119目录/97条源码+文档/291个三层场景/22条待实现。PLATFORM统一更新依赖和索引，并为完整条目引入guide/agent/目录规则/证据/三个真实示例的结构门禁。离线定向Node检查18 PASS、0 FAIL；目标SDK、完整TS/Vite生产构建、Chromium及锁文件仍因环境不可用NOT_RUN/BLOCKED，不继承旧研究报告的PASS。


## 第6轮公共集成与准确验证（2026-10-27）

AB Draft #29 通过双亲合并集成A09 Excalidraw/A10 tldraw/B05 Rive；软件依赖和两份根索引已同步。119身份目录中100条已具四件套与三层实际源码（300种选择），19条待接入。离线 `library:status` 逐文件指纹验证及证据失效降级共享目录生成器的同一合同，真实SDK/tsc/build/E2E/锁文件仍未取得有效运行证据。详见 `progress/PLATFORM.md`。

## 第8轮公共平台增强（2026-10-27）

已合入 AB #33、EF #34 定向生命周期/PDF Worker配对修复；客户端加中文IME组合安全的目录搜索和生成catalog运行边界校验，拒绝无指纹/执行命令/证据的伪PASS。当前119目录/111完整源码+文档/333场景声明/8项待接入。离线Node10 PASS、TSX仅语法解析；真实SDK、完整TypeScript、Vite构建和浏览器仍无Runner/npm证据，主Draft PR #8保持待验收。

## 第9轮 — 源码与文档目录覆盖完整（2026-10-27）

五项 worker PR #35/#36/#37/#38/#39 合入独立集成分支，其中 C/D 最后8条内容与三层示例已补齐。**119/119条具备源文件和指南、357个场景声明，但零个条目因本轮而新增实际SDK PASS**。根目录目录文件同步、固定 Node CLI 运行器追加 D16/D21，公共依赖元数据集中更新。质量门禁 LL08 只能在真实SDK/浏览器/构建获得证据后最终关闭，LL10仍未完成。CI实际runner_id=0，无构建日志；根锁文件未解析，不得将静态覆盖率冒充应用可运行。

## 全量源码收录后的公共平台增量（2026-10-27）

AB #41、CD #42、EF #43 三条高价值质量 PR 已审核合入集成分支，持续修复 ECharts 动态资源、React Flow DAG、cmdk 输入法，RHF/TanStack Query 异步所有权，以及 PapaParse/ExcelJS 导入安全。公共平台由一次请求所有119份重型 `catalog.json` 改为初始轻量 `catalog-index.json` 加库级按需 `raw/<ID>/detail.json`，绑定原源码指纹并取消旧请求；保留完整目录供离线 Agent。依赖安装/生产构建/SDK/Chromium 尚无真实执行证据，LL08、LL10 仍保持未验收。进度和精确SHA见 `progress/PLATFORM.md`。


## 公共平台第10轮 — SDK 与策略测试分流（2026-10-27）

三个不同所有权的 worker PR #44（A/B）/#45（C/D）/#46（E/F）经逐文件范围审核后 squash 合入 `feat/library-lab`，分别对应 uPlot/G6/AntD/Embla、TanStack Table/Ky/Axios/Zustand、Monaco/pdf-lib/MSW 的 UI 与资源生命周期加固。它们不扩充119个身份条目或357个场景声明，也不等于官方 SDK 运行通过。

发现 SDK 测试运行器原先会把 `page-policy.test.mjs` 等纯函数测试计作 SDK 套件，可能导致没有加载目标库也得到 SDK 选择器 PASS。因此改为仅选择 `sdk.test.mjs` 和 `node-scenarios.test.mjs`，另提供可按条目/分组执行的 `test:policy`，明确禁止跨分类推断；通过名称筛选仍不代替实际执行和导入审查。完整应用类型/构建/浏览器与锁文件因可执行环境缺失仍不能标记已验证。


## 公共平台第13轮 — AB/CD 集成及源码响应上界（2026-10-27）

AB #56 与CD #58 经base/head/diff及文件所有权审核后合入集成分支；EF #57 的两处Node测试相对导入路径错误已提交review，修正前不合并。SourceViewer新增严格source-index验证及不超过索引声明字节数（生成器文件上限2MB）的流式源码读取，保留原SHA-256核验，阻止伪造大小、缺失文件和旧源误复制。配套6项Node离线测试已在精确新模块字节下运行通过，原始TAP保存在 docs/library-lab/evidence/platform-wave13-node.tap；2项新Chromium preview案例仅提交未运行。此轮仍无第三方SDK、真实pnpm锁、完整TypeScript、Vite、浏览器PASS；不能从119份目录和357场景配置推断SDK通过。详情见 progress/PLATFORM.md。


## 第17轮：文档导航与链接同源边界（2026-10-27）

AB #68、CD #69、EF #70 已由PLATFORM核对变更文件范围和固定head后squash合入私有集成分支；覆盖ECharts、Floating UI、两类拖拽、JSON Forms/nuqs/XState、Monaco及Orval安全交互，不新增库身份或SDK PASS。公共 src/lib/document-utils.mjs 支持Setext目录/正确首行ID，拒绝带尾随代码的假fence及站外伪BASE_URL；精确GitHub Blob同源的Node定向测试10 PASS/0 FAIL，证据见 progress/PLATFORM.md 和 evidence/platform-wave17-markdown.tap。另新增生产preview中的Setext目录/重复anchor/伪标题 Playwright烟测，仅提交未在Chromium运行。根lock真实解析、完整tsc/Vite、SDK/浏览器仍未通过；PR #8保持Draft。


## 第18轮：三组质量集成与公开JSON传输防护（2026-10-27）

已审核并 squash 合入三组限定目录的 worker PR：AB #71（React Flow/MapLibre/cmdk）、CD #72（Virtuoso/TanStack Virtual/Fuse.js）、EF #73（MSW/PDF.js/react-pdf）。本批仅加固已接入的9项，不增加119身份库或357项三层场景配置。公共平台 `src/lib/bounded-json.mjs` 已把首页 `catalog-index.json`、单条 `detail.json`、源码 `source-index.json` 的 fetch 改为按解压后流字节上限读取，校验MIME并拒绝SPA fallback；有独立Node测试与3项生产preview回归源码，仍保持已有schema与SHA审查。**精确源码同源的Node定向测试6 PASS/0 FAIL、独立类型声明静态检查PASS**；新Playwright、完整React TSX/Vite、真实SDK/Chromium均未运行，不能据此关闭LL06/LL08/LL10。基于官方tag核对MSW 3.0.3、react-pdf 11.0.0及pdfjs-dist 6.3.289的版本/peer/许可；实际pnpm锁解析继续BLOCKED。详见 `progress/PLATFORM.md` 第18轮。PR #8保持Draft。

## 第20轮：源码索引与详情版本同源约束（2026-10-27）

公共生成器为实际源码文件列表、SHA-256及字节数的规范化JSON生成 `sourceIndexSha256`，详情在已与轻量目录sourceFingerprint匹配后提供该摘要。源码面板先验证上限/路径和完整索引摘要，再按文件SHA与大小下载；有效格式的旧索引或整体替换索引不能再静默通过。详情缺摘要或浏览器不支持WebCrypto时fail closed。已提交生成器、协议、Node回归源码与生产preview负例。精确远端源码及测试两Blob的离线Node定向运行7 PASS，但仅覆盖 `source-integrity` 逻辑；生成器完整/浏览器/第三方SDK仍NOT_RUN，根依赖锁与完整tsc/build仍BLOCKED。进度与证据见 `progress/PLATFORM.md` 第20轮；不将静态119条/357场景声明计为验收成功。主PR #8保持Draft。


## 第22轮：MSW受限Worker资源准备与生成资源URL边界（2026-10-28）

本轮审核并集成AB [#80](https://github.com/CoderLambert/ReactLoom/pull/80)、CD [#81](https://github.com/CoderLambert/ReactLoom/pull/81)、EF [#82](https://github.com/CoderLambert/ReactLoom/pull/82)，保留仅 A/B、C/D、E/F 条目及各自进度的所有权。公共平台直接为F11预检新增**官方 MSW Worker 静态资源的待执行构建路径**：`dev`/`build` 在Vite前用`msw init ./public/lab-runners/msw --no-save`生成，`scripts/verify-msw-worker.mjs`检查常规文件、路径、UTF-8、JavaScript事件处理器及≤512KiB字节预算，并输出只表示静态产物检验的SHA-256。根`mockServiceWorker.js`不产生；默认加载主SPA也不得注册。**此路径尚未实际从 npm 安装及构建环境执行，且尚无独立 iframe/CSP/注册/双标签实测；它并不意味着MSW已经工作。**

所有五类公开生成资源继续使用唯一`requestGeneratedResource`，新增规范路径拒绝规则：包括编码`..`、双重编码、编码分隔符、query/fragment、空路径段和控制字符；保留按响应流上限、超时、取消和当前源码摘要验证。安全逻辑定向离线Node 6 PASS/0 FAIL，全部官方 SDK/应用 TypeScript/Vite及Chromium仍BLOCKED或NOT_RUN；细节和Git Blob同源TAP见`progress/PLATFORM.md`第22轮。根`pnpm-lock.yaml`只接受真实pnpm解析结果，不生成虚构integrity。主PR #8继续Draft待用户验收。
