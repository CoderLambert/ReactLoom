# AB 开发进度 — A/B 前端库垂直实现

**调度轮次：1 / 最多24；状态：FIRST_VERTICAL_BATCH_COMMITTED（实际 SDK 与浏览器未验证）。**

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

