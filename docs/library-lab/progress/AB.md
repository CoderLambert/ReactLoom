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
