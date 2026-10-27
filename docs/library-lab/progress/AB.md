# AB 开发进度 — A/B 前端库垂直实现

**最新调度轮次：20 / 最多24；状态：WAVE20_AB_39_SOURCE_HARDENING（39/39仅源码和文档覆盖；SDK、完整构建与浏览器尚未验收）。**

- 当前本批分支：`feat/library-lab-ab-wave20`，精确集成base `f96f43fad9ba6e227b71a85596c9b91eb1ff1dfb`；初始公共提交 `38ed2d247bd82e4f1422b0e8904973e16bca2972` 仅作历史，不使用force覆盖。
- 集成目标：`feat/library-lab`；本轮开始读取的最新头提交 `f96f43fad9ba6e227b71a85596c9b91eb1ff1dfb`，前轮 PR #71 已被 PLATFORM 合并。
- 当前分支仅修改 A*、B* 条目及本进度文件；不更改公共源码、依赖、锁文件、CI、主 PR #8。

## 第1轮实质交付

| 条目 | 源码 | 三层业务场景 | 文档 | 真实验证 |
|---|---|---|---|---|
| A01 Apache ECharts | `entries/A01-echarts/examples/example.tsx` | 柱状图、混合报表、实时更新/resize/dispose | guide.md + agent.md + AGENTS.md | SDK/构建/浏览器 NOT_RUN |
| B17 Floating UI | `entries/B17-floating-ui/examples/example.tsx` | 锚点浮层、新闻动作、滚动/IME/键盘 | 同上 | SDK/构建/浏览器 NOT_RUN |
| B16 react-resizable-panels | `entries/B16-react-resizable-panels/examples/example.tsx` | 双栏、三栏、方向/键盘/重置 | 同上 | SDK/构建/浏览器 NOT_RUN |
| B20 Sonner | `entries/B20-sonner/examples/example.tsx` | 基本通知、撤销、异步加载->完成/失败/卸载 | 同上 | SDK/构建/浏览器 NOT_RUN |

共 **4个完整内容+真实SDK调用源码的库**，12项示例注册（每库 basic/business/advanced），不是12份独立 runtime，也不是已经真实运行通过。A/B 全部39项中 **4项已接入，35项尚未实现**。只对新接入条目标记 `contentState=recreated`，旧研究的历史 PASS 未迁移。

## 实际检查与证据

- GitHub connector 实际创建并读取新增 Git tree `5a8385f956f2d594cbb127dacdba6773525b6e9f`，对4份 `library.json` 执行 JSON 解析、ID/目录一致、demo sourceFiles/entryPoint对应Blob路径、guide/agent文件存在核对：**4/4条元数据匹配，12/12入口文件存在，0缺失**。这只是静态结构检查。
- 实际 npm install、TypeScript typecheck、Vite build、目标SDK import运行、Chromium Playwright **本轮均未执行**。此前环境 npm/GitHub DNS失败；不把代码、静态目录检查或官方资料核对冒充SDK PASS。
- 全部验证记录 `sdk/build/browser: NOT_RUN`；新增后如后续SDK/浏览器证据出现，由集成任务与本通道协同更新对应文件。
- 官网资料交叉核对版本与API：ECharts按需 `echarts/core`、Floating UI `useFloating/useInteractions/autoUpdate`、Resizable Panels v4 `Group/Panel/Separator`、Sonner `Toaster/toast`。

## dependencyRequests（PLATFORM 唯一owner处理）

下列全部是本批代码显式引用的**生产依赖**，均不得由AB修改 `packages/library-lab/package.json` 或 `pnpm-lock.yaml`：

| 包名 | 指定版本 | 注册证据/API | 许可证 |
|---|---|---|---|
| `echarts` | `6.1.0` | https://www.npmjs.com/package/echarts ，官方按需模块 https://echarts.apache.org/handbook/en/basics/import/ | Apache-2.0 |
| `@floating-ui/react` | `0.27.20` | https://www.npmjs.com/package/@floating-ui/react ，https://floating-ui.com/docs/react | MIT |
| `react-resizable-panels` | `4.14.1` | https://www.npmjs.com/package/react-resizable-panels ，https://github.com/bvaughn/react-resizable-panels | MIT |
| `sonner` | `2.0.8` | https://www.npmjs.com/package/sonner ，https://sonner.emilkowal.ski/ | MIT |

安装时检查React19/TS7/Vite8的peer兼容性和包实际声明，并生成真实完整 lockfile；不要手工捏造 integrity。依赖解析失败时继续其他条目的独立工作，不能因平台依赖尚未到位直接把源码标为FAIL。

## 待集成测试建议（非已执行结果）

- ECharts：实际 `init/setOption/resize/dispose`，StrictMode两次挂载后无残余Canvas/监听；有限resizeObserver回调；可访问数据表完整。
- Floating UI：useDismiss的Escape和outside press、Portal、焦点回到触发器、scroll自动更新、中文IME内Enter不提交；键盘测试排空定位微任务。
- Resizable Panels：v4数字像素vs字符串百分比、约束、键盘Separator、横纵切换、没有多余存储写入。
- Sonner：同id更新、撤销真正回滚、卸载只清理本Demo toast ID、不误删其他通知。
- 不需要每次提交都全仓测试；对包依赖、运行时/共用DemoHost变动跑必要定向检查。

## 下一条目队列

1. A02 Recharts：声明式SVG图表，与A01 ECharts做真实可比较选型（依赖由PLATFORM接入）。
2. B18 cmdk：命令面板与中文IME输入、键盘焦点边界；不得与Floating UI重复管理焦点。
3. B19 Embla Carousel：滚动snap、触摸输入、动态slides和destroy。
4. B01 Motion for React：布局动画、exit及reduced-motion。
5. B13 dnd-kit：生产拖拽排序、触摸/键盘传感器、冲突与卸载。

后续恢复先检查 worker PR 是否已合并、公共协议是否变化、依赖请求是否被接受，再继续上一轮未完成的条目。只有PLATFORM可合入集成分支。
---

## 第2轮（wave2）：五个独立库，15个Demo选择

**runCount=2 / 24。** 首批 PR #9 已合入集成分支（merge SHA 0be4ba9da16ec351220d1f84527899c3d0c1b72d），本轮从集成 df4674d501bac029f8529ff940ba9b8c8707347c 新开 feat/library-lab-ab-wave2，避免重复使用已合并的 AB 分支。

| 库 | 真正调用的 SDK 与三层场景 | 重点风险 |
|---|---|---|
| A02 Recharts 3.10.1 + react-is 19.3.0 | SVG柱图、混合柱线指标、可变范围 | React匹配、容器高度、辅助技术数据表 |
| A03 Chart.js 4.6.1 | Canvas、原实例update、柱线切换 | Controller注册、destroy、StrictMode Canvas |
| B01 Motion 14.6.0 | Presence、列表增删、layout重排 | 减少动画偏好、稳定key与焦点 |
| B18 cmdk 1.1.1 | 内联、分组、Cmd/Ctrl+K Dialog | 中文IME Enter、disabled、全局快捷键清理 |
| B19 Embla React 8.6.0 | 触摸轮播、内容卡、动态增删+loop | v8 API、reInit、select/off 和 touch-action |

每个库：library.json、guide.md、agent.md、AGENTS.md、verification.json、examples/example.tsx、examples/demo.tsx；三层使用共享的真实SDK实现文件，不是15个独立构建。全部 contentState=recreated，不沿用历史运行结论。

**本轮实际证据**：新Git tree b57a265768169869f806daa5c381bd6d2fc65887 已通过 GitHub GET 逐项核对：5/5目录与元数据有效、15/15 Demo入口正确、10/10源码文件存在、5组文档和验证文件齐全，缺失0。只属于静态结构验收。npm安装、真实SDK执行、TS类型检查、Vite生产构建及Chromium均 **NOT_RUN**（本轮未执行），不可称为PASS。

**dependencyRequests（交PLATFORM维护，禁止AB改package和pnpm-lock）**：
- recharts@3.10.1、react-is@19.3.0： https://github.com/recharts/recharts ，React版本匹配，MIT。
- chart.js@4.6.1： https://www.chartjs.org/docs/latest/getting-started/integration.html ，MIT。
- motion@14.6.0： https://motion.dev/docs/react-installation ，MIT。
- cmdk@1.1.1： https://www.npmjs.com/package/cmdk ，MIT。
- embla-carousel-react@8.6.0： https://www.embla-carousel.com/docs/v8/get-started/react ，MIT。

集成前由PLATFORM真正解析peer和锁文件后运行定向类型/构建/SDK/浏览器；不可手造integrity。旧首批4项、本批5项，AB累计9/39条实战源码及文档，仍有30条待开发。**9不代表SDK已通过**。

下一队列：B13 dnd-kit（先明确新/旧API版本）、A05 D3、B02 GSAP、B19移动触摸验收、B18 IME浏览器验收；按后续集成状态继续，不重做已合并PR。

---

## 第3轮（wave3）：D3、GSAP、dnd-kit、React Flow

**runCount=3 / 24**。PR #9、#13 已合并到 feat/library-lab。本轮从 integration `2b244ef44cbf8e216a0f39e77b763acae8f50c04` 新建 `feat/library-lab-ab-wave3`，规避旧分支覆盖。仅修改 A*/B* 和本进度文件。

| 条目 | 实际SDK与三层演示 | 本轮约束 |
|---|---|---|
| A05 D3 7.9.0 | SVG柱图；双指标折线；日期/阈值动态变化 | SVG ref 作用域、ResizeObserver断开、D3元素/监听移除、等价数据表 |
| A06 React Flow 12.12.0 | 两节点连线；新闻流编排；新增节点/阻止自环/重置 | @xyflow/react新版包、受控节点/边、固定画布高度、文本数据表 |
| B02 GSAP 3.15.0 | 缓动；timeline入场；暂停/反转/重播/减少动画 | gsap.context + revert、matchMedia事件清理；GSAP标准授权不是MIT |
| B13 dnd-kit core6.3.1/sortable10.0.0 | 基本排序；RSS优先级；锁定/撤销/触控键盘 | 老版 DndContext + SortableContext 接口，不混用 @dnd-kit/react 0.x |

每项包含library.json、3层真实SDK入口、共享实际源码、guide.md、agent.md、AGENTS.md、verification.json。**4个库 / 12个Demo选择**（不是12个独立构建）。A/B累计**13/39**已编写，仍**26项未实现**。全部新增条目 contentState=recreated，历史PASS未继承。

### 实际测试和环境

- 已从GitHub按commit保存真实SDK import 源码，实际 npm install、SDK import runtime、完整typecheck、Vite build、Chromium **本轮未执行**：sdk/build/browser 均为 `NOT_RUN`，不得宣称PASS。
- 静态检查只表示 JSON/路径/源码存在，不能替代真实SDK运行。platform 依赖/锁文件只有PLATFORM负责。所有更新后的源码使对应旧证据无效。
- 重点待测：D3无多余图元+StrictMode；GSAP reduced motion+context.revert；dnd-kit键盘Space/Arrow/Escape、Touch、锁定与撤销；React Flow画布编辑+禁止自环+React19兼容。

### dependencyRequests → PLATFORM（准确版本/许可，需安装时核对peer）

- `d3@7.9.0`，ISC，https://www.npmjs.com/package/d3 ；TS须校验是否另需 `@types/d3` 与精确兼容版本（devDependency）。
- `@xyflow/react@12.12.0`，MIT，https://www.npmjs.com/package/@xyflow/react ，引入 `@xyflow/react/dist/style.css`；需在生产构建验证CSS/React19和bundle。
- `gsap@3.15.0`，**GSAP Standard No Charge**，不是MIT：https://www.npmjs.com/package/gsap ; https://gsap.com/standard-license ，实际采用context API，无额外React wrapper。
- `@dnd-kit/core@6.3.1` + `@dnd-kit/sortable@10.0.0`，MIT；https://www.npmjs.com/package/@dnd-kit/core ; https://www.npmjs.com/package/@dnd-kit/sortable ，检查两个包及React19 peer兼容，**不混用** @dnd-kit/react 0.x。

### 继续推进队列

优先 A07 AntV G6、A08 Mermaid、B03 react-spring、B15 grid layout；并在依赖/Runner可用后回归已接入4库及前9库的真实SDK、TS、浏览器交互。执行失败只记录实际日志，能独立推进时继续下一条目。worker PR base 始终为 feat/library-lab，合并只由 PLATFORM 执行。



---

## 第3轮追加：G6 / Mermaid / react-spring / react-grid-layout（同 PR #16）

保持 **runCount=3 / 24**（这是本轮的连续追加，而非新一轮）。在此前 A05 D3、A06 React Flow、B02 GSAP、B13 dnd-kit 的基础上，继续写入以下四个完整可迁移源码条目，并复用已经打开的 Draft PR #16，没有另建重叠PR。

|条目|官方SDK版本|三层示例|特殊验证关注点|
|---|---|---|---|
|A07 AntV G6|@antv/g6@5.1.1|三节点关系图、动态审校节点、容器缩放与实例重建|Graph.render异步、ResizeObserver、StrictMode destroy、Canvas无障碍替代|
|A08 Mermaid|mermaid@12.2.0|flowchart、sequenceDiagram、stateDiagram与非法DSL恢复|受控配置、唯一render ID、parse错误恢复、无脚本沙箱iframe|
|B03 react-spring|@react-spring/web@10.1.2|单卡片spring、列表useTransition、reduce-motion与键盘焦点|局部媒体查询监听、stable keys、immediate、focus恢复|
|B15 react-grid-layout|react-grid-layout@2.3.0 + react-resizable@4.0.2|静态网格、拖拽/缩放看板、锁定与窄屏/键盘替代|v2 width测量、controlled layout、稳定 i、cleanup/断点持久化|

每个库包含更新后的 library.json、3个 Demo 注册选择、同一真实SDK实现 example.tsx + 适配出口 demo.tsx、独立中文 guide.md、agent.md、目录 AGENTS.md 与 verification.json。未强行拆成12个复制组件。

**静态证据**：Git Tree `e3a285903b3d8fe925be51e513b8395b6fd6f6de` 经 GitHub tree API 读取，非截断（总967条树路径）；本批 A07/A08/B03/B15 **28/28 指定文件存在**，4/4 manifest Blob 能 JSON 解析，12/12 Demo 元数据指向真实存在的 example/demo.tsx，0结构缺失。该检查仅证明文件完整和目录协议，不证明 TS 类型、目标库 import、运行效果。实际 `npm install`、`pnpm typecheck`、`pnpm build`、SDK Runtime 和 Chromium 浏览器本轮 **均 NOT_RUN**，verification.json 全部保持 NOT_RUN，不可把静态检查改写为PASS。

**新 dependencyRequests → PLATFORM 单一负责人安装并生成真实锁文件**：
- `@antv/g6@5.1.1`，MIT，官方 React 5.x 生命周期：https://g6.antv.antgroup.com/en/manual/getting-started/integration/react
- `mermaid@12.2.0`，MIT，API：https://mermaid.ai/open-source/config/setup/mermaid/interfaces/Mermaid.html 。注意2026-08-04公告 GHSA-c4c3-pg64-4m4v（旧版配置原型污染）；本示例配置只用硬编码对象，生产需保证信任边界。
- `@react-spring/web@10.1.2`，MIT，hooks：https://www.react-spring.dev/docs/components/use-transition
- `react-grid-layout@2.3.0` + `react-resizable@4.0.2`，MIT，v2 的 useContainerWidth/gridConfig 与两个 CSS 样式入口：https://github.com/react-grid-layout/react-grid-layout 。

安装前由 PLATFORM 核验 React19/TS7/Vite8 peers，尤其 react-grid-layout 2.3.0 与 react-resizable 4.x；如实际依赖冲突，需要在官方支持版本范围内联动调整该条目库代码、元数据和测试，禁止只降级 package.json 而留下旧API。

**累计进度**：先前 wave1 4 + wave2 5 + 本轮 wave3 原4 + 追加4 = **17/39 个 A/B 库已编写真实 SDK import、完整指南与 Agent手册，共51个分层选择**；仍有 **22项未实现**。数量不表示已构建或已通过真实SDK验收。

**下一队列**：A04 uPlot（时间序列大数据/销毁）、A09 Excalidraw（React19/大型包/授权）、A11 Konva（stage销毁与坐标）、B04 dotLottie（资源许可与播放清理）、B06 Ant Design（受控表单/样式隔离）；在平台依赖/Runner可用后复验 wave1-wave3 的真实类型检查、SDK 和关键浏览器行为。所有补充仅在本库 A/B 与 progress/AB.md，公共依赖/CI由PLATFORM处理。


---

## 第4轮（wave4）：uPlot / Konva / react-konva / dotLottie / Ant Design

**runCount=4 / 24。** 历史 PR #9/#13/#16 已由 PLATFORM 合入 `feat/library-lab`。本批在集成基线 `688a660272775b3399a18ae34630401a19ac556c` 的独立分支 `feat/library-lab-ab-wave4` 开发；旧 `feat/library-lab-ab` 已非当前代码起点，严禁将其强推覆盖集成成果。基线目录仍是17/39个 A/B 条目实战源码。

### 本批实际新增代码

| 条目 | 目标实际 SDK 版本 | Demo 分层 | 主要工程特性 |
|---|---|---|---|
| A04 uPlot | `uplot@1.6.32` | 时间序列 / 双轴遥测 / 滚动窗口 | AlignedData、null缺值、Canvas setData、ResizeObserver+rAF、destroy、DOM表格 |
| A11 Konva | `konva@10.9.0` | 场景节点 / 拖拽卡片 / Transformer | Stage/Layer/Group/Rect/Text、按ID增量同步、transform scale归一化、滚轮坐标系、DOM键盘替代与清理 |
| A12 react-konva | `react-konva@19.3.2` + `konva@10.9.0` | 声明式Stage / 拖拽流程 / 动态节点 | React19.3适配、Group图元与文本一起拖拽、stable ID、ResizeObserver、HTML等价表格 |
| B04 dotLottie | `@lottiefiles/dotlottie-react@0.20.0` | 本地动画 / 业务成功反馈 / 动效控制 | 本地自有JSON资源、真正DotLottieReact data、ref实例播放控制、load/errors、visibility、prefers-reduced-motion、事件清理 |
| B06 Ant Design | `antd@6.6.7` | Input主题 / RSS Form+Table / 409错误回填 | ConfigProvider/App.useApp/Form/Table/Modal、稳定rowKey、字段错误回填、中文IME友好搜索、模拟业务与真实SDK区分 |

每库新增/更新 `library.json`、`examples/example.tsx`、`examples/demo.tsx`、`guide.md`、`agent.md`、`AGENTS.md`、`verification.json`；B04包含本地 `examples/pulse.json`。页面源码即实际entryPoint引用的同一实现，无第二份展示用伪代码。每库basic/business/advanced 3种选择，**本批5库、15注册示例选择**（并非15个独立运行时）。

### 实际静态校验（不等于目标 SDK 实测）

本轮已通过 GitHub API 针对**未提交前的真实tree**进行结构校验：5份library.json可解析、5/5各自guide/agent/AGENTS/verification齐备、15/15 Demo注册和sourceFiles指向现存blob，5项真实包import对应元数据声明；全部sdk/build/browser仍为 `NOT_RUN`。此前容器无法解析npm域名，未声称TypeScript或浏览器通过。

源码内额外审阅并修复：react-konva拖拽Group保证图形/文本同动；dotLottie使用稳定refCallback避免持续解绑重绑；两个Canvas示例新增节点ID递增避免删除后重复；Konva卸载不对已卸载组件setState。

### dependencyRequests — 仅 PLATFORM 维护 app package + 根锁文件

| 包 | 要求核对版本 | 证据与特定事项 | 许可 |
|---|---|---|---|
| `uplot` | `1.6.32` | https://www.npmjs.com/package/uplot；真实引入 `uplot/dist/uPlot.min.css`；时间轴秒/ResizeObserver | MIT |
| `konva` | `10.9.0` | https://www.npmjs.com/package/konva；Stage命令API、Transformer、2D渲染 | MIT |
| `react-konva` | `19.3.2` | https://www.npmjs.com/package/react-konva；**必须与React/ReactDOM ^19.3匹配**且peer配合konva10，旧React不能通用 | MIT |
| `@lottiefiles/dotlottie-react` | `0.20.0` | https://docs.lottiefiles.com/en/runtimes/distributions/react/v0.x/api-reference；真实WASM/Worker+本地JSON，检查CSP | MIT |
| `antd` | `6.6.7` | https://www.npmjs.com/package/antd；官方Form/Table/App使用；注意Portal样式和React19 | MIT |

PLATFORM需通过真实`pnpm`解析及锁文件提交依赖，核对本库和现有库的peer后运行定向typecheck/build；不能手动写lock integrity，更不能只修改package版本而留下旧API。SDK尚未执行时本通道不填PASS。

### 本批应补实测（待平台环境）

- uPlot：真实setData不重建Canvas、秒时间轴、窗口容量100、重复mount/resize/dispose无泄漏。
- Konva：Group增量同步、drag/transform、连续删除新增ID唯一、卸载Node/Canvas和Observer清零、键盘按钮与图形状态一致。
- react-konva：React19.3依赖兼容、拖拽时文字跟随Group、键盘操作替代、重复Stage挂载。
- dotLottie：本地JSON可实际解析、WASM/worker加载、系统减少动画关闭、页面隐藏暂停、实例ref不重复回调。
- AntD：Form成功/409失败、setFields错误可见、IME搜索、Table键盘焦点、Modal关闭及卸载Portal。
- 在没有真实npm和浏览器执行前全部保持NOT_RUN。没有让Mock取代任何目标SDK。

### 当前队列和计数

A/B累计 **22/39** 个库已编写源码、guide和agent手册，**17项待开发**；Demo选择累计66。此处22≠实际SDK验收22。下一优先：A15 Leaflet（地图tile与资源许可）、A16 MapLibre GL（需隔离环境）、B07 MUI、B08 Mantine、B11 Radix Primitives；对A09 Excalidraw/A10 tldraw及B21/B22历史迁移须先核对资产/授权与框架兼容。公共依赖/CI变更一律由PLATFORM执行。



### 第4轮同批继续：A15 Leaflet 离线地图（累计6库）

在本轮前5库的基础上继续新增 **A15 Leaflet 1.9.4**：真实Leaflet Map/LayerGroup/circleMarker、原创经纬网格、不加载任何远程瓦片、RSS地点筛选、站点标记及DOM弹窗、键盘可访问定位、响应式invalidateSize、动态节点与map.remove卸载。新增7个条目文件：library.json、真实React/Leaflet代码example.tsx+demo.tsx、guide.md、agent.md、AGENTS.md、verification.json；注册basic/business/advanced 3个可选场景。

**额外依赖请求**：生产 `leaflet@1.9.4`（BSD-2-Clause，https://www.npmjs.com/package/leaflet）；TypeScript开发 `@types/leaflet@1.9.22`（MIT，https://www.npmjs.com/package/@types/leaflet），务必由PLATFORM统一维护package/lock。Leaflet 1.9 API：https://leafletjs.com/reference.html 。没有实际连外部地图服务，不能以此代表在线瓦片权限或底图许可通过。

**计数修正**：本次完整轮次总共 **6库/18个分层Demo选择**；AB累计 **23/39** 项有源码/指南/Agent笔记，尚余 **16项**；总注册69个，均不等于SDK/浏览器验收。旧本轮前述“5库/22/39”的小计已被本节更正。Leaflet与前5库一样，真实SDK/build/browser本轮全部NOT_RUN，仅有GitHub静态源文件校验。

下一轮优先 A16 MapLibre（先审查无外部瓦片/worker配置与WebGL能力）、B07 MUI、B08 Mantine、B11 Radix、B12 React Aria，及A09/A10复杂白板的授权/依赖能力评估；不做虚拟截图代替SDK。


---

## 第5轮（wave5）：MapLibre / MUI / Mantine / Base UI / Radix / React Aria

**runCount=5 / 24**。本批从当时最新集成 HEAD `c93304753ba6cafe7788ad53ea4f133edbdd63e7` 新建 `feat/library-lab-ab-wave5`，不用已合并的旧 `feat/library-lab-ab`。先在集成根 catalog 核对：**23/39 A/B 条目已有源码**，本批另外新增 6 条，待集成后应达 **29/39，仍有10条待补**。以实际 manifest 为准，不能把 SDK 状态或 PR 未合并说成已发布。

### 本批实际完成（六库、18个场景选择）

|条目|真实目标SDK（依赖由 PLATFORM 核实安装）|可运行源码中的三个场景|边界重点|
|---|---|---|---|
|A16 MapLibre GL JS|maplibre-gl@6.15.0|WebGL空白样式/GeoJSON CircleLayer/动态来源和过滤|v6 ESM namespace-only import、WebGL2创建失败回退、load后source/layer、ResizeObserver/map.remove、无外网瓦片|
|B07 MUI|@mui/material@9.5.0 + Emotion 11.14|ThemeProvider/TextField/Chip；RSS Table+Switch；Dialog校验/模拟409/撤销|真实MUI组件与本地业务fixture明确分开、Modal焦点、Emotion样式与Portal|
|B08 Mantine|@mantine/core@9.7.3 + @mantine/hooks@9.7.3|主题表单；Table/Switch/防抖检索；Modal/NumberInput union校验|styles.layer.css，NumberInput string中间态不能直接写数字；useDebouncedValue确实从hooks导入|
|B10 Base UI|@base-ui/react@1.9.0|受控Checkbox；权限树与全选；indeterminate/disabled/真实FormData|保留原语键盘/隐藏input、业务权限与UI禁用区分、局部CSS|
|B11 Radix Primitives|@radix-ui/react-dropdown-menu@2.1.25|基础DropdownMenu；复选置顶+RadioGroup；Submenu/权限禁用|Radix管理焦点/ARIA、Portal、Escape及Tab卸载，无自造全局事件|
|B12 React Aria|react-aria-components@1.21.0|键盘ComboBox；RSS频道筛选；本地异步候选+FormData|受控inputValue和selectedKey分离、IME、旧请求generation+abort、禁用项和读屏|

每项均有 `library.json`、源文件 `examples/example.tsx`、Lab适配 `examples/demo.tsx`、中文深入 `guide.md`、`agent.md`、目录 `AGENTS.md`、`verification.json`；B10/B11/B12 还包含相应局部 CSS。所有条目 `contentState=recreated`，不是“历史原件被再次恢复”或目标SDK验收通过。每库三个basic/business/advanced**路由选择**，真实SDK代码被复用，不是18个独立bundle。

### 本批实际检查（仅静态检查）

- GitHub staged tree `2a273cbfccb259e30d2a05107bf30d43cf06781f` 已非截断读取（1240路径），逐库读取6份 JSON 清单、6份 `verification.json` 和真实 `examples/example.tsx` Blob：**6/6** 目录与JSON合法、**18/18** demo声明指向存在的源文件、要求的guide/agent/AGENTS和示例源码齐全、**0缺失**。
- 修复A16 v6无默认export / WebGL2构造异常后，重新暂存；B08 增加真实 useDebouncedValue 依赖调用。最终提交需检查最新tree及PR改动范围；静态路径检查不能证明TypeScript或API运行。
- **未执行** npm/pnpm安装、官方SDK runtime、完整tsc、Vite生产构建、Playwright Chromium。此轮没有新增运行时 PASS；6项 `sdk/build/browser: NOT_RUN`，仍需集成通道生成真实锁文件并验证。
- 本轮没有碰触公共代码、package/lockfile、CI、旧模板、main、既有PR #3 或公开部署。

### dependencyRequests（严格交给 PLATFORM 单一owner）

以下版本/API依据官方资料拟用，**不是安装成功证明**；集成前需核实npm发行、React19 peer、TS7/Vite8/CSS和许可，记录真实pnpm版本锁及sdk/build证据：

- `maplibre-gl@6.15.0`，BSD-3-Clause；v6 ESM没有default export、WebGL2需求、独立worker/CSP需浏览器核验。https://maplibre.org/maplibre-gl-js/docs/ ；https://www.npmjs.com/package/maplibre-gl
- `@mui/material@9.5.0` + `@emotion/react@11.14.0` + `@emotion/styled@11.14.1`，MIT；注意Emotion、CSS和Portal。https://mui.com/material-ui/getting-started/installation/
- `@mantine/core@9.7.3` + `@mantine/hooks@9.7.3`，MIT；样式仅引入`styles.layer.css`。https://mantine.dev/getting-started/ ; https://mantine.dev/styles/mantine-styles/
- `@base-ui/react@1.9.0`，MIT；只使用checkbox原语和原生表单。https://base-ui.com/react/components/checkbox
- `@radix-ui/react-dropdown-menu@2.1.25`，MIT；Popover/DropdownMenu的焦点事件由Radix维护。https://www.radix-ui.com/primitives/docs/components/dropdown-menu
- `react-aria-components@1.21.0`，Apache-2.0；新版本ComboBox/Popover/集合API需实际构建校验。https://react-aria.adobe.com/ComboBox

依赖列表写入此文件，不修改公共package/lock，不使用Mock代替所展示的目标SDK。MapLibre空白style不等于可用地理底图；未来公共瓦片服务要核对许可/署名及用户隐私。

### 下一轮待开发（A/B完整清单余项优先）

A09 Excalidraw、A10 tldraw、A13 Three.js、A14 React Three Fiber、A17 deck.gl；B05 Rive React Runtime、B09 shadcn/ui、B14 Pragmatic drag and drop、B21 react-motion历史迁移、B22 react-beautiful-dnd历史迁移。先处理依赖/许可/源码所有权，选择真实SDK或真实迁移示例；不能为了赶完成进度生成假Canvas或伪终端。PLATFORM有可执行环境后还需回归既有29条SDK/TS/浏览器。


---

## 第6轮（wave6）：Three.js / React Three Fiber / deck.gl / shadcn源码 / Pragmatic DnD / 历史迁移

**runCount=6 / 24**。从执行时最新集成HEAD `a9441528ea68d2daa56f2c0bbbc0e4fbe7cf5ae1` 新建分支 `feat/library-lab-ab-wave6`；本轮只修改 A/B 条目及该进度文件，不再向已合并的首轮分支提交。GitHub实际文件树确认先前29/39条有源码；本批新增 **7个独立条目 / 21个basic/business/advanced演示选择**，在PLATFORM审核合并后 **36/39**，剩余 A09/A10/B05 三条专项事项。

### 本批真实源码与主要能力

|条目|实际SDK包与版本（待PLATFORM真实安装/核验）|演示实现及专项边界|
|---|---|---|
|A13 Three.js|three@0.186.0；dev @types/three@0.186.0|Scene/Camera/Geometry/Material/WebGLRenderer，旋转与颜色，ResizeObserver，setAnimationLoop(null)、geometry/material/renderer dispose与可访问回退|
|A14 React Three Fiber|@react-three/fiber@9.8.2 + three@0.186.0|真实Canvas/useFrame、React19.3适配、业务状态切换、reduced-motion动态监听、frameloop demand、重新挂载|
|A17 deck.gl|@deck.gl/core@9.4.0 + @deck.gl/layers@9.4.0|Standalone Deck/ScatterplotLayer、原创GeoJSON式点集、无任何外部底图、过滤和1200点样例、GPU回退、resize/setProps/finalize|
|B09 shadcn/ui源码工作流|class-variance-authority@0.7.1 + @radix-ui/react-slot@1.5.0 + clsx@2.1.1 + tailwind-merge@3.7.0|本地原创Button组件源码、variant/size/Slot asChild，RSS批量操作、真实disabled及卸载计时器清理；明确不是“shadcn运行时包”，也不是官方CLI生成逐字快照|
|B14 Pragmatic drag and drop|@atlaskit/pragmatic-drag-and-drop@1.8.1|原生draggable/dropTargetForElements/monitorForElements，useId作用域，监听cleanup，频道排序、锁定、键盘按钮回退、撤销|
|B21 react-motion历史迁移|motion@14.6.0（已在公共package声明）|真实Motion/AnimatePresence/useReducedMotion，Spring与TransitionMotion迁移，稳定key，列表退出与撤销；不安装旧react-motion|
|B22 react-beautiful-dnd历史迁移|@hello-pangea/dnd@18.0.1|真实DragDropContext/Droppable/Draggable/placeholder，兼容React19的现代fork，锁定、撤销、上/下移动回退；不安装旧react-beautiful-dnd|

每库均新增或更新 `library.json`、实际 `examples/example.tsx`、适配 `examples/demo.tsx`、`guide.md`、`agent.md`、目录 `AGENTS.md` 和 `verification.json`；B09独立保存 `examples/ui/button.tsx`，该组件即运行及源码查看的同一文件。所有条目`contentState=recreated`，并记载历史附件曾恢复，但不会继承旧验证。

### 实际检查和验证事实

- GitHub完整staged tree `3c6165ea08e0d9490590190c29d55e0a05cb0cfa` 为非截断，可核对七个条目的文件。用connector逐库读取manifest blob并JSON解析：**7/7身份与目录一致、21/21三层演示注册entryPoint及sourceFiles存在，7/7包含完整guide、agent、AGENTS与verification文档**，另有B09额外button源码；这是静态结构检查，**没有运行TypeScript或第三方SDK**。
- 本轮未执行pnpm安装、真实SDK运行、完整TypeScript typecheck、Vite production build或Chromium E2E。全部新增库的`sdk/build/browser=NOT_RUN`；不能将官方文档检索、tree检查或React代码文本视为执行通过。
- WebGL/Worker/浏览器安全边界：A13/A14/A17都有可访问HTML反馈和资源清理；真实GPU释放、StrictMode、浏览器上下文上限需要PLATFORM有构建环境后在浏览器验证。deck.gl样本1200点不是性能成绩，不涉及地图瓦片许可。

### dependencyRequests → PLATFORM唯一Owner

仅平台集成负责编写`packages/library-lab/package.json`、pnpm-lock、CI；本轮**没有**修改这些文件。请核对SDK发行、React19/TypeScript7/Vite8 peer、许可证、构建及包体积，再通过真实pnpm解析生成锁文件（禁止手写integrity）：

- `three@0.186.0` + TypeScript dev `@types/three@0.186.0`（MIT）；官方 https://threejs.org/manual/pages/creating-a-scene.html ，https://www.npmjs.com/package/@types/three
- `@react-three/fiber@9.8.2`（MIT）与上述three版本和React19.3匹配； https://github.com/pmndrs/react-three-fiber/releases/tag/v9.8.2
- `@deck.gl/core@9.4.0` + `@deck.gl/layers@9.4.0`（MIT；严格同版本）；https://deck.gl/docs/get-started/using-standalone
- `class-variance-authority@0.7.1`（Apache-2.0）+ `@radix-ui/react-slot@1.5.0`（MIT）；既有clsx/tailwind-merge可复用。B09是源代码组件工作流而非新增shadcn runtime；https://ui.shadcn.com/docs/components/button
- `@atlaskit/pragmatic-drag-and-drop@1.8.1`（Apache-2.0；需核对peer/exports）；https://atlassian.design/components/pragmatic-drag-and-drop/core-package/adapters/element/
- `@hello-pangea/dnd@18.0.1`（Apache-2.0，React19）；https://github.com/hello-pangea/dnd
- `motion@14.6.0` 已被PLATFORM声明，无新增依赖；只作为旧react-motion的现代迁移目标。

### 剩余AB开发队列（3条）与许可风险

1. **A09 Excalidraw**：真实`@excalidraw/excalidraw`体积大，加载器、fonts/asset URL、CSP及离线/许可需先明确；不能自动请求外部字体资源或虚构画板，方案为独立按需runner并带本地字体资源。
2. **A10 tldraw**：官方生产构建有License Key约束，不能无有效许可发布公网Demo；要求PLATFORM评估dev-only或合法密钥/明确受限构建。不得提交密钥或绕过许可，不能以本地开发可用宣称生产可用。
3. **B05 Rive React Runtime**：需要可合法再分发的`.riv`运行资产，或用户显式导入本地`.riv`，不能为了凑数用假Canvas，按Worker/OffscreenCanvas/visibility处理。

如有可独立完成的源码与指南，下一轮继续推进这3条，遇商业许可约束继续其他可行工作并保持BLOCKED标识。仅PLATFORM可审核合入`feat/library-lab`。当前累计36/39是**代码/文档接入数**，SDK实测未由本轮新增。


---
## 第7轮（wave7）：A09 Excalidraw / A10 tldraw / B05 Rive

**runCount=7/24，状态：WAVE7_SOURCE_STAGED，待PLATFORM合入和运行时验证。**

本轮读取最新 `feat/library-lab@9340aa9d42cd0318a31eda8e5a1ee840dd2d5108`、公共COORDINATION/AGENTS/types/schema、已合入的AB PR #9/#13/#16/#23/#26及当时开放PR，确认AB前36/39已落地，尚缺A09/A10/B05；不复用已合并分支。从该精确SHA建立新的wave7独立分支，只变更AB条目与本进度文件。

### 新增实际源码（3条，共9项分层场景配置）

|ID|真实SDK import及能力|三层重点|资源/授权策略|
|---|---|---|---|
|A09|@excalidraw/excalidraw@0.18.1；Excalidraw、convertToExcalidrawElements、exportToBlob、loadFromBlob|真正嵌入可编辑画布；RSS工作流；限制文件大小/数量/链接的导入、PNG导出、只读和资源清理|原创流程形状；不嵌入未经核验字体素材；资产字体/CDN可能需要自托管|
|A10|tldraw@5.5.2；Tldraw、Editor、createShapeId、toRichText、getSnapshot|原生无限画布；RSS流程geo形状；上限80形状、readonly、文档快照|**tldraw为自定义许可，生产需合法licenseKey**；仅在本机开发环境或显式合法key时挂载，不伪造许可证，不绕过水印；不使用persistenceKey|
|B05|@rive-app/react-webgl2@4.37.0；useRive/stateMachine/RiveComponent|真实Rive播放；审核异步状态/可取消；后台与reduce-motion停播、视口退出释放组件|官方文档远程车辆.riv仅引用，不拷贝/再分发资产；WebGL2/WASM及CDN失败保留语义HTML|

每条：library.json/guide.md/agent.md/AGENTS.md/verification.json；`examples/example.tsx` 是唯一运行实现、`demo.tsx` 直接导出该实现，真实完整源码包含导入及实际API；额外本地样式 A09/A10/B05，B05含 asset.ts。三个库各注册basic/business/advanced，共9个选项但不是9个独立SDK bundle。原归档作为研究输入，均标`contentState=recreated`，不继承旧PASS。

### 证据分级（严格）

- 通过 GitHub create_tree 暂存并核对：3份JSON可解析且id/目录固定，9项demo所声明的sourceFiles均在本批确实提交的源码文件里；guide/agent/AGENTS/verification每项齐备。**这是本批静态结构检查**。
- **未运行** npm/pnpm install、真实SDK runtime、完整 tsc、Vite production build、Chromium E2E；相应verification.json中的SDK/build/browser全部NOT_RUN；Excalidraw资产/Rive素材需环境与授权实测，标明BLOCKED。不能把GitHub树检查、官方资料或历史研究的纯逻辑测试当成实际SDK PASS。
- 仍由PLATFORM单一owner处理 `packages/library-lab/package.json`、pnpm-lock、CI与公共runner，不因一项许可证问题阻断其他独立条目的源码审查。

### dependencyRequests（PLATFORM唯一Owner，版本待实际pnpm解析）

- `@excalidraw/excalidraw@0.18.1` — MIT SDK，CSS `@excalidraw/excalidraw/index.css`、`excalidrawAPI`、`exportToBlob`/ `loadFromBlob`/ `convertToExcalidrawElements`；官方 https://docs.excalidraw.com/docs/@excalidraw/excalidraw/installation 。需要验证React19、字体资源与CSP。
- `tldraw@5.5.2` — **自定义许可证，生产使用需合法 key**；官方 https://tldraw.dev/sdk-features/license-key ；确认实际依赖与React19 peer，保留合法水印。无可用授权时只进行本机开发和阅读原文，不部署私有站点。
- `@rive-app/react-webgl2@4.37.0` — React runtime MIT，WASM/WebGL2；官方 https://rive.app/docs/runtimes/react/react 。`.riv`样例https://cdn.rive.app/animations/vehicles.riv 是远程引用，不包含在仓库，需审查外部资源CSP与授权/离线策略。

### 后续协调

本PR经PLATFORM审核合入之后，**A/B 39/39库拥有独立源码、中文guide、agent.md、目录规则与3层真实示例定义，仍为0项本批运行时PASS**。AB不应在源码接入完成时宣称生产验收；随后优先与PLATFORM合作核实依赖、针对真实tsc/SDK/browser失败修复A09/A10/B05及既有复杂WebGL/绘图条目。独立生产授权、外网.riv与字体审查不可被Mock替代。

当前结果只保留在开发分支，最终对main的Draft PR #8未合并、未公开部署。


---

## 第7轮后续：A/B 完整条目质量加固（5 个库）

**执行基线**：\`feat/library-lab@dfbaf71f111bd9f938ff5c25c34577ddb792b34d\`。核对 PR #29 已于 2026-10-27T00:39:31Z 合并到集成分支，当前已无开放 AB PR。旧 \`feat/library-lab-ab\` 指向历史提交，**本批新建 \`feat/library-lab-ab-hardening\`，避免覆盖 39 项已合入成果**。AB 范围为 A17+B22 共39项，源码和文档现均已收录；实际 SDK/TS/浏览器完整通过仍无证据。

### 本批实际代码修正（全部限 AB 自有路径）

| 条目 | 修改目的 | 变更 |
|---|---|---|
| **A09 Excalidraw** | 异步场景覆盖与资源回收 | 用 \`operationId\` 使导入/导出结果在重置、重新载入流程、忽略结果和卸载后失效；加入 mounted/API 身份检查；延迟撤销 URL 的计时器纳入统一清理。明确“忽略结果不取消SDK内部异步运算”。 |
| **A10 tldraw** | 修正虚假配额语义/高频渲染 | 明确80形状上限只限制示例按钮自动创建，**不限制原生手绘工具**；Store 订阅只在形状数量变化时触发 React 状态更新，避免每次拖拽都无条件 setState；同步 guide/agent/manifest。 |
| **A17 deck.gl** | GPU 上下文泄漏及异步错误回写 | \`getContext('webgl2')\` 是真实 GPU 上下文分配；探测后使用 \`WEBGL_lose_context\` 释放探测上下文；\`Deck.finalize()\` 后阻止延迟错误更新状态；同步 agent。 |
| **B04 dotLottie** | 跨场景旧任务污染 | 切换 basic/business/advanced 场景时取消上一场景本地业务定时器，避免旧“订阅成功”回写新场景；同步 agent。 |
| **B05 Rive** | 卸载后迟到的 CDN/播放回调及误导状态 | 子播放器卸载后忽略迟到的加载错误，play/pause 用 try/catch；UI 明确区分“请求播放”和 SDK/远程资源实际成功播放，回调稳定性与迁移注意事项同步 guide/agent。 |

合计涉及5个库、11个源码/文档/元数据文件，另更新本进度文件。不新增包、不修改根 lock、CI、公共宿主或其他组。

### 验证证据与剩余问题

- 本批更改从 GitHub connector 读取**实际集成分支文件**并使用精确匹配补丁，路径均为 AB 授权目录；Git Tree 已创建，后续提交与 PR 中记录准确 SHA。
- tldraw 官方 API 已核对 \`Tldraw.onMount\` 可返回 cleanup、\`Editor.updateInstanceState({isReadonly})\` 与实例态语义；Excalidraw 官方确认 \`loadFromBlob(file,null,null)\` 返回 RestoredDataState；Rive 官方记录 Web React 单数 stateMachine 等版本迁移。
- 这只是源码及静态检查，**本轮没有实际完成 pnpm 安装、TS 全量检查、真实SDK运行、Vite生产构建或Chromium验证**。既有 verification.json 的SDK/build/browser保持NOT_RUN或原有BLOCKED，没有虚构 PASS。源码改动会由 PLATFORM 生成器更新指纹使旧证据失效。
- **dependencyRequests 新增为0**。需要 PLATFORM 继续解决真实 pnpm-lock、CI runner、A09/A10/B05正式浏览器与资源许可实测。对 AB 不可单独修复的公共依赖/CI 阻塞，移交平台，而非在本通道越权变更。

### 后续 AB 定向工作

优先获取 PLATFORM 类型/构建错误的文件级清单，按 AB 目录修复；有浏览器时重点验收 A09 异步导入-重置竞态、A10 原生/程序化形状上限、A17 WebGL context 反复进出、B04 切场景计时器、B05 远端.riv失败和卸载。源代码已经39/39，仅代码覆盖不能触发“生产验收已完成”的结论。若环境持续不可运行，记录真实阻塞，不重复要求用户逐项验收。

---

## 第8轮：B13/B14/B22 固定槽位跨越 bug 修复

**恢复事实**：AB 39/39条目源码+guide+agent已并入集成分支。PR #33在本轮准备时已被PLATFORM合并为 `f052e8b478d604ccefb6cf8f3569b80055c68f2a`，因此新建工作分支 `feat/library-lab-ab-pinned-order`，不重写历史 `feat/library-lab-ab` 或重开已合并 PR。

**实际实现**：B13 dnd-kit、B14 Pragmatic drag and drop、B22 Pangea DnD原先只检查起点/终点是否锁定，移动区间中间有固定频道时arrayMove/splice仍会移动固定频道。三个库现在均把包含起点/终点及中间项的闭区间作为不可跨越边界，拖放结束在数据提交处拒绝；相邻键盘按钮提前禁用不合法方向。示例依然真实调用对应SDK，未替换为Mock。

各库新增 `examples/pinned-order.ts` 和 `tests/pinned-order.test.mjs`，更新3层sourceFiles、guide、agent。本轮只改B13/B14/B22和本进度文件，未动公共依赖/锁文件/CI，dependencyRequests新增0。

**验证事实**：Node v22.16.0使用 `node --experimental-strip-types --test` 对相同固定槽位规则的三份本地TS源与测试共执行 **24 PASS、0 FAIL、0 SKIP**（locked/fixed、双向跨越、合法同侧移动、非法索引）。这只证明该领域规则的本地单测，不代表实际SDK/类型/构建/浏览器已通过。本轮没有获取官方SDK/Chromium执行证据，保留 NOT_RUN/BLOCKED。GitHub文件和差异范围还需在提交后核对。

runCount=8/24，待PLATFORM审核合入到feat/library-lab；主要剩余真实依赖/锁文件、tsc/Vite build、浏览器实测及复杂库资源许可检查。

---

## 第8轮（wave8）：Five-library runtime-safety hardening

**runCount=8/24；集成基线** `feat/library-lab@101315e3bdf299047f9c2a39aa670ed59570ec4a`。AB 39/39 条目已具源码及配套文档，不等于真实 SDK 验收。检查到开放的 AB **Draft PR #36**（B13/B14/B22 的 pinned-order 越界修复）；本批使用独立分支 `feat/library-lab-ab-hardening-wave8`，没有覆盖旧 `feat/library-lab-ab` 和 #36 文件，目标仍为 `feat/library-lab`。

**本轮实际代码：Draft PR #37 / 最新提交 `a44ba132940557c9d3d0f079544461ac498593d0`。** 5 库，30 个 AB 条目范围文件，15 个场景清单同步新增纯 helper 的 `sourceFiles`（运行代码与展示源码保持一致）：

| 条目 | 已修复的问题 | 独立测试 |
|---|---|---|
| A13 Three.js | 以播放/可见性/系统减少动态/显式覆盖共同裁决GPU动画循环；暂停时保留静态帧，卸载监听；播放变化不重复创建几何体 | `tests/animation-policy.test.mts`，7 tests |
| A15 Leaflet | 连续新增时预先固定 ID/经纬度，防止React updater延迟读取可变ref；局部示例最多40条 | `tests/station-factory.test.mts`，2 tests |
| A16 MapLibre GL JS | 同上修复连续点击导致GeoJSON id/坐标错位；恢复初始数据时重置序号；限制示例容量，不代表SDK上限 | `tests/station-factory.test.mts`，2 tests |
| B17 Floating UI | 中文IME候选确认Enter及compositionend紧邻keydown时不误提交；同步ref、native isComposing、229及回车keyup防重复 | `tests/ime-guard.test.mts`，4 tests |
| B20 Sonner | 快速重复运行旧timeout回写；代次标记只允许最新结果、清理旧loading和计时器，仅关闭本Demo的toast | `tests/latest-run.test.mts`，3 tests |

**实测证据（严格限定范围）**：在 Node 22.16.0 环境，将当前 PR #37 的 5 个 `.ts` helper 与 5 个 `.test.mts` 测试镜像到独立目录（逐项对照10个Git blob SHA，字节一致），执行：
```sh
node --experimental-strip-types --test entries/*/tests/*.test.mts
# 18 PASS / 0 FAIL / 0 SKIP
tsc --noEmit --skipLibCheck --target ES2022 --module ESNext --moduleResolution Bundler entries/*/examples/*.ts
# PASS，TypeScript 5.8.3，仅对5个纯helper
```
GitHub compare: 5次提交，30个变更文件全部位于 `packages/library-lab/entries/A*` / `B*`。上述 Node/TS 检查**不代表**React全项目类型检查或第三方SDK真实运行。**target SDK import、完整TS7 typecheck、Vite构建、Chromium（含真实中文输入法与WebGL）均 NOT_RUN/BLOCKED**；本批未改变任何 `verification.json` 的SDK/build/browser状态，不继承历史PASS。

**dependencyRequests**：本批只复用已声明的 `three/leaflet/maplibre-gl/@floating-ui/react/sonner`，不新增包版本请求。根package、pnpm-lock、公共CI由PLATFORM负责；本轮未修改这些文件。GitHub npm下载/runner环境问题不能通过纯逻辑测试替代。

**后续可执行工作**：PLATFORM优先独立审核合入 #36 和 #37，需保留双方对本进度文件的追加记录；有真实安装环境后针对 A13 frame/visibility/GPU释放、A15/A16 连续新增定位及地图卸载、B17 fcitx/Rime 回车、B20 通知重复运行与卸载进行浏览器集成回归。无浏览器环境则继续其他已确认的A/B源码缺陷，不循环重试相同DNS阻塞。主PR #8仍为Draft，禁止合并main/公开部署。


---

## 第9轮：React Flow DAG、cmdk 中文 IME、ECharts 后台暂停与减动策略

**runCount=9/24；执行基线** feat/library-lab@0733f237ddfbc4ab3204c531255f386c46abec27。确认 AB #36/#37 已由 PLATFORM 合并、没有其他开放AB PR；没有回写过期的 feat/library-lab-ab。新独立工作分支 feat/library-lab-ab-wave9，本轮仅修改 A01/A06/B18 条目及本文件，主Draft #8仍待集成。

### 本轮真实改动

|条目|实际代码改动|源文件与文档一致性|
|---|---|---|
|A06 React Flow|修复 example.tsx 缺少 useState import 的明显编译缺陷；业务图连接判定增加端点存在性、同向重复、自环和完整多跳环路校验；isValidConnection 提前阻止非法交互，onConnect 写入时再检查；onNodesChange 删除节点时清理所有关联边|新增 examples/graph-rules.ts 与 tests/graph-rules.test.mts；3层 sourceFiles 清单、guide、agent 同步|
|B18 cmdk|修复 compositionend 后尾随 Enter 可能错误执行命令；用 keyup 清除一次提交保护；Ctrl/Cmd+K 在关闭状态不抢外部输入框，已打开状态可在命令输入框内再次关闭；IME/229 和 Shift/Alt 排除|新增 examples/keyboard-policy.ts 与 tests/keyboard-policy.test.mts；3层 sourceFiles 清单、guide、agent 同步|
|A01 ECharts|实时刷新计时器不再随着 updates 每tick重建；隐藏页面或开启系统减少动态时停止计时，支持显式覆盖减少动态、恢复可见后有条件续播；动画更新尊重系统偏好；双系列业务图增加“上周”数据表行|新增 examples/stream-policy.ts 与 tests/stream-policy.test.mts；3层 sourceFiles 清单、guide、agent 同步|

保持真实第三方SDK import与原组件，未用Canvas假图/SDK mock替换。每库仍共用实际example.tsx作为basic/business/advanced的实现，合计9项演示选择，并不虚称新增9个独立bundle。

### 精确可复现的实际检查

离线使用本轮准备的**同字节**纯领域逻辑源与单测：

- Node 22.16.0: \`node --experimental-strip-types --test A01/tests/*.test.mts A06/tests/*.test.mts B18/tests/*.test.mts\` → **19 PASS / 0 FAIL / 0 SKIP**。
- TypeScript 5.8.3: \`tsc --noEmit --strict --skipLibCheck --target ES2022 --module ESNext --moduleResolution Bundler A01/examples/stream-policy.ts A06/examples/graph-rules.ts B18/examples/keyboard-policy.ts\` → **PASS（仅3个纯helper）**。
- GitHub 生成tree的六个新增源码及测试Blob SHA与本轮离线逐文件\`git hash-object\`完全一致（A01 c526ec4/7d601e7、A06 f6bb064/74a059d、B18 2659725/042df5c），保证本地运行对象与提交对象一致。
- 完整集成分支目录树未截断、三组真实helper及测试文件均存在。以上不替代真实第三方SDK导入运行、React19完整TS7构建、Vite生产build、Chromium中文输入法/Canvas及后台可见性测试。**sdk/build/browser仍保持NOT_RUN/BLOCKED，verification.json未写虚假PASS**。

**dependencyRequests 新增=0**，继续由PLATFORM维护package/lock/CI、获取真实Runner环境；本通道未触及其他分组。SDK/浏览器恢复后优先针对A06拖拽连接/删除节点；B18 fcitx5/Rime尾随Enter与聚焦关闭；A01标签页隐藏/减少动态/双系列表格进行定向E2E及真实资源回收检查。其余A/B复杂WebGL/白板建议基于真实执行报错而不是无证据大改。


---

## 第10轮（wave10）：uPlot / G6 / Ant Design / Embla 的状态与生命周期加固

**runCount=10/24**。本轮以集成分支 `feat/library-lab@363009eb24230fee8c4e5103bcef950ed129a649` 为固定起点，已核对根AGENTS、应用协议、39条A/B已落地、当时开放PR仅主Draft #8和无关#3，因此新建独立 `feat/library-lab-ab-wave10`，未重写旧分支。工作已实际提交：第一批 `75e9a415f546e5c67392f7d6b49c15ee1836a3b5`，第二批 `cb422a7ea81e39071d8e6f6a6a214d7cf7de6404`，交付 [Draft PR #44](https://github.com/CoderLambert/ReactLoom/pull/44)，base只能为 `feat/library-lab`。PLATFORM尚未合并，主PR #8仍Draft。

|条目|实际修正|可独立测试的纯规则|
|---|---|---|
|A04 uPlot|流式数据 `setData(data,false)` 改为自动重算轴范围，防止窗口移动后新数据位于旧X轴外；后台与减少动态偏好暂停650ms计时，显式覆盖不绕过隐藏；事件与interval释放|stream-policy.ts：请求/可见性/系统偏好/覆盖组合|
|A07 AntV G6|360px硬下限导致窄屏图Canvas溢出，改为真实宿主宽；ResizeObserver 更新合并到可取消requestAnimationFrame；异步render仍保留disposed及destroy防线，文本拓扑等价物继续可见|graph-sizing.ts：非法/零宽跳过、窄宽遵从宿主、4096px安全上界|
|B06 Ant Design|原 `setHistory(rows)` 与 `setRows` 双状态会保存旧闭包快照，改为单一React函数式 `FeedHistory`，追加/切换/一步撤销原子生效；重复ID/URL无副作用|feed-history.ts：重复与连续操作、单层撤销、no-op|
|B19 Embla Carousel|重置时 `setSlides` 后立即对旧DOM `scrollTo(0)`，改为DOM提交后 `reInit` 再执行仅一次跳转；按稳定ID签名重算、单调分配ID（示例上限24）、过期snap索引归界、初始化前按钮禁用|slide-policy.ts：ID分配、snap边界与异常输入|

本批四库原有 `library.json` 的basic/business/advanced均加入新helper至sourceFiles；指南/Agent说明更新，原 `examples/example.tsx` 仍直接调用真实目标SDK，未替换为Mock。新增**四个独立纯函数helper + 四个针对性 Node test**。没有修改公共package/lock/CI、主分支或其他通道，**dependencyRequests新增0**。

### 实际验证（限定声明）

在 Node **22.16.0**，对与PR八个新测试/源码Git Blob SHA逐项一致的字节文件执行：
`node --experimental-strip-types --test /mnt/data/ab-wave10/{A04,A07,B06,B19}/tests/*.test.mts` → **16 PASS / 0 FAIL / 0 SKIP**。
在 TypeScript **5.8.3** 执行 `tsc --noEmit --strict --skipLibCheck --target ES2022 --module ESNext --moduleResolution Bundler /mnt/data/ab-wave10/{A04,A07,B06,B19}/examples/*.ts` → **PASS（仅四个纯helper）**。
GitHub `compare_commits` 证实前两提交变更24文件，**24/24只在AB entries/A*、entries/B***；八份helper/test blob SHA与 `git hash-object` 完全一致。以上只验证确定性领域规则与范围，**不代表官方SDK实际import、React19完整tsc7、Vite生产构建、Chromium桌面/移动端/触控/GPU已通过**。SDK/build/browser状态保留原 `NOT_RUN/BLOCKED`，没有填写虚构PASS。还需PLATFORM拥有真实npm安装、锁文件、Runner后补集成实测。

### 后续队列与当前限制

1. **PLATFORM**审核合入#44，并根据实际运行日志针对A04移动窗口坐标、A07 graph.render与resize/unmount、B06连续编辑/撤销、B19删除/重置/循环触控验证；公共CI与pnpm-lock由PLATFORM处理。
2. **AB**在本分支或平台新报告上继续针对确定的源码缺陷做定向修复，不再重复建设39项已存在目录；必要时审阅大型Canvas/白板许可及异步生命周期，而非改写已通过文档。
3. 当前 **39/39为源码+手册覆盖**，真实SDK/React构建/浏览器全部未取得可核对的PASS证据，LL08/LL10不应宣布验收完成。无实际日志时不反复重试同一下载/无Runner错误。

---

## 第11轮（wave11）：MUI / Mantine 状态原子性、D3 绘制选择、Konva 窄屏与容量

**runCount=11/24；集成基线及提交父节点 feat/library-lab@e9cc2100e1fc4dfeb6a929534c60aab87c700326。** 核对当时开放PR仅主Draft #8和无关 #3，AB #44已合并，独立开发分支 feat/library-lab-ab-wave11。**本轮代码提交 b826708838d73b212db0580a6e8dc992468f781a**；仅改A05/A11/B07/B08共24个条目内文件。本进度单独提交，不覆盖先前历史。

| 条目 | 直接源码改动 | 纯规则测试 |
| --- | --- | --- |
| B07 MUI | 将旧闭包setBefore(rows)和独立setRows替换为函数式FeedHistory；无变化不覆盖撤销点；新增ID单调增长防撤销后碰撞 | feed-history.test.mts，4例 |
| B08 Mantine | rows和before同一原子更新；连续Switch/Quota只撤销最新一步；NumberInput字符串/非法值不提交，Modal选中项只存业务ID | feed-history.test.mts，3例 |
| A05 D3 | 轴和可见选择使用同一筛选数据集；空集明确告知；非法ResizeObserver尺寸不再回填虚构620px，窄屏减少刻度但保留数据表 | chart-policy.test.mts，3例 |
| A11 Konva | Stage宽度不再强制至少320px；新增卡片限制24个、拒绝重复ID；ID生成移出React状态updater避免StrictMode二次调用副作用 | stage-policy.test.mts，2例 |

所有条目仍使用真实SDK源码，新增helper列入三层sourceFiles，guide/agent同步，verification.json不虚报PASS。39/39仅表示原有源码与文档覆盖。

### 实际命令与证据

- Node 22.16.0：node --experimental-strip-types --test /mnt/data/ab-wave11/{A05,A11,B07,B08}/tests/*.test.mts → **12 PASS / 0 FAIL / 0 SKIP**。首次红测发现Array.slice(-0)回退全部数据，修复后重测全绿。
- TypeScript 5.8.3：tsc --noEmit --strict --skipLibCheck --target ES2022 --module ESNext --moduleResolution Bundler /mnt/data/ab-wave11/{A05,A11,B07,B08}/examples/*.ts → **PASS，仅4个纯逻辑helper**。
- GitHub新建8个源码/测试Git blob；与本地git hash-object逐一相同：A05 2422420d/a412ba75，A11 b68e2a65/0d7a6842，B07 d1125384/d2e9b045，B08 2a29a36b/6843fb16。其余React TSX及SDK需真实环境验证。
- **真实第三方SDK、React19完整类型检查、Vite生产build、Chromium焦点/IME/Canvas/触控：NOT_RUN/BLOCKED**。纯规则测试不等于官方SDK验收；不继承历史PASS。

### dependencyRequests / 后续队列

- 本轮新增dependencyRequests为0，复用已记录的d3、konva、MUI和Mantine。公共依赖、锁文件、CI、索引和真实runner归PLATFORM。
- PLATFORM审核合入并在具备真实运行环境后验收B07/B08连续编辑和撤销、Dialog/Modal焦点与数字中间态、A05窄屏和筛选、A11 Canvas拖拽/Transformer/卸载。
- AB后续优先按真实TS/SDK错误修复；无runner时可独立检查A03 Chart.js、A12 react-konva、B03 react-spring。禁止重复造条目和循环DNS重试。
- 主PR #8仍Draft；未改main、PR #3、模板、公共脚本、package/lock、CI、其他组或公开部署。


### GitHub CI观察补记（与源码运行验收分开）

Draft PR #47（https://github.com/CoderLambert/ReactLoom/pull/47）实际触发工作流：Library Lab run 40454825977、CI run 40454825702，均报告 conclusion=failure；Library Lab 的 runtime-bootstrap job 122025599429 与 catalogue job 122025599671 均报 failure，但Connector获取两者日志均得到GitHub BlobNotFound 404，job steps为空。**因此无可用runner执行日志，不能归因为本PR源码问题，也不能将其计为真实SDK/构建验证**。PLATFORM应核对 Actions runner/日志可用性后再诊断，禁止以纯逻辑12 PASS覆盖此项失败。

---

## 第12轮（wave12）：react-konva / GSAP / react-spring / shadcn/ui 运行前质量加固

**runCount=12/24。** 在执行前已读取最新集成分支 `feat/library-lab@0b98b4ef4accd16ab3d7278d8181568c77dc6476` 的 COORDINATION/IMPLEMENTATION/AGENTS/types/catalog、本进度与开放PR。实际开放PR仅集成主Draft #8和无关PR #3；此前AB #47已集成、未重复提交旧内容。旧 `feat/library-lab-ab` 指向历史状态，因此从上述精确集成SHA新建 `feat/library-lab-ab-wave12`，所有更新均以非force且检查原head的方式推送。

### 已提交真实SDK示例修复（四个库，12种分层选择继续共用实际源码）

| 条目 | 修正 | 可测试规则 |
|---|---|---|
| A12 react-konva | 去除容器minWidth:320/Stage至少320px造成的窄屏溢出；按真实clientWidth测量；dragMove/dragEnd和DOM按钮在Konva局部世界坐标限制边界；新增节点上限24/坐标布局 | `examples/stage-policy.ts` |
| B02 GSAP | 初次render读取减少动态偏好；visibilitychange后台自动暂停、恢复前台仅续播未被用户手动暂停的timeline；进度范围钳制 | `examples/timeline-policy.ts` |
| B03 react-spring | 初次render读取减少动态偏好；列表限定12条、业务ID去重；仅删除按钮实际占焦点时恢复到新增入口，避免抢走其他焦点 | `examples/article-policy.ts` |
| B09 shadcn/ui | 归档提取尚未归档的ID固定快照，busy期间禁用复选框；reset、切换level与卸载取消定时器并使旧epoch失效，禁止迟到回写 | `examples/archive-policy.ts` |

提交 `46df29becc8f70c7f0c70f55b05bcf2e40d3a3bd`、`9fd9de2bf4767e3031e222c341be3c3fc72248e3`。两批各12个文件，合计24个条目内部变更（4×示例tsx、纯helper、单测、library.json三层sourceFiles、guide.md、agent.md），并另改本进度文档。**仅AB授权范围**，不修改根package、pnpm-lock、CI、公共索引或其他通道；新增dependencyRequests=0。

### 执行证据（仅准确范围）

- Node `22.16.0`：`node --experimental-strip-types --test /mnt/data/ab-wave12/{A12,B02,B03,B09}/tests/*.test.mts`：**16 PASS、0 FAIL、0 SKIP**。
- TypeScript `5.8.3`：`tsc --noEmit --strict --skipLibCheck --target ES2022 --module ESNext --moduleResolution Bundler /mnt/data/ab-wave12/{A12,B02,B03,B09}/examples/*.ts`：**PASS，仅4份无第三方依赖的纯规则helper**。
- GitHub逐文件回读八份helper/测试blob，**8/8 SHA与上面Node/tsc执行的本地git hash-object相同**：A12 b3eab066/2080ce50、B02 912f742c/252cbedc、B03 d4cd0aa4/13a49ec8、B09 1fcfd5af/8df1bebb。Git tree分两批继承精确父树，未覆盖旧分支。
- **真实目标SDK导入、React完整类型检查、Vite生产build、Chromium浏览器/Canvas/键盘焦点/动画生命周期依然NOT_RUN/BLOCKED**（无可用的真实依赖/lockfile/runner证据），`verification.json`没有提升到PASS。不将政策单测计入SDK测试选择器。

### PLATFORM与后续队列

PLATFORM应审核此批PR并仅合入 `feat/library-lab`；真实运行环境准备好后验证 A12 缩放拖拽局部坐标、B02 后台/返回前台/用户暂停及StrictMode、B03 减动与删除焦点、B09 隔离异步回写和Slot/Button交互。当前四库纯逻辑规则可复现，不足以宣布应用可运行。

AB下一队列：检查 A03 Chart.js canvas实例重建与高频数据、A14 React Three Fiber的WebGL生命周期、B01 Motion的切场景动画与焦点；优先处理确证缺陷或来自PLATFORM的真实TS/SDK构建日志。不反复执行无Runner的同一CI错误，不将39/39内容覆盖误写成 SDK验收完成。没有新增依赖请求、公开部署或合并main。

### 第12轮补充：满额列表焦点缺陷闭环

静态审查发现：B03列表到达12条后新增按钮被禁用，若仍将移除按钮的焦点转到它会失败。追加`focusDestinationAfterRemoval`三态策略和可用的resetRef；满额删除有焦点行时转至恢复按钮，其余不抢焦点。更新helper、测试、guide、agent及实际组件；Node全批**16 PASS/0 FAIL**、独立TS helper检查PASS（并非SDK/浏览器）。helper/test本地Git blob `7ab0c8e3`/`a0549712`，回读后核对。

### 实际PR与CI观察（第12轮收口）

- **Draft PR #50**：https://github.com/CoderLambert/ReactLoom/pull/50 ，目标严格 `feat/library-lab`。A/B目录24份变更文件+本进度1份，GitHub compare **25/25 AB范围内**、0跨组/公共文件；新修复提交 `5d98255d673920a848408dc7c42bb4a05756b2b4`，上一批实现 `46df29becc8f70c7f0c70f55b05bcf2e40d3a3bd`、`9fd9de2bf4767e3031e222c341be3c3fc72248e3`。
- GitHub Actions于PR head实际返回 `CI #40460744796` 与 `Library Lab #40460744838` 均为 **failure**；后者catalogue/runtime-bootstrap、前者所有job均 `steps=[]`，没有可信的SDK安装/TS/Vite/browser执行日志。**不能将本轮CI失败归因到条目代码，也不能冒充构建运行通过**。此类runner分配前失败不循环重试，交PLATFORM排障。
- B03满额焦点helper/test经GitHub回读 SHA与本地严格测试文件一致：`7ab0c8e30a7865d8cb6f142155565a9909293bf4` / `a05497128eca5062aeb3b2c7280bcbbfcba23124`。


---

## 第13轮（wave13）：Chart.js / React Three Fiber / Motion / react-grid-layout 真正源码加固

**runCount=13/24；源码与指南覆盖39/39（不等于实际SDK验收）。** 本轮只读恢复 `feat/library-lab@66479e8a2d3e27d65c3c581093822cb4baf6c00d` 的 COORDINATION/IMPLEMENTATION、根/包 AGENTS、types/catalog、已有AB进度以及开放PR：先前AB #50已由PLATFORM合并；当时开放PR仅主Draft #8及无关 #3，没有开放AB PR。没有回写旧 `feat/library-lab-ab`；从精确集成head创建 `feat/library-lab-ab-wave13`，无force推送。

### 已提交代码（4库 / 12个原有basic-business-advanced选项）

| 条目 | 实际缺陷与修复 | 可迁移源码/测试 |
|---|---|---|
| A03 Chart.js | 旧代码在创建 Chart 时从 `makeCounts(0)` 重新起步；高频更新不具生命周期策略。现在构造时消费当前revision、有界0–10000值；advanced提供每400ms实际更新、只在前台有效且切换层级停采样；共用Canvas/数据表的七日数据，Chart实例只在类型切换时destroy/recreate | `examples/chart-stream-policy.ts` / `tests/chart-stream-policy.test.mts` |
| A14 React Three Fiber | 旧代码仅处理手动暂停与reduce-motion，标签页隐藏时仍保持always帧循环；速度为0也空转；basic层缺同等键盘按钮。新增document visibility监听+卸载清理，统一frame-policy控制demand/always与有效delta，basic提供真实HTML操作入口 | `examples/frame-policy.ts` / `tests/frame-policy.test.mts` |
| B01 Motion for React | `queueMicrotask` 在React DOM提交前可能强行抢焦点；无限新增列表；状态逻辑与动画耦合。新增12项容量/稳定ID/删除重排规则，只有被删除按钮实际占焦点时在 `useLayoutEffect` 提交后恢复；控制列表时继续实际使用AnimatePresence和motion组件 | `examples/card-policy.ts` / `tests/card-policy.test.mts` |
| B15 react-grid-layout | 旧实现将手机6列投影写回同一个桌面12列状态，切回宽屏不可逆丢坐标，260px minWidth产生窄屏溢出；键盘在6列满宽时左右移无效。现保存wide/narrow独立布局，按断点重新挂载真实GridLayout，锁定卡片的几何不会被回调覆盖；12列左右/6列上下键盘移动、宽度边界及禁用态由纯规则控制，去掉minWidth硬下限 | `examples/layout-policy.ts` / `tests/layout-policy.test.mts` |

四项仍直接import真实目标SDK，均更新运行的example.tsx、3层library.json sourceFiles、guide.md、agent.md；AGENTS/verification.json原值保留。总共24个变更文件：4份实际组件+4份纯helper+4份定向test+4份library.json+4份guide+4份agent，**全部属于AB条目目录**。code commit `e5d272ee55ae1a243aa26aefa8f1d2a237685679`；GitHub compare相对上述集成head确认 `24/24` AB授权路径，`0` 个公共/跨组文件。本进度文件由独立后续提交追加，避免无法在同一个提交中自引用准确SHA。

### 本轮真实执行（证据严格限定范围）

```bash
node --experimental-strip-types --test /mnt/data/ab-wave13/{A03,A14,B01,B15}/tests/*.test.mts
# Node 22.16.0: 16 PASS / 0 FAIL / 0 SKIP
tsc --noEmit --strict --skipLibCheck --target ES2022 --module ESNext --moduleResolution Bundler /mnt/data/ab-wave13/{A03,A14,B01,B15}/examples/*.ts
# TypeScript 5.8.3: PASS，仅4个不依赖SDK/React的纯规则helper
```

八份helper/测试文件均通过GitHub create_blob返回的Git SHA与本轮实际执行同一字节本地`git hash-object`对照 **8/8匹配**。GitHub提交后回读4份library.json，所有 `12/12` 层级选择的entryPoint与新sourceFiles清单一致。**这只证明规则和静态契约**，不等于4项真实SDK、React TypeScript 7、Vite生产构建或Chromium交互成功。

**真实第三方SDK运行、完整React类型检查、生产Vite构建、浏览器/输入法/Canvas/WebGL/drag E2E：NOT_RUN/BLOCKED。** 当前工具容器没有这个私有monorepo实际pnpm依赖与匹配锁文件；既有GitHub CI runner/log不可用。没有运行安装或反复重试已知DNS问题，没把policy测试混入SDK PASS。四项verification.json SDK/build/browser保持既有NOT_RUN，等PLATFORM给出真实运行指纹/命令/可读日志后再升级。

### 依赖及下一队列

dependencyRequests新增 **0**。上述四库既有声明依赖分别是 `chart.js@4.6.1`、`@react-three/fiber@9.8.2`+`three@0.186.0`、`motion@14.6.0`、`react-grid-layout@2.3.0`+`react-resizable@4.0.2`，均已由公共package登记；PLATFORM负责真实pnpm lock、运行器、依赖peer和CI。

下一批优先按真实SDK/tsc/浏览器错误定位AB目录后修复；独立代码队列为A08 Mermaid的频繁重绘/worker资源、A17 deck.gl生命周期、B04 dotLottie异步资源与B16 react-resizable-panels的键盘约束。PLATFORM只负责审核合入本PR至 `feat/library-lab`，不擅自合main、改PR #3、模板、CI、公共索引或公开部署。需要重点浏览器回归本批：Chart初始化/后台恢复、R3F隐藏/重挂载GPU、Motion聚焦删除、Grid宽窄切换后的双布局与指针拖拽。


---

## 第14轮（wave14）：Mermaid队列、deck.gl尺寸与选择、dotLottie播放策略、可缩放面板多实例

**runCount=14/24；执行基线**：`feat/library-lab@9a5778a97970119a4d811e139d81038f66042ec2`，已确认AB wave13 PR #53合并，开放PR只有主Draft #8、无AB通道待提交PR。新分支 `feat/library-lab-ab-wave14` 从此集成head创建，不覆盖旧 `feat/library-lab-ab`。本轮源码提交 `bdd17a7fdf7565abb19f439f6d638eed013ccfb1`；当前进度/文档提交由本PR的最新head承担。目标base严格 `feat/library-lab`，集成者须检查当前HEAD/文件范围后再合并。

|条目|真实源码改动|验证范围|
|---|---|---|
|A08 Mermaid|全局异步parse/render串行排队；切换/卸载跳过过时排队任务并拦截迟到结果；不变更可信DSL或sandbox|render-queue.ts + tests，4例定向|
|A17 deck.gl|隐藏/0尺寸不更新GPU，有限幅且去重的容器resize；稳定ID拾取，过滤后不显示过时结果；保留Deck.finalize|deck-size.ts + tests，4例定向|
|B04 dotLottie|统一真实播放门禁（加载、页面可见、减少动态/显式覆盖），错误后清除播放请求，状态展示实际播放条件|playback-policy.ts + tests，3例定向|
|B16 react-resizable-panels|移除270px硬最小宽度；所有Group/Panel/Separator ID实例隔离；只有分割条拦截触摸滚动手势；保持v4 SDK|静态修改和文档，交互仍待实际浏览器|

A08/A17/B04 的每层 `library.json` 已加入新helper至 `sourceFiles`，运行源和展示源引用同一份代码（3×3=9个分层声明），B16 原有3层入口不变。四条均补充guide/agent；B16历史缺指纹的content PASS改为NOT_RUN，其他 `verification.json` 的SDK/build/browser均保持NOT_RUN。没有新增SDK依赖、Mock目标SDK、支付/公开部署或主分支变更。

### 实际命令与证据（仅独立策略）

本轮 Node `v22.16.0` 执行：
`node --experimental-strip-types --test /mnt/data/ab-wave14/{A08,A17,B04}/tests/*.test.mts` → **11 PASS / 0 FAIL / 0 SKIP**。
`tsc --noEmit --strict --skipLibCheck --target ES2022 --module ESNext --moduleResolution Bundler /mnt/data/ab-wave14/{A08,A17,B04}/examples/*.ts` → **PASS**（TypeScript 5.8.3，仅三份纯helper）。

6份helper/test分别经本地 `git hash-object` 和GitHub写入后的Blob SHA核对：A08 `6a6de34e/597af3bf`、A17 `9b59f660/1bd83350`、B04 `cc204164/e8eb64ff`，**6/6匹配**。该证据只证明测试对象精确对应已提交文件和纯规则行为；并不说明目标SDK真实import、完整React+TS7、Vite构建或Chromium/GPU/WASM/ARIA/触摸交互成功。这些仍 **NOT_RUN/BLOCKED**，禁止冒充SDK PASS。

**dependencyRequests**：本轮新增0。现有SDK版本和锁文件归PLATFORM统一维护；尚缺真实依赖安装、GitHub可用runner及运行日志，此前相同DNS/runner故障不循环重试。下个AB开发队列优先A02 Recharts、B10 Base UI、B11 Radix Primitives、B12 React Aria 的真实资源与焦点缺陷；PLATFORM合入后需对本轮4库做真实SDK/浏览器定向回归（多Mermaid异步、deck过滤/resize、Lottie后台与减动、多Group键盘触摸）。

### 第14轮 PR / CI 最终回读

- Draft PR [#56](https://github.com/CoderLambert/ReactLoom/pull/56) 已建立，base=`feat/library-lab`，head=`feat/library-lab-ab-wave14`，未合并 main。
- GitHub 比较本轮基线后确认 **23/23 文件属于 A*/B* 或 progress/AB.md**，无跨组写入。完整集成树未截断，A08/A17/B04/B16 每条3个 demo 都指向已存在源码路径（12/12 无缺失），A08/A17/B04 共9/9清单包含新helper。
- GitHub Actions 本次两组 workflow runs `40472384355`、`40472384309` 均为 **failure**；对应 job 的 `steps=[]`，尝试读取 runtime-bootstrap 日志返回 404 `BlobNotFound`。不具备执行步骤和构建日志，无法归因于 SDK/源码编译失败，更不能标记构建 PASS。PLATFORM 的 runner/lockfile/真实SDK验收仍为待办。
- 本轮只在可执行的纯策略 helper/test 上得到 11 PASS 与局部严格 TS PASS；浏览器/真实SDK/完整生产构建仍未通过验收。用户侧只在完整批次记录进展，通知集中在 Issue #5。



---

## 第15轮（wave15）：Recharts / Base UI / Radix / React Aria 状态与业务交互闭环

**runCount=15/24；执行精确基线** `feat/library-lab@b3fa3b0370f50c39078562987400d753390671ee`。先读取集成分支 COORDINATION、IMPLEMENTATION、根及包 AGENTS、types/catalog、本进度与开放 PR。AB #56 已由 PLATFORM 合并，没有开放 AB PR；从最新集成 head 新建 `feat/library-lab-ab-wave15`，每次 Git ref 以预期原 head 执行非 force 快进。本批真实源码提交 `5326b2731bd6a411aa401f672169484fcd9559ed`，交互/UI 与指南加固提交 `c03858b3518178a5012167718a1528bb8bae4471`。

| 条目 | 源码改动 / 用户可见行为 | 独立策略与测试 |
| --- | --- | --- |
| A02 Recharts | 抽离图表窗口/稳定标签/收藏率数据边界；高级范围编辑允许输入中间态、失焦规范化，刷新达到上限会禁用，ResponsiveContainer resize debounce=60ms；真实 Recharts 柱/组合图与数据表同一数据源 | `examples/chart-policy.ts` + `tests/chart-policy.test.mts`，4例 |
| B10 Base UI | 全选与混合态改为仅按未锁定的可选权限计算：锁住 manage 后 read/comment 全选可明确进入 checked 并可再次取消；底层更新拒绝被锁权限，FormData 仍由真实 Checkbox/隐藏输入提交 | `examples/permission-policy.ts` + `tests/permission-policy.test.mts`，6例 |
| B11 Radix Primitives | 原菜单的筛选/排序/置顶/重命名/删除此前只显示状态文字；现在实际驱动三条本地频道列表，按未读/收藏筛选、按时间/热度排序，锁定删除会在业务规则层拦截，并维护筛选后选中项；仍由 Radix Portal/Menu/Checkbox/Radio/Submenu 处理交互 | `examples/feed-policy.ts` + `tests/feed-policy.test.mts`，4例 |
| B12 React Aria | ComboBox 受控 ID 与输入文本同步；按频道名/分类统一过滤，避免二次 SDK 文本筛选；异步过期候选不再显示，编辑后旧ID失效，提交前再次校验合法 ID、label、真实 FormData；本地组合输入未结束时不提交 | `examples/channel-policy.ts` + `tests/channel-policy.test.mts`，4例 |

四项 guide.md、agent.md 同步说明生产语义和真实验证边界，library.json 的 basic/business/advanced `sourceFiles` 引用新helper；AGENTS.md/verification.json没有伪改PASS。真实SDK import 原样保留，业务本地fixture不是目标SDK Mock，也没有远程收费 API 或公开部署。

### 实际执行、SHA和结构证据

- 本地 Node **v22.16.0**：`node --experimental-strip-types --test /mnt/data/ab-wave15/{A02,B10,B11,B12}/tests/*.test.mts` → **18 PASS、0 FAIL、0 SKIP**（只验证4个纯领域策略）。
- 本地 TypeScript **5.8.3**：`tsc --noEmit --strict --skipLibCheck --target ES2022 --module ESNext --moduleResolution Bundler /mnt/data/ab-wave15/{A02,B10,B11,B12}/examples/*.ts` → **PASS，只覆盖4份无第三方依赖的纯helpers**。
- 8份测试/策略源码本地 `git hash-object` 与 GitHub 提交树的完整 Git Blob SHA **8/8匹配**：A02 `a9515bcc/f90b2612`，B10 `64a52c95/1bee2df9`，B11 `9c13cb05/a743c521`，B12 `e6d8bce3/c3e1be3c`。这只证明离线测试在**已提交的相同字节**上执行。
- 相对上述精确集成基线的 GitHub Compare：源码/指南 **25/25 个变更路径全部在 A*/B* 所有权内，behind=0**。递归Git树未截断；4项×3 Demo 共 **45/45 sourceFiles 路径实际存在**，入口存在。随后本进度一处变更也属AB所有权。
- **真实 Recharts/Base UI/Radix/React Aria SDK 加载与React TSX完整类型检查、pnpm/Vite生产构建、Chromium焦点/Portal/IME/FormData/屏幕阅读器均 NOT_RUN/BLOCKED**。运行容器未安装本私有monorepo的受控pnpm依赖；已有Actions job缺执行步骤和可读构建日志，不能推断SDK PASS。不反复跑同一已知 runner/DNS 失败。无本轮新增运行PASS或虚构SDK Mock。
- 所有资源仍留在私有开发分支；无公共文件、依赖包、lockfile、CI、模板、main、PR #3/#8、其他组的改动。**dependencyRequests新增0**；现有版本仍由PLATFORM统一安装与锁定。

### 集成/后续队列

仅PLATFORM审核并合入本波 worker PR 到 `feat/library-lab`；不得并入main。优先取得真实依赖/runner证据后定向检查 A02 窄屏/resize与高级数字中间态，B10 Space/label与锁定权限 FormData，B11 Portal方向键/焦点返回/子菜单/删除状态，B12 中文拼音合成+Enter、取消旧查询/选中提交。若无runner的新证据，下一独立源码加固队列为 **A13 Three.js、A15 Leaflet、B13 dnd-kit、B14 Pragmatic drag and drop**，只修确证缺陷，不反复重写39项。

### 第15轮 PR 与 GitHub CI 完整回读

- Draft PR **[#59](https://github.com/CoderLambert/ReactLoom/pull/59)**，head `feat/library-lab-ab-wave15`，base **`feat/library-lab`**，校验代码+进度提交 `bc64243f77325a4b72d7f12909546157632922ed`（本段是随后文档补记）。集成基线至提交时仍为 `b3fa3b0370f50c39078562987400d753390671ee`，比较结果 **26/26 变更均在授权目录，ahead=3、behind=0**，无重叠开放AB PR。
- GitHub Actions 真实返回 **CI run 40480193825 failure**，**Library Lab run 40480193878 failure**。其中 Library Lab `catalogue` job 122108275644、`runtime-bootstrap` job 122108275836，以及 CI `verify(ssr)` job 122108275592 均返回 `steps=[]`，**没有真实构建或 SDK 执行步骤证据**；不能将其记为本轮源码构建失败的根因，也不能标记 SDK/browser PASS。此前相同环境故障已知，未循环重试。
- 无可读实际 TSX/SDK/Chromium 验收证据时保持 `verification.json` 中相应状态 `NOT_RUN`；PLATFORM负责获取 runner、依赖/锁文件与浏览器测试证据，AB仅在可复现的 A/B 目录缺陷上修复。进度至此 `runCount=15/24`，本批交付四项实质修改，不将源码文档覆盖误作通过验收。

---

## 第16轮（wave16）：Three.js、Leaflet、dnd-kit、Pragmatic 拖拽生命周期与状态边界

**runCount=16/24；A/B 39/39 已有源码与文档，但官方SDK/浏览器仍未完成验收。** 按协调合同先从 GitHub 读取最新集成 `feat/library-lab@b1b9d2a6aba6fb8578d40937c931b07d45f7e0cd` 的 COORDINATION、IMPLEMENTATION、根/包 AGENTS、types、catalog、本进度与开放 PR。确认 AB #59 已由 PLATFORM 合入、无开放 AB PR；新建 `feat/library-lab-ab-wave16` 从精确集成 HEAD 起步，不覆盖旧分支、不 force。Draft PR **[#63](https://github.com/CoderLambert/ReactLoom/pull/63)** 的 base 仅为 `feat/library-lab`，主 Draft #8、main 与 PR #3 不变。

### 本轮提交的实际垂直切片（4库、既有12个Demo选择）

| 库 | 实际源代码修复 | 新增或更新的校验 |
|---|---|---|
| A13 Three.js | `shouldRunFrameLoop` 将速度=0、后台不可见、系统减动/显式暂停纳入 GPU loop 门禁；调速同步更新动画策略，恢复重置帧时间；材质颜色只更新 material，不再每次重建并dispose geometry；切形状仍释放旧 GPU 资源 | `animation-policy.ts` 与测试扩至13例 |
| A15 Leaflet | 过滤后的当前可见ID同时控制地图高亮/状态/删除，删除后选中下一可见项；移动经纬度限制到±85/±180，缺失Seattle禁用更新；仍使用真实 L.Map、LayerGroup/Marker 与 ResizeObserver | 新 `location-policy.ts`、3例测试 |
| B13 dnd-kit | onDragEnd/上下按钮/重置读取同一 `itemsRef` 最新快照；数据层统一拒绝固定槽位跨越、无效ID和重复ID；basic只重排可见前缀，尾部保留；撤销同步恢复ref+React state | 扩展 `pinned-order.ts`，新增4例 `reorder-policy.test.mts` |
| B14 Pragmatic drag and drop | 使用官方 Element Adapter 的 `draggable({element,dragHandle})`；将 touchAction:none 和指针拖动限定到32px手柄，其他行区域的按钮点击、文本与滚动不会被整行原生draggable主动占用；保留键盘上下按钮与effect cleanup | 按官方API审查，浏览器交互仍须验收 |

真实运行组件、helper、测试、4个 `library.json`、4份guide.md和4份agent.md 已更新，`verification.json` 保持 sdk/build/browser NOT_RUN。全部条目继续使用同一 `examples/example.tsx` 作为展示与运行源码，没有生成伪页面、Mock目标SDK或修改公共文件。新增依赖 **0**；版本仍为 `three@0.186.0`、`leaflet@1.9.4`、`@dnd-kit/core@6.3.1`/`@dnd-kit/sortable@10.0.0`、`@atlaskit/pragmatic-drag-and-drop@1.8.1`（PLATFORM独占依赖与锁文件）。

### 实际运行和精确证据

- Node **v22.16.0**：`node --experimental-strip-types --test /mnt/data/ab-wave16/{A13,A15,B13}/tests/*.test.mts` → **20 PASS，0 FAIL，0 SKIP**。仅纯业务/动画策略；B14本轮没有虚构自动浏览器测试。
- TypeScript **5.8.3**：`tsc --noEmit --strict --skipLibCheck --target ES2022 --module ESNext --moduleResolution Bundler /mnt/data/ab-wave16/{A13,A15,B13}/examples/*.ts` → **PASS，仅A13/A15/B13三个无第三方依赖的纯helper**。第一次本地测试因缺B13本地被导入文件而FAIL，补齐与仓库SHA一致的 `pinned-order.ts` 后20/20通过；第一次TS命令因 `.ts` 导入扩展未启用而失败，后将重排规则合并进现有 `pinned-order.ts`，最终严格类型检查无需额外flags通过；未隐藏失败或把它算SDK通过。
- 六份实际测试/纯策略源码 Git Blob SHA 与本地 `git hash-object` **6/6匹配**：A13 `e3be47dd / 8ff02b5a`，A15 `38701797 / 5ec1ca3d`，B13 `0a104fd3 / e4c6cd14`。
- **代码提交 `438c31e72d01267d4f7b15cf9a240f74965f0cd2`**。GitHub比较本轮基线：**22/22变更文件均属 A*/B*，ahead=1、behind=0**。非截断完整Git树 **1959条路径**；4个manifest的 **12/12 个entryPoint** 和全部 `sourceFiles` 都有真实Blob。
- **真实第三方SDK import/TSX完整TypeScript、pnpm安装/锁文件、Vite生产build、Chromium/GPU/键盘/触屏/ARIA：NOT_RUN/BLOCKED**。当前容器没有本私有项目依赖；GitHub查询这次代码提交没有可确认的workflow run或commit status，不推断PASS；既有runner无步骤日志的问题不循环重试。验收必须后续由PLATFORM取得真实命令、当前sourceFingerprint和持久日志再标PASS。

### 交接、依赖和后续

**dependencyRequests新增0。** 仍只有 PLATFORM 能合入本Draft PR到私有集成分支，不能合main或公开部署。下一次先检查PR #63集成与真实runner/typecheck反馈，A/B下一独立缺陷队列：A09 Excalidraw/A10 tldraw 的卸载/白板状态，B05 Rive的WASM上下文，B17 Floating UI的Portal/focus/IME；只修复可复现问题，不重复生成39个条目。重点浏览器验收本轮的零速GPU帧停止、Leaflet过滤删除同步、dnd-kit连续拖放撤销、Pragmatic只有手柄可拖且上下按钮不被劫持。

### wave16 GitHub CI 回读补记（2026-10-27）

进度提交 `0c62488aae0c7ae477c762bb963a16b8797f9ea8` 对应两个 workflow：CI `40487604294`、Library Lab `40487604298`。后者 `catalogue` job `122133223477` 与 `runtime-bootstrap` job `122133223651`，前者 `verify (ssr)` job `122133223864` 均为 **failure 且 steps=[]**；catalogue 日志读取返回 GitHub BlobNotFound (404)。不能证明任何目标SDK、生产构建或浏览器实际运行，也无法定位源码编译失败。未循环重试同一runner缺步骤问题；由 PLATFORM 修复CI/runner/lockfile、取得含执行步骤与日志的证据后才重新验收。

---

## 第17轮（wave17）：Excalidraw / tldraw / Rive / Floating UI 安全、GPU 与真实操作闭环

**runCount=17/24**。本轮读取最新集成分支合同、实施/根与包AGENTS、types/catalog、本进度和开放PR。起始集成精确HEAD = \`caef398bfa3568b1e9bf690366b39ae5448769de\`（branch \`feat/library-lab\`）。AB旧PR #63 已于2026-10-27 10:41:33 UTC 合并；创建全新 \`feat/library-lab-ab-wave17\`，不重写旧分支。开放PR仅主Draft #8及无关#3，未存在开放AB PR。代码提交依次为 \`6ece7735a9d4996d8c1a20637fc215899c3e6bda\`、\`9771847d248a6bae1b36a2aaad27e62cb63b5602\`，第二次提交校验前一head且使用非force快进。

### 已提交的四库实质修复

|库|实际UI/SDK实现中的变化|独立规则与证据|
|---|---|---|
|A09 Excalidraw|导入前验证非空、.excalidraw/.json及1.5MB上限；真实 \`loadFromBlob\` 完成后检查元素<=200、禁止附带二进制、拒绝非HTTPS/嵌凭据链接；真实SDK的 \`onLinkOpen\` 调用同一个安全判断。原异步operationId及导出清理保留。|新增 \`examples/scene-policy.ts\`、\`tests/scene-policy.test.mts\`|
|A10 tldraw|真实 \`getSnapshot(editor.store)\` 下载加入JSON UTF-8字节3MB上限；对序列化失败显式反馈；Object URL与撤销timer由实例拥有，卸载时全部清除，不再留独立于Tab的悬空延迟清理。|新增 \`examples/snapshot-policy.ts\`、\`tests/snapshot-policy.test.mts\`|
|B05 Rive React|真实 \`useRive\` 播放器在页面后台或高级场景脱离视口时卸载，而不是只把playing设false；减动/手动暂停时可见实例保留但停播。切换level即取消未完成的业务模拟请求，防止旧计时器覆盖新场景。|新增 \`examples/runtime-policy.ts\`、\`tests/runtime-policy.test.mts\`|
|B17 Floating UI|原“复制引用”只修改React文本状态，现在真实调用 \`navigator.clipboard.writeText\`；只有浏览器Promise成功才显示复制成功并关闭Popover；权限拒绝保留浮层及aria-live错误。增加异步代次保护，关闭/改选/卸载后旧Promise不能覆盖新界面。继续保留真实Floating UI Portal/FocusManager/IME。|实际TSX及guide/agent修复；浏览器权限和焦点测试待运行|

A09/A10/B05 的三层 \`library.json\` 均引用新增规则源码；四库共12个 basic/business/advanced 场景继续从真实 \`examples/example.tsx\` 渲染；guide和agent同步更新，没有生成占位演示。**本轮共21个条目范围文件**（四份运行组件、三份helper及三份测试、三份manifest、四份guide与四份agent），再追加本 progress；不编辑其他所有权目录。没有新增 SDK 依赖，**dependencyRequests新增=0**。

### 实际验证及边界

- 容器 Node **22.16.0**：\`node --experimental-strip-types --test /mnt/data/ab-wave17/{A09,A10,B05}/tests/*.test.mts\` → **12 PASS、0 FAIL、0 SKIP**。验证仅覆盖导入规则、JSON下载上界、Rive布尔决策；B17剪贴板与React/SDK需浏览器实测。
- TypeScript **5.8.3**：\`tsc --noEmit --strict --skipLibCheck --target ES2022 --module ESNext --moduleResolution Bundler /mnt/data/ab-wave17/{A09,A10,B05}/examples/*.ts\` → **PASS，仅3份无SDK依赖的纯规则模块**。
- 上述六份rule/test本地 \`git hash-object\` 与 GitHub同分支blob精确 **6/6匹配**。GitHub递归树1985项、\`truncated=false\`；四库12个Demo的所有 entryPoint/sourceFiles均存在，三库9个Demo均包含新增helper。相对起始集成head的 compare 在代码第二次提交时 **21/21 文件均属于AB entries/A*/B*，ahead=2、behind=0**。
- **实际Excalidraw/tldraw/Rive/Floating UI SDK执行、React TSX完整类型检查、pnpm生产依赖、Vite构建、Chromium Clipboard/焦点/IME/白板/GPU释放均 NOT_RUN/BLOCKED**。本通道没有完整依赖与有效Runner执行日志；不能把规则测试、源码清单或SDK代码导入文本写为SDK PASS。四库 \`verification.json\` 保持既有状态，未虚构sourceFingerprint、官方资源许可或CI绿灯。
- A09 HTTPS仅为本教学示例对外链的最小约束，不等于恶意文档完全安全；A10的3MB是教学下载限制，不是SDK画布上限；Rive后台卸载后WebGL是否释放须用实际Chromium profile确认；Clipboard安全上下文与权限须浏览器确认。

### 后续队列与平台交接

PLATFORM审核本PR的base/head、授权路径并合入私有 \`feat/library-lab\` 后，需要优先恢复真实pnpm锁文件/Runner日志，并按本批4库定向验收：Excalidraw导入/重置竞态与URL点击；tldraw大文档快照、下载URL清理和许可；Rive后台/跨level/WASM与WebGL资源；Floating UI剪贴板拒绝、Escape/Tab焦点恢复及中文IME。再对39条A/B按明确TSX构建报错补修，而非重新生成页面。主Draft #8保持未合并main；不修改PR #3/模板/公开部署。

### wave17 PR/CI 最终回读（2026-10-27）

- 已创建 **[Draft PR #65](https://github.com/CoderLambert/ReactLoom/pull/65)**，head \`feat/library-lab-ab-wave17\`，base **\`feat/library-lab\`**，主PR #8继续Draft且未合并main。
- 本批代码及进度提交后相对精确集成起点 \`caef398bfa3568b1e9bf690366b39ae5448769de\` 的 GitHub Compare 为 **22/22 文件全部在AB授权范围，ahead=4、behind=0**。6/6 Node独立helper/test Git Blob字节与实际执行一致；四库12/12个Demo源码引用有效。
- 真实GitHub Actions：提交 \`f2b7ced9b565c3889ba1793101cbbf549a41e0e6\` 触发 CI run **40494818121** 与 Library Lab run **40494817999**，二者状态均为 \`failure\`；对应 \`runtime-bootstrap\` job **122157477021**、\`catalogue\` job **122157477399** 均为 \`steps=[]\`；两份Job日志均返回 **404 BlobNotFound**。因此没有任何可用构建步骤证据，不能归因源码TS错误或虚报SDK/build/browser通过；公共runner/锁文件修复仍由PLATFORM负责。
- 本批 **runCount=17/24**、依赖新增0。下一轮优先根据真实SDK/完整TypeScript报错修复四库或其他AB目录可复现缺陷，避免在没有runner情况下反复重试相同失败。

---

## 第18轮（wave18）：ECharts缩放与销毁、Floating UI剪贴板时序、两类拖拽异步冲突

**runCount=18/24**。从已核对的最新集成HEAD `e62650ad6d025963da9ede967125502502fd031f` 新建 `feat/library-lab-ab-wave18`，不重复初始化，也未修改旧 `feat/library-lab-ab` 或任何已合并worker分支。读取了协调/实施合同、包AGENTS、真实 `packages/library-lab/src/lib/types.ts` 和 `catalog.mjs`（根 `src/lib/...` 不存在，实际文件位于包下）、AB进度和开放PR；此前AB #65已合入，仅#8与无关#3仍开放，没有重复的AB PR。

### 实际源码修复（4库、继续复用12个三层Demo运行入口）

|库|实际变更|应做的浏览器回归|
|---|---|---|
|A01 ECharts|外层移除250px最小宽度；ResizeObserver经单个rAF合并并仅在非零容器尺寸resize；卸载断Observer、取消rAF后dispose；点选真实seriesName/name/value，重置清空旧选项；减少动态偏好不播放容器宽度CSS动画|窄于250px、连续拖宽、立刻卸载、StrictMode、柱线选择及 reduced-motion|
|B17 Floating UI|原close依赖React Effect撤销clipboard Promise，有事件到Effect之间的竞态；现在 `useFloating.onOpenChange` 同步撤销请求，Escape/外部点击/业务选择立即使旧回调失效；卸载清理保留|受控延迟的Clipboard resolve/reject，关闭后重开不出现旧成功状态，Portal+Tab/Escape焦点归还|
|B13 dnd-kit|保留真实Legacy DndContext/Sortable/KeyboardSensor；drag start记录activeId+数据revision+level，drag end只有会话未被键盘重排、重置、撤销或切模式改变才可提交；cancel和模式切换清空会话|拖动期间点击上/下移或恢复、再结束旧拖动；键盘Space/Escape及触控|
|B14 Pragmatic DnD|真实Atlassian monitor.onDragStart/onDrop使用相同代次不变式；Native Drop必须匹配当前数据revision/level/ID，消费会话后才能更新；undo/reset/卸载清理，同时保留独立dragHandle与键盘按钮|原生拖动期间撤销、重置、模式切换、drop到无效目标以及跨实例作用域|

本批代码与指南/Agent共**18个文件**，源码提交 `c93d27dd00381aa1ce026a74365c57ca890bb48a`：4个实际TSX示例、2个纯规则helper、2个独立新单测、2份manifest追加高级源码路径、4份guide、4份agent。未新造SDK替代品、页面占位或第二份展示源码，A/B的39/39源码覆盖口径不变。所有修改均在 `packages/library-lab/entries/A*`/`B*` 授权范围，随后仅本进度文件另提交。

### 实际执行与可复核校验

- 本地 Node **v22.16.0**：`node --experimental-strip-types --test /mnt/data/ab-wave18/B13/tests/*.test.* /mnt/data/ab-wave18/B14/tests/*.test.*` → **28 PASS、0 FAIL、0 SKIP**。覆盖原固定槽位/隐藏尾部重排20项及本批drag-session8项。仅执行不依赖SDK的策略测试，**不是第三方DndContext、原生Drag或浏览器回归结果**。
- TypeScript **5.8.3**：`tsc --noEmit --strict --skipLibCheck --target ES2022 --module ESNext --moduleResolution Bundler /mnt/data/ab-wave18/{B13,B14}/examples/pinned-order.ts` → **PASS**，仅两份纯规则模块，未执行React/TSX与完整应用检查。
- 本地Git `git hash-object` 与GitHub提交blob完整SHA **4/4一致**：B13 helper `4725aa1cdebf0a0a7ce308249adc67486642905b`，B14 helper `e2aa0326016fbc01dd1fcf01787d3185b2f839c6`，两份新单测同为 `c5a82c2a168976e0fa5cb8c02a9c6fa985cd871d`。3份旧基线测试的Blob也精确匹配GitHub，未用替身函数测试SDK。
- GitHub完整tree **2009条路径，truncated=false**，四份manifest的**12/12 demo入口、共53/53入口/sourceFiles引用均存在**。相对精确base的Compare **18/18文件全部在AB目录、ahead=1、behind=0**；加上本进度将为19文件，提交后再核对。
- ECharts/Floating UI/dnd-kit/Pragmatic**官方SDK运行、React完整TSX类型检查、pnpm真实依赖和锁文件、Vite生产构建、Chromium/Canvas/Clipboard/drag/focus验收：NOT_RUN/BLOCKED**。没有可用已安装依赖；既有Actions runner失败无执行steps和日志，本批不循环重试相同故障。四项 `verification.json` 的sdk/build/browser继续NOT_RUN，绝无新增真实SDK PASS。

### 依赖、集成及下一队列

**dependencyRequests新增0**；既有SDK声明 `echarts@6.1.0`、`@floating-ui/react@0.27.20`、`@dnd-kit/core@6.3.1`、`@dnd-kit/sortable@10.0.0`、`@atlaskit/pragmatic-drag-and-drop@1.8.1`，由PLATFORM负责实际安装、锁文件和peer核对。

**Draft PR [#68](https://github.com/CoderLambert/ReactLoom/pull/68)**：base严格 `feat/library-lab`，head `feat/library-lab-ab-wave18`；只允许PLATFORM审查合并到私有集成分支，不更改main、PR #3/#8、模板或公开部署。下一批优先依据PLATFORM的真实构建/SDK/浏览器日志排查四库，再按独立缺陷处理 A16 MapLibre 多实例/WebGL重载、A06 React Flow连线冲突、B18 cmdk 输入法与快捷键；仍禁止把新增规则测试冒充SDK PASS。到runCount24仍存在验收缺口则准确记录并结束本通道。

### wave18 GitHub CI 对应提交回读（2026-10-27）

PR #68的进度提交 `b5a21a00650eb37bc86dd181e449b3bf00328b94` 触发GitHub Actions：**CI run `40502535598` = failure**（packages、verify ssr/spa/mobile、lighthouse ssr/spa、smoke共7个job全部 `steps=[]`）；**Library Lab run `40502535604` = failure**（runtime-bootstrap `122183530797`、catalogue `122183531102`，二者均 `steps=[]`）。这些job没有任何可审查的测试/安装步骤，不等于已执行生产TS/Vite、SDK或浏览器，也没有足够证据将错误归因于此次AB源码。相同runner不提供步骤的故障交PLATFORM集中调查，本通道不重复重跑。当前相对集成基线Compare **19/19文件全部在AB授权范围、ahead=2/behind=0**。新版Docs提交只补录证据，不改变源码和verification状态。


---

## 第19轮（wave19）：MapLibre GL / React Flow / cmdk 真实状态与生命周期修复

**runCount=19/24**；本次从读取时集成精确 HEAD `a7514e4b6354ade43a36dc39512c7ccafc688dbe` 建立新分支 `feat/library-lab-ab-wave19`，没有在已合并的旧 worker 分支上重复初始化或force覆盖。先阅读 COORDINATION、IMPLEMENTATION、根/包AGENTS、包内真实 `src/lib/types.ts`/`catalog.mjs`、AB历史和开放PR；当时没有开放 AB PR。主PR #8与无关PR #3保持不变。

### 本轮已实际提交（3库、9个三层Demo配置）

| 条目 | 可交互源代码变化 | 独立新规则与回归用例 |
|---|---|---|
| **A16 MapLibre GL JS** | GeoJSON过滤后当前选中项自动调整到首个可见站点，空列表取消选择；关闭MapLibre内置trackResize，改为单ResizeObserver+rAF及非零尺寸/实例有效性判断；监听WebGL context丢失/恢复并显示DOM表格回退；load图层初始化出错提示，卸载同步移除事件与释放map | `examples/selection-policy.ts`、`tests/selection-policy.test.mts`，4例 |
| **A06 React Flow** | Demo level从basic换到business/advanced时恢复完整节点和边；重置创建独立节点/位置/data副本而不复用可变初始对象；advanced增加原生Select键盘连线、表格删除按钮，真实调用现有onConnect/DAG校验和onNodesChange清边，不是只改状态提示 | `examples/workflow-preset.ts`、`tests/workflow-preset.test.mts`，3例 |
| **B18 cmdk** | 原先命令只写“演示完成”文本，本次Command.Item选中后实际修改本地NewsHub fixture：稍后阅读切换、标记已读、生成本地引用和模拟刷新计数；危险删除继续被禁用；切层级重置演示数据，原Keyboard/IME守卫仍保留 | `examples/command-state.ts`、`tests/command-state.test.mts`，4例 |

三库的真实 `examples/example.tsx` 和 `library.json` 已同步，新辅助源码明确加入basic/business/advanced的sourceFiles；guide与agent手册记录迁移、安全边界及使用时的实际交互。没有编写第二份展示用假代码，没有Mock官方 SDK；原39/39源码和文档覆盖状态不等于39/39可运行验收。

### 提交、精确范围与真实执行结果

- MapLibre代码提交 `34069ad21606e4f1c093fe9c4578fedcf9fcae8b`，React Flow提交 `2c4a802f17b4eed8d7be0fec3f44b436be1ca737`，cmdk提交 `51e0cbc61a1d7420bf266065a3a95abdb72eaa7c`，每一步均基于上一步精确head使用非force GitHub ref 快进。
- Node **22.16.0** 实际执行 `node --experimental-strip-types --test /mnt/data/ab-wave19/{A06,A16,B18}/tests/*.test.mts` → **11 PASS、0 FAIL、0 SKIP**。A06 3、A16 4、B18 4，仅为纯领域策略，不是假装 SDK 通过。
- TypeScript **5.8.3** 实际执行 `tsc --noEmit --strict --skipLibCheck --target ES2022 --module ESNext --moduleResolution Bundler /mnt/data/ab-wave19/{A06,A16,B18}/examples/*.ts` → **PASS**，仅新加的三份无目标SDK依赖的独立TS规则源码。
- 六份本地执行的helper/test经 `git hash-object` 与已提交GitHub的完整Blob SHA **6/6逐文件一致**：A06 `9c810db9/9f22ec7e`、A16 `2b39770d/d52705e6`、B18 `dab4b9aa/25ad05fa`。这保证本地运行对象字节与提交一致，但不保证React真实运行。
- GitHub Compare从精确本轮集成base至代码HEAD：**18/18变更文件均属于AB的entries/A*或B***，ahead=3、behind=0；完整递归Git Tree有**2027项，truncated=false**，三库 **9/9 demo entryPoint、45/45 sourceFiles与入口引用均存在**。后续增加本AB.md进度文件，同样属于允许范围。
- 三库 `verification.json` 已实际回读，sdk/build/browser全部仍为**NOT_RUN**；真实MapLibre/WebGL2、React Flow拖拽+键盘焦点、cmdk Portal/IME、完整React TSX类型、pnpm真实依赖、锁文件、Vite和Chromium **均未执行成功验证（NOT_RUN/BLOCKED）**。新代码的官方SDK import保留，不以Node规则PASS替代SDK证据。本代码HEAD尚未发现GitHub Actions执行记录；此前runner无steps/日志的阻塞不无限重试。
- **dependencyRequests本轮新增0**。现有 `maplibre-gl@6.15.0`、`@xyflow/react@12.12.0`、`cmdk@1.1.1` 依赖声明由PLATFORM唯一负责人真实安装、peer/许可复核并更新锁文件。未改package.json、pnpm-lock、CI、其他进度/条目、main或公开部署。

### PR与下一批验收队列

Draft **[#71](https://github.com/CoderLambert/ReactLoom/pull/71)**，head `feat/library-lab-ab-wave19`，base严格为 `feat/library-lab`，仅PLATFORM可以审核合并到私有集成分支。下一轮先读PR集成结果与runner证据；优先真实Chromium验收MapLibre重复挂载/失去WebGL上下文/离线过滤，React Flow切层级和键盘建边/删点，cmdk真实onSelect/IME/焦点，发现具体错误再修复；如果依赖或runner仍阻塞，继续选择独立可确认的A/B条目缺陷（例如B15网格布局、A14 R3F、A03 Chart.js），而非生成重复占位页面。到24轮仍未拿到SDK/浏览器/构建证据则如实报告、停止本通道，不宣称质量门禁已完成。



### wave19 GitHub CI与PR最终回读（2026-10-27）

- Draft PR **[#71](https://github.com/CoderLambert/ReactLoom/pull/71)** 保持open/draft，base仅 `feat/library-lab`。进度提交 `6ef3d292e6ea96201a0b7acc940c3a5a70300393` 所在worker分支按GitHub Compare相对精确集成起点 **ahead=4、behind=0、19/19文件均在AB授权范围**（三库各6文件 + 本进度1文件）。
- GitHub Actions真实查询：Library Lab `40510987688` = **failure**；CI `40510987650` = **failure**。Library Lab 的 `runtime-bootstrap` job `122212525050`、`catalogue` job `122212525684`、CI 的 `verify (spa)` job `122212525493` 均经独立 steps API 核实 **steps=[]**；CI所有7个Job均失败。这些记录没有可读执行步骤，不能证明实际运行过 pnpm、React TSX构建、Vite或SDK，不能认定源码有编译缺陷，更不能将状态写成PASS。Runner/锁文件属PLATFORM处理，AB不循环重跑同一不具备日志的失败。
- 本轮实际通过的只有**11项 Node 纯策略测试与三份TypeScript纯规则检查**；MapLibre GPU/React Flow焦点连接/cmdk IME等关键浏览器验证仍明确NOT_RUN/BLOCKED。PLATFORM合入前应对本PR继续执行真实 SDK、pnpm、Chromium 定向回归。


---

## 第20轮（wave20）：Sonner / react-motion迁移 / react-beautiful-dnd迁移的真实业务交互加固

**runCount=20/24**，集成基线精确 SHA `f96f43fad9ba6e227b71a85596c9b91eb1ff1dfb`；先读取COORDINATION/IMPLEMENTATION、根和包AGENTS、types/catalog、AB进度、现有PR，确认前轮PR #71已合入且无AB开放PR，新建`feat/library-lab-ab-wave20`而不force覆盖旧分支。

### 本轮实际交付

|条目|运行中实际变化|规则测试|
|---|---|---|
|B20 Sonner|保存Toast的撤销动作绑定最近一次保存token；新保存关闭旧Toast，旧异步动作无法撤销新业务状态；level切换失效任务与撤销token、定向清理本例Toast，不影响别的页面|新增`tests/undo-ownership.test.mts`3例，复用`LatestRunGuard`|
|B21 react-motion历史迁移|运行目标仍是真实`motion/react`；使用单一`reduceTasks`事务处理连续添加、删除、撤销、选中；单调ID与24项容量；删除聚焦按钮后转移到邻近项/添加按钮，减少动画控制layout|新增`examples/task-history.ts`和4项测试|
|B22 react-beautiful-dnd历史迁移|实际运行`@hello-pangea/dnd`；将键盘排序/撤销/重置统一到`reduceOrder`；drag开始记录level、revision和ID快照，结束时拒绝旧Drop覆盖新状态；固定槽不可跨越|扩展`examples/pinned-order.ts`和新增5项测试，原固定槽8例保留|

三库均更新`library.json`真实源码清单、`guide.md`、`agent.md`、`AGENTS.md`；三个独立真实SDK入口仍由各自`examples/demo.tsx`转发`example.tsx`，不生成伪页面；SDK/build/browser `verification.json`不伪造PASS。

### 实际测试、精确内容核验

- Node 22.16.0：
  `node --experimental-strip-types --test /mnt/data/ab-wave20/B20/tests/{undo-ownership.test.mts,latest-run.test.mts} /mnt/data/ab-wave20/B21/tests/task-history.test.mts /mnt/data/ab-wave20/B22/tests/{order-history.test.mts,pinned-order.test.mjs}`
  **23 PASS / 0 FAIL**（3个库的纯业务规则，包含11个原有/延续规则用例，不是第三方SDK渲染）。
- TypeScript 5.8.3：`tsc --noEmit --strict --skipLibCheck --target ES2022 --module ESNext --moduleResolution Bundler` 对本次三个纯规则模块 `B20/examples/latest-run.ts`、`B21/examples/task-history.ts`、`B22/examples/pinned-order.ts` 为**PASS**，不等于完整React TSX类型检查。
- Node实际测试的六份目标源码/测试文件与GitHub Git Blob SHA逐一比对完全一致 **6/6**；目标SHA见对应文件GitHub API。GitHub Compare在创建进度提交前：**20/20项变更全部在AB允许路径、ahead=2/behind=0**。
- 完整`pnpm install`、SDK真实导入执行、完整React类型检查、Vite生产构建、Chromium焦点/拖动/Portal仍为 **NOT_RUN/BLOCKED**；本轮容器`git ls-remote https://github.com/CoderLambert/ReactLoom.git HEAD`返回`Could not resolve host: github.com`，没有反复重试DNS；不把规则单测算进SDK PASS。GitHub Actions状态以提交后实际查询为准，不继承前轮缺步骤的FAIL为本轮测试结果。

### 提交、依赖及后续

- 源码提交1：`43a2aa8dea3326e80fdaa02b497b3af12e29e08a`（B20/B21）
- 源码提交2：`1498a097043baf36baae64305ddf8c399b2c84bd`（B22）
- 本段进度另提交；PR head与最新进度提交以GitHub记录为准，拒绝用自身commit SHA作循环声明。worker PR base只允许`feat/library-lab`。
- `dependencyRequests`：**本批新增0项**，现有Sonner/Motion/@hello-pangea/dnd已经由PLATFORM声明准确版本；仅PLATFORM处理公共package、pnpm-lock、CI。
- 下一队列：取得PLATFORM真实SDK/完整TSX、浏览器焦点（包括Motion退出动画）及拖动碰撞证据；优先复查B01/B19或A15仍可独立复现的业务缺陷。39/39仍只表示源码与文档覆盖，不宣称SDK验收完成；持续跟踪至最多24轮。

### wave20 GitHub Actions实际回读（PR #74）

截至本轮读取，提交`901879ee952c17a64db3a38d2b3b225d8129f2a0`对应`Library Lab` run [40519701965](https://github.com/CoderLambert/ReactLoom/actions/runs/40519701965)：**failure**，runtime-bootstrap与catalogue共2个Job均`steps=[]`；`CI` run [40519702223](https://github.com/CoderLambert/ReactLoom/actions/runs/40519702223)：**failure**，smoke、packages、verify spa/ssr/mobile、lighthouse spa/ssr共7个Job均`steps=[]`。共9/9 Job没有可验证安装/构建/执行步骤，不能据此判定AB代码编译失败，也不能标记SDK/浏览器PASS。该runner异常交PLATFORM唯一Owner处理，本通道不盲目重跑。新增SDK/构建证据仍为零；本轮最后追加DnD level切换前的layout-effect代次失效，浏览器运行仍待验证。

 
---

## 第21轮（wave21）：Leaflet地图所有权、Embla键盘访问、Chart.js选点和采样上界

**runCount=21/24**。本轮先读取最新私有集成分支 **`feat/library-lab@9d57ccede8413b9822a964912dec6705978727e3`** 的协调/实现合同、根和包AGENTS、包内types.ts/catalog.mjs、AB当前进度以及开放PR；确认AB #74 已合并、没有开放的AB worker PR，故基于该精确集成SHA创建 **`feat/library-lab-ab-wave21`**，不复用已合并分支，不force覆盖。仅改A/B条目和本AB.md。

### 本批实际源码改进（3库、原9个basic/business/advanced Demo共用真实代码）

| 库 | 真实代码行为 | 纯规则回归 |
|---|---|---|
| **A15 Leaflet** | 移除地图实例effect对level的依赖，使L.map仅随挂载建立、卸载释放；层级变更只重置数据，避免新Map没有Markers。筛选被隐藏的选中来源时回写到真实选择state。40个模拟来源上限改为**同时存在数**，删除后可继续新增；唯一site ID单调不复用且坐标始终合法。UI和函数式state setter都检查容量。 | 更新station-factory.ts及其测试；地图真实L.Map/LayerGroup不被Mock |
| **B19 Embla Carousel** | 将SDK `scrollSnapList().length` 与卡片数分开播报，防止trimSnaps造成“第N张”误报；聚焦region按左右方向键使用真实Embla v8 scrollPrev/Next，内部控件按键不被截获；slide具group/幻灯片语义；prefers-reduced-motion实时监听，导航传官方`jump`跳过动画。 | 更新slide-policy.ts/独立keyboard策略测试；保留真实useEmblaCarousel |
| **A03 Chart.js** | SDK `options.onClick` 选择柱/线数据点，与HTML表格的键盘可访问数值按钮共享selectedDay；用SDK `chart.setActiveElements` 更新选点高亮，状态区域播报日期/数字。修复revision到10000后仍持续interval的空转，到上界禁用按钮及停止采样。 | 更新chart-stream-policy.ts与边界断言；保留真实Chart生命周期 |

三个库各更新运行源码、纯TS规则、Node测试、中文guide和agent（**15个文件**），未改已登记的library.json、AGENTS.md、verification.json的真实状态，9个Demo仍从同一份 `examples/example.tsx` 展示和执行。没有新增SDK包和dependencyRequests；没有增加占位页面、Mock目标SDK、破坏现有sourceFiles清单或修改公共配置。

### 真实验证与准确口径

- 容器 **Node 22.16.0** 执行：
  `node --experimental-strip-types --test /mnt/data/ab-wave21/{A03,A15,B19}/tests/*.test.mts`
  → **13 PASS、0 FAIL、0 SKIP**，仅覆盖3库纯业务/键盘/资源上界策略。
- **TypeScript 5.8.3** 执行：
  `tsc --noEmit --strict --skipLibCheck --target ES2022 --module ESNext --moduleResolution Bundler A03/examples/chart-stream-policy.ts A15/examples/station-factory.ts B19/examples/slide-policy.ts`
  （工作目录 `/mnt/data/ab-wave21`）→ **PASS，仅三份纯TS helper**，不是React完整TSX类型检查。
- 已将本地执行的 **6/6 源码与测试文件**经 `git hash-object` 与GitHub提交Git Blob逐一校验**精确匹配**。其中A03 helper/test `7df2904561134cde42d5d9a17e954d59abb9e991`/`8abbaa7d97666a438dc1251d435a6f7c0e39694a`；A15 `6b9f2336f3af0b8b9dd9455bf307fa4f86ed38c2`/`17a6f8576f197eae54238d2dac270d327b20246a`；B19 `8058add2051615cb1e1ac38da6f870eef51f0c08`/`07b0e729c3ba7fdd09e0a78af5328c3c16bde14a`。
- GitHub compare **本轮代码HEAD `fca7c797df675f51a4eddf71c0a8bb7d1928132e` 对精确集成起点：ahead=3、behind=0、15/15变更文件均位于本通道A/B授权范围**。本progress加入后再比对，预期只有额外的progress/AB.md。三库9个Demo的entryPoint/sourceFiles原声明均未变，且在此前完整集成树内存在。
- **实际第三方SDK import/runtime、React TSX严格检查、pnpm完整依赖/锁文件、Vite生产构建、Chromium Chart/Leaflet/Embla键盘焦点/Resize/StrictMode、移动触控**本通道仍是 **NOT_RUN/BLOCKED**，不得从13个纯逻辑Node PASS推断出SDK/browser PASS；既有workflow大量job steps为空的问题由PLATFORM调查。本批verification.json继续保持sdk/build/browser为NOT_RUN。
- 当前GitHub提交：A15 `b85f5f2522c85df693a4248699e3b2986fea25ed` → B19 `17a04b611d41f993ca62b28976431a717e1fe274` → A03 `fca7c797df675f51a4eddf71c0a8bb7d1928132e`，均以精确父提交创建tree/commit，再使用 **expected_sha+non-force** 更新分支。未修改main、公共依赖/CI、旧模板、PR #3或公开部署。
 
### 下一队列

由PLATFORM审核并集成本通道Draft PR（base只能 `feat/library-lab`）后，按真实SDK可执行环境重点验证A15跨level仅1个Map/标记不丢、A03可访问图形选点/Chart实例销毁、B19导航键盘/ARIA/loop与减少动画。若依赖仍阻塞，继续排查B01 Motion焦点及A14 React Three Fiber场景GPU生命周期等可独立确认的缺陷。**39/39是条目源码+文档覆盖，不是官方SDK运行通过。**剩余授权轮次3轮，到24仍缺真实验收须如实上报并结束AB通道。

### wave21 GitHub Actions最终证据（2026-10-27）

- 首次进度提交 `38a0c37e85ef169e12baa7ea7cb8a0780c5922ba` 引发 **Library Lab run [40530001456](https://github.com/CoderLambert/ReactLoom/actions/runs/40530001456) = failure** 与 **CI run [40530001245](https://github.com/CoderLambert/ReactLoom/actions/runs/40530001245) = failure**。分别2个与7个Job，共 **9/9个Job经过独立steps API核对全部`steps=[]`**。抽查runtime-bootstrap Job `122279881283`日志返回 **HTTP 404 BlobNotFound**。无法证明任何实际安装、SDK渲染、类型/构建或Chromium步骤执行，不能推断为AB源码编译失败。公共runner与依赖验收交PLATFORM处理，不重复盲跑。
- 后续仅将A15测试标题从旧“invalid or excess”修正为准确的“invalid fixture sequences”；断言逻辑不变。修正后的本地文件`git hash-object`是 `17a6f8576f197eae54238d2dac270d327b20246a`，Node 22.16.0 同一3库策略套件已重新执行，仍 **13 PASS、0 FAIL、0 SKIP**。所有六份规则/测试的新GitHub blob与本地文件保持一致，其余源码无变更。本文并未把任何 SDK/build/browser 标为PASS。
