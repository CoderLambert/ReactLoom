# AB 开发进度 — A/B 前端库垂直实现

**最新调度轮次：7 / 最多24；状态：WAVE7_AB_39_SOURCE_STAGED（A/B全部39条已提交源码与文档，PR #29 待集成；SDK/构建/浏览器仍未验证）。**

- 分支：`feat/library-lab-ab`，base 提交 `38ed2d247bd82e4f1422b0e8904973e16bca2972`。
- 集成目标：`feat/library-lab`，集成读取的头提交 `5955b9a03f95545f2107583a109e22cc6e44078c`。
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
