# Library Lab 剩余116库整改路线图

日期：2026-11-10。整体设计见 [design.md](design.md)，进展见 [task-log.md](task-log.md)。新会话从 [start-here.md](start-here.md) 启动，以 [queue.json](queue.json) 的状态和顺序为准。

## 概览

- 当前119库，C20 clsx、D15 Dexie、F18 visualizer 已完成样板整改；它们作为参考单列，不计入下面116阶段。样板是工作区本地验证，正式收据状态独立。
- 116 项整改队列全部达到 `content_done`，三份样板单列。E19 在仅本机获准的隔离预览完成转码验收。内容、本地运行和正式收据分别记录，详见 queue.json 与 results。
- 近期细化两个阶段：Monaco 与 Streamdown。两者均已有具体问题和可读源码，适合验证复杂交互与薄弱内容两类整改；没有理由提前猜测其余库的精确实现或工时。
- 编号是稳定追踪号和默认顺序，不表示所有库都串行依赖。无共享写冲突的已细化阶段可以并行；公共生成、依赖与宿主变化服从主控屏障（见 design.md 决策3）。
- 这是新的内容质量整改计划；2026-10历史通道/轮次记录保持原样，不追加“第25轮”。

## 阶段1 · E05 Monaco：编辑、语言诊断和草稿闭环

### 前置条件

- [x] 已核对实际工作区和既有样板，读取 E05 全部适用材料与 Worker 接线；确认当前版本与匹配的官方资料。
- [x] 明确编辑器尺寸、语言 Worker、宿主实际挂载时机与可用浏览器；需要公共变更先由主控完成依赖。

### 目标

工程师可区分 model、editor 与语言服务，用一个可编辑案例观察文本、诊断和保存结果；讲解与宿主实际行为一致，清理细节放到对应工程问题中（见 design.md 决策1、决策2、决策6）。

### 子任务

- [x] 1.A 完整交付 E05：核实关键断言，重组工程问题与1–3个学习目标，修改真实示例/源码展示和Agent指引，补官方README/官网，再完成定向运行与六项复核。实施时在该库变更内细化，不在规划期拆散成文案/代码/资料三个孤立交付。

### 验收标准

- [x] 操作可见编辑内容、真实语言诊断和本地草稿结果；说明保存范围，不暗示服务器持久化。
- [x] 实际启动、切换、离开后的模型/监听/Worker所有权处理有对应环境证据；策略测试与浏览器证据分别记录。
- [x] 官方资料与版本可追溯，README摘要正确，官网状态有依据；六项适用条件均通过后才能content_done。

### 交付物

E05完整条目及 results/E05.md；主控维护的必要公共接线、定向验证记录、queue.json状态与阶段日志。建议未来变更名 `implement-upgrade-library-quality-p1`，不在本次创建变更壳。

## 阶段2 · E11 Streamdown：累计正文到可见流式结果

### 前置条件

- [x] 已核对当前 E11 的真实源码、版本与官方用法，保留 SUMMARY_ONLY / recreated 来源属性。
- [x] 阶段1的主控共享文件变动已稳定，或已确认两库无需共享写入；不以阶段1完成作为无关库的硬依赖。

### 目标

读者理解分段数据怎样累积成传给真实渲染器的正文，能操作开始/暂停/重置并观察未闭合语法到完成的变化；明确本地输入fixture与模型服务的边界（见 design.md 决策1、决策2、决策6）。

### 子任务

- [x] 2.A 完整交付 E11：从输入—累积—渲染主线改写，核实并保留有意义的1–3个目标，正常排版真实源码，补官方资料，完成交互与内容复核。

### 验收标准

- [x] 页面同时说明输入、累积文本与显示结果，暂停/重置/结束及离开清理可操作；不把每个delta独立当完整消息。
- [x] 关键语法与链接行为用匹配版本的真实库验证，外部资源/HTML行为只陈述实际保证。
- [x] 六项证据完整；原文快照来源可靠，官网状态准确；未运行的适用项不能标content_done。

### 交付物

E11完整条目及 results/E11.md、必要定向浏览器/SDK证据和主控队列日志。建议未来变更名 `implement-upgrade-library-quality-p2`。

## 阶段3–116 · 远期逐库覆盖

每行的目标是待源码核实的设计方向，非逐库缺陷结论。远期只记录目标与细化所缺信息；达到可执行候选时按 design.md 决策2补前置条件、目标、一个完整单库子任务、验收标准、交付物。暂不预填未来 change 名、Demo 数或工时。

雾区代码：**源码/版本**＝尚缺该库当时的完整源码审查、匹配官方版本和最终学习目标；**CLI产物**＝还缺真实配方/cwd/输入输出与产物核实；**宿主/资源**＝还缺对应浏览器、专用runner、Worker或资产前提；**迁移映射**＝还缺历史API到现用替代库的版本/行为映射。所有行还需当次选择官方README并实测官网限制。

| 阶段 | 库 | 本库阶段目标 | 细化所缺信息 |
| --- | --- | --- | --- |
| 3 | [F05 SheetJS](../../../packages/library-lab/entries/F05-sheetjs/library.json) | 以行数据、sheet、workbook、字节与回读结果串联真实工作簿往返 | CLI产物 |
| 4 | [B09 shadcn/ui](../../../packages/library-lab/entries/B09-shadcn-ui/library.json) | 说明组件源码来源、实际定制与上游差异，讲清源码所有权与维护成本 | 源码/版本 |
| 5 | [A06 React Flow](../../../packages/library-lab/entries/A06-react-flow/library.json) | 保留审批工作台闭环，补最小图编辑路径并划清 React Flow 与自建执行器职责 | 宿主/资源 |
| 6 | [A01 Apache ECharts](../../../packages/library-lab/entries/A01-echarts/library.json) | 用同一组指标贯穿 option、轴和系列，观察数据更新与尺寸变化 | 源码/版本 |
| 7 | [C01 React Hook Form](../../../packages/library-lab/entries/C01-react-hook-form/library.json) | 先讲注册、错误与提交，再递进动态字段和业务异步错误 | 源码/版本 |
| 8 | [D07 TanStack Query](../../../packages/library-lab/entries/D07-tanstack-query/library.json) | 先观察查询键共享、fresh/stale 与后台刷新，再讨论业务更新与取消 | 源码/版本 |
| 9 | [F11 MSW](../../../packages/library-lab/entries/F11-msw/library.json) | 跟踪真实请求匹配 handler、返回422和恢复，区分MSW机制与Lab隔离接线 | CLI产物 |
| 10 | [D03 p-limit](../../../packages/library-lab/entries/D03-p-limit/library.json) | 以运行/排队/完成与实测峰值解释并发上限，随后解释取消边界 | 源码/版本 |
| 11 | [B13 dnd-kit](../../../packages/library-lab/entries/B13-dnd-kit/library.json) | 按拖拽、受限排序与撤销组织，观察稳定身份、数组与界面同步 | 源码/版本 |
| 12 | [C07 TanStack Table](../../../packages/library-lab/entries/C07-tanstack-table/library.json) | 让原始数据到行模型再到DOM可见，区分客户端与服务端排序分页 | 源码/版本 |
| 13 | [A10 tldraw](../../../packages/library-lab/entries/A10-tldraw/library.json) | 从白板编辑、保存与恢复讲清文档/会话状态以及实际许可前提 | 宿主/资源 |
| 14 | [B17 Floating UI](../../../packages/library-lab/entries/B17-floating-ui/library.json) | 以定位变化、碰撞处理和键盘焦点讲清实际浮层组合与生命周期 | 源码/版本 |
| 15 | [E19 ffmpeg.wasm](../../../packages/library-lab/entries/E19-ffmpeg-wasm/library.json) | 先明确资源许可与加载前提，再以真实输入、转换参数、输出和取消解释处理链 | 宿主/资源 |
| 16 | [A02 Recharts](../../../packages/library-lab/entries/A02-recharts/library.json) | 以真实输入、状态变化和结果解释React 声明式 SVG 图表与可访问数据表 | 源码/版本 |
| 17 | [A03 Chart.js](../../../packages/library-lab/entries/A03-chartjs/library.json) | 以真实输入、状态变化和结果解释模块化 Canvas 图表与 React 生命周期边界 | 源码/版本 |
| 18 | [A04 uPlot](../../../packages/library-lab/entries/A04-uplot/library.json) | 以真实输入、状态变化和结果解释有界内存的时间序列趋势图与实时遥测 | 源码/版本 |
| 19 | [A05 D3](../../../packages/library-lab/entries/A05-d3/library.json) | 以真实输入、状态变化和结果解释可定制SVG可视化：比例尺、坐标轴、数据联结与动态重绘 | 源码/版本 |
| 20 | [A07 AntV G6](../../../packages/library-lab/entries/A07-antv-g6/library.json) | 以真实输入、状态变化和结果解释关系网络的节点、边、拓扑与交互画布（基于 G6 5.1.1） | 源码/版本 |
| 21 | [A08 Mermaid](../../../packages/library-lab/entries/A08-mermaid/library.json) | 以真实输入、状态变化和结果解释将受控 Mermaid DSL 编译成流程图、时序图和状态图 | 源码/版本 |
| 22 | [A09 Excalidraw](../../../packages/library-lab/entries/A09-excalidraw/library.json) | 以真实输入、状态变化和结果解释手绘白板嵌入、业务流程草图、导入导出和协作边界 | 源码/版本 |
| 23 | [A11 Konva](../../../packages/library-lab/entries/A11-konva/library.json) | 以真实输入、状态变化和结果解释Canvas 2D 场景图、图元拖拽、选择与变换 | 源码/版本 |
| 24 | [A12 react-konva](../../../packages/library-lab/entries/A12-react-konva/library.json) | 以真实输入、状态变化和结果解释React 19.3 声明式二维画布与编辑状态 | 源码/版本 |
| 25 | [A13 Three.js](../../../packages/library-lab/entries/A13-threejs/library.json) | 以真实输入、状态变化和结果解释WebGL 3D场景、动画循环、尺寸管理与显存回收的原生引擎实验 | 宿主/资源 |
| 26 | [A14 React Three Fiber](../../../packages/library-lab/entries/A14-react-three-fiber/library.json) | 以真实输入、状态变化和结果解释React19声明式三维场景、useFrame与可见性节能的实践 | 宿主/资源 |
| 27 | [A15 Leaflet](../../../packages/library-lab/entries/A15-leaflet/library.json) | 以真实输入、状态变化和结果解释无需远程底图的地点数据浏览、图层与地图交互 | 源码/版本 |
| 28 | [A16 MapLibre GL JS](../../../packages/library-lab/entries/A16-maplibre-gl-js/library.json) | 以真实输入、状态变化和结果解释无需瓦片服务的 WebGL GeoJSON 点层、过滤及生命周期实践 | 宿主/资源 |
| 29 | [A17 deck.gl](../../../packages/library-lab/entries/A17-deckgl/library.json) | 以真实输入、状态变化和结果解释无底图的GPU地理点图层，交互拾取、数据增量更新与Deck.finalize | 宿主/资源 |
| 30 | [B01 Motion for React](../../../packages/library-lab/entries/B01-motion-for-react/library.json) | 以真实输入、状态变化和结果解释React 入场/离场、列表布局过渡与减少动画偏好 | 源码/版本 |
| 31 | [B02 GSAP](../../../packages/library-lab/entries/B02-gsap/library.json) | 以真实输入、状态变化和结果解释有时间线、重播、反转与减少动画偏好控制的交互动画 | 源码/版本 |
| 32 | [B03 react-spring](../../../packages/library-lab/entries/B03-react-spring/library.json) | 以真实输入、状态变化和结果解释基于 spring 物理的 React 动画与列表进出场；局部减少动画兼容 | 源码/版本 |
| 33 | [B04 dotLottie 播放器](../../../packages/library-lab/entries/B04-dotlottie/library.json) | 以真实输入、状态变化和结果解释本地矢量动画、播放控制与减少动态效果 | 源码/版本 |
| 34 | [B05 Rive React Runtime](../../../packages/library-lab/entries/B05-rive-react/library.json) | 以真实输入、状态变化和结果解释Rive WebGL2 动画播放、可访问状态反馈和运行时生命周期 | 源码/版本 |
| 35 | [B06 Ant Design](../../../packages/library-lab/entries/B06-ant-design/library.json) | 以真实输入、状态变化和结果解释企业组件、受控表单、表格与反馈 | 源码/版本 |
| 36 | [B07 MUI](../../../packages/library-lab/entries/B07-mui/library.json) | 以真实输入、状态变化和结果解释Material UI 主题、表格、可访问弹窗与业务错误回填 | 源码/版本 |
| 37 | [B08 Mantine](../../../packages/library-lab/entries/B08-mantine/library.json) | 以真实输入、状态变化和结果解释主题控件、业务表格、模态编辑及 NumberInput 中间值校验 | 源码/版本 |
| 38 | [B10 Base UI](../../../packages/library-lab/entries/B10-base-ui/library.json) | 以真实输入、状态变化和结果解释无样式 Checkbox 的语义、混合态、授权禁用与真实 FormData | 源码/版本 |
| 39 | [B11 Radix Primitives](../../../packages/library-lab/entries/B11-radix-primitives/library.json) | 以真实输入、状态变化和结果解释DropdownMenu 原语的键盘、焦点、复选、单选与嵌套菜单实战 | 源码/版本 |
| 40 | [B12 React Aria](../../../packages/library-lab/entries/B12-react-aria/library.json) | 以真实输入、状态变化和结果解释React Aria Components ComboBox 的键盘、IME、ARIA 与异步建议实战 | 源码/版本 |
| 41 | [B14 Pragmatic drag and drop](../../../packages/library-lab/entries/B14-pragmatic-drag-and-drop/library.json) | 以真实输入、状态变化和结果解释原生DOM拖放适配器、drop targets、监视器与严格事件作用域 | 源码/版本 |
| 42 | [B15 react-grid-layout](../../../packages/library-lab/entries/B15-react-grid-layout/library.json) | 以真实输入、状态变化和结果解释可拖拽、缩放与响应式仪表盘布局（2.3.0 控制式接口） | 源码/版本 |
| 43 | [B16 react-resizable-panels](../../../packages/library-lab/entries/B16-react-resizable-panels/library.json) | 以真实输入、状态变化和结果解释可调整尺寸的面板布局 | 源码/版本 |
| 44 | [B18 cmdk](../../../packages/library-lab/entries/B18-cmdk/library.json) | 以真实输入、状态变化和结果解释可访问命令菜单、搜索分组与中文输入法快捷键 | 源码/版本 |
| 45 | [B19 Embla Carousel](../../../packages/library-lab/entries/B19-embla-carousel/library.json) | 以真实输入、状态变化和结果解释可访问的触控轮播、滑动吸附和动态卡片 | 源码/版本 |
| 46 | [B20 Sonner](../../../packages/library-lab/entries/B20-sonner/library.json) | 以真实输入、状态变化和结果解释即时通知和操作反馈 | 源码/版本 |
| 47 | [B21 react-motion（历史迁移）](../../../packages/library-lab/entries/B21-react-motion-migration/library.json) | 以真实输入、状态变化和结果解释从停滞的react-motion Motion/spring模式迁移至现代motion/react的状态驱动动画 | 迁移映射 |
| 48 | [B22 react-beautiful-dnd（历史迁移）](../../../packages/library-lab/entries/B22-react-beautiful-dnd-migration/library.json) | 以真实输入、状态变化和结果解释把废弃react-beautiful-dnd的Droppable/Draggable列表低风险迁移为React19兼容替代库 | 迁移映射 |
| 49 | [C02 Zod](../../../packages/library-lab/entries/C02-zod/library.json) | 以真实输入、状态变化和结果解释不可信 RSS / OPML JSON 校验、规范化与跨字段错误 | 源码/版本 |
| 50 | [C03 Valibot](../../../packages/library-lab/entries/C03-valibot/library.json) | 以真实输入、状态变化和结果解释模块化 Schema 验证、RSS 数据收窄与跨字段错误定位 | 源码/版本 |
| 51 | [C04 JSON Forms](../../../packages/library-lab/entries/C04-jsonforms/library.json) | 以真实输入、状态变化和结果解释通过 JSON Schema 与 UI Schema 构建可校验的业务表单 | 源码/版本 |
| 52 | [C05 Ajv](../../../packages/library-lab/entries/C05-ajv/library.json) | 以真实输入、状态变化和结果解释JSON Schema 编译验证、严格输入边界与条件规则 | 源码/版本 |
| 53 | [C06 IMask](../../../packages/library-lab/entries/C06-imask/library.json) | 以真实输入、状态变化和结果解释数字编号、金额和日期输入掩码；保留光标与中文 IME 边界 | 源码/版本 |
| 54 | [C08 AG Grid](../../../packages/library-lab/entries/C08-ag-grid/library.json) | 以真实输入、状态变化和结果解释企业级数据网格、稳定行身份与可控编辑 | 源码/版本 |
| 55 | [C09 React Virtuoso](../../../packages/library-lab/entries/C09-react-virtuoso/library.json) | 以真实输入、状态变化和结果解释自动测量变高列表、RSS分段加载与历史消息锚定 | 源码/版本 |
| 56 | [C10 TanStack Virtual](../../../packages/library-lab/entries/C10-tanstack-virtual/library.json) | 以真实输入、状态变化和结果解释Headless 列表虚拟化、变高测量与稳定业务键 | 源码/版本 |
| 57 | [C11 react-arborist](../../../packages/library-lab/entries/C11-react-arborist/library.json) | 以真实输入、状态变化和结果解释虚拟化树形 RSS 目录、稳定节点 ID、跨分组拖拽和中文搜索 | 源码/版本 |
| 58 | [C12 FullCalendar](../../../packages/library-lab/entries/C12-fullcalendar/library.json) | 以真实输入、状态变化和结果解释基于 React 的事件排程、日历视图与时区边界 | 源码/版本 |
| 59 | [C13 Frappe Gantt](../../../packages/library-lab/entries/C13-frappe-gantt/library.json) | 以真实输入、状态变化和结果解释交互式任务时间线、依赖关系和日期修改 | 宿主/资源 |
| 60 | [C14 date-fns](../../../packages/library-lab/entries/C14-date-fns/library.json) | 以真实输入、状态变化和结果解释函数式日期、日历天与 DST 时区运算 | 源码/版本 |
| 61 | [C15 Day.js](../../../packages/library-lab/entries/C15-dayjs/library.json) | 以真实输入、状态变化和结果解释不可变日期、严格校验与时区插件的 RSS 排程实践 | 源码/版本 |
| 62 | [C16 Luxon](../../../packages/library-lab/entries/C16-luxon/library.json) | 以真实输入、状态变化和结果解释DateTime、Interval 与明确 IANA 时区的日历窗口 | 源码/版本 |
| 63 | [C17 i18next](../../../packages/library-lab/entries/C17-i18next/library.json) | 以真实输入、状态变化和结果解释独立语言实例、命名空间、复数、插值和 fallback 的核心 i18n 工作坊 | 源码/版本 |
| 64 | [C18 react-i18next](../../../packages/library-lab/entries/C18-react-i18next/library.json) | 以真实输入、状态变化和结果解释React useTranslation、Trans 富文本与多工作区 I18nextProvider 隔离 | 源码/版本 |
| 65 | [C19 nuqs](../../../packages/library-lab/entries/C19-nuqs/library.json) | 以真实输入、状态变化和结果解释URL 搜索参数的类型安全状态、路由适配、push/replace 和 IME 约束 | 源码/版本 |
| 66 | [C21 tailwind-merge](../../../packages/library-lab/entries/C21-tailwind-merge/library.json) | 以真实输入、状态变化和结果解释Tailwind v4 工具类冲突合并与可覆盖组件实践 | 源码/版本 |
| 67 | [C22 Moment（历史迁移）](../../../packages/library-lab/entries/C22-moment-migration/library.json) | 以真实输入、状态变化和结果解释将历史 Moment 日期代码迁移到 date-fns、Day.js 与明确的时区模型 | 迁移映射 |
| 68 | [D01 es-toolkit](../../../packages/library-lab/entries/D01-es-toolkit/library.json) | 以真实输入、状态变化和结果解释轻量类型安全工具函数：RSS 排序、去重、分组和分页 | 源码/版本 |
| 69 | [D02 Lodash/lodash-es](../../../packages/library-lab/entries/D02-lodash/library.json) | 以真实输入、状态变化和结果解释现代集合去重、分组排序和可清理的输入防抖 | 源码/版本 |
| 70 | [D04 p-queue](../../../packages/library-lab/entries/D04-p-queue/library.json) | 以真实输入、状态变化和结果解释并发、滑动窗口限流与任务优先级调度 | 源码/版本 |
| 71 | [D05 decimal.js](../../../packages/library-lab/entries/D05-decimal-js/library.json) | 以真实输入、状态变化和结果解释从字符串到精确金额：decimal.js 的税率、舍入和对账边界 | 源码/版本 |
| 72 | [D06 Immer](../../../packages/library-lab/entries/D06-immer/library.json) | 以真实输入、状态变化和结果解释不可变嵌套更新、结构共享、Patch / inversePatches 乐观回滚 | 源码/版本 |
| 73 | [D08 Ky](../../../packages/library-lab/entries/D08-ky/library.json) | 以真实输入、状态变化和结果解释基于 Fetch 的 HTTP 客户端：重试、超时、响应校验与取消 | 源码/版本 |
| 74 | [D09 Axios](../../../packages/library-lab/entries/D09-axios/library.json) | 以真实输入、状态变化和结果解释HTTP 实例拦截器、取消、幂等请求重试与 409 失败分支 | 源码/版本 |
| 75 | [D10 Zustand](../../../packages/library-lab/entries/D10-zustand/library.json) | 以真实输入、状态变化和结果解释React19 vanilla store、租户状态与受控 persist 迁移 | 源码/版本 |
| 76 | [D11 Jotai](../../../packages/library-lab/entries/D11-jotai/library.json) | 以真实输入、状态变化和结果解释原子和派生状态、写入 atom、Provider Store 多租户隔离 | 源码/版本 |
| 77 | [D12 Redux Toolkit](../../../packages/library-lab/entries/D12-redux-toolkit/library.json) | 以真实输入、状态变化和结果解释createSlice/configureStore、团队状态隔离和响应竞态防护 | 源码/版本 |
| 78 | [D13 RTK Query](../../../packages/library-lab/entries/D13-rtk-query/library.json) | 以真实输入、状态变化和结果解释与 Redux Toolkit 集成的远端缓存、订阅和失效刷新 | 源码/版本 |
| 79 | [D14 XState](../../../packages/library-lab/entries/D14-xstate/library.json) | 以真实输入、状态变化和结果解释Actor 有限状态机：审稿流程、守卫和重试预算 | 源码/版本 |
| 80 | [D16 Workbox](../../../packages/library-lab/entries/D16-workbox/library.json) | 以真实输入、状态变化和结果解释隔离目录中的真实 Workbox precache 构建、公共 RSS 网络缓存策略与离线回退 | CLI产物 |
| 81 | [D17 Yjs](../../../packages/library-lab/entries/D17-yjs/library.json) | 以真实输入、状态变化和结果解释Y.Doc 双副本离线编辑、状态向量和 CRDT 增量合并 | 源码/版本 |
| 82 | [D18 Comlink](../../../packages/library-lab/entries/D18-comlink/library.json) | 以真实输入、状态变化和结果解释Web Worker RPC、Transferable 数据传递、回调代理与资源释放 | 宿主/资源 |
| 83 | [D19 Fuse.js](../../../packages/library-lab/entries/D19-fusejs/library.json) | 以真实输入、状态变化和结果解释浏览器端加权模糊搜索、分组过滤、IME 与动态索引重建 | 源码/版本 |
| 84 | [D20 MiniSearch](../../../packages/library-lab/entries/D20-minisearch/library.json) | 以真实输入、状态变化和结果解释本地全文倒排索引、前缀与拼写容错、查询建议和索引重建 | 源码/版本 |
| 85 | [D21 Pagefind](../../../packages/library-lab/entries/D21-pagefind/library.json) | 以真实输入、状态变化和结果解释真实 Pagefind Node API 为静态文章、RSS 笔记及 HTML 生成离线可部署索引 | CLI产物 |
| 86 | [E01 Tiptap](../../../packages/library-lab/entries/E01-tiptap/library.json) | 以真实输入、状态变化和结果解释ProseMirror 驱动的 Headless 富文本编辑器：工具栏、JSON 草稿与安全导入 | 源码/版本 |
| 87 | [E02 BlockNote](../../../packages/library-lab/entries/E02-blocknote/library.json) | 以真实输入、状态变化和结果解释开箱即用的块级文档编辑器：块结构、JSON 草稿与变更生命周期 | 源码/版本 |
| 88 | [E03 Lexical](../../../packages/library-lab/entries/E03-lexical/library.json) | 以真实输入、状态变化和结果解释结构化富文本编辑：真实 EditorState、React Composer、草稿 JSON 和格式命令 | 源码/版本 |
| 89 | [E04 CodeMirror 6](../../../packages/library-lab/entries/E04-codemirror6/library.json) | 以真实输入、状态变化和结果解释模块化源代码编辑器：真实 EditorState / EditorView、草稿恢复、可更新配置与卸载 | 源码/版本 |
| 90 | [E06 react-markdown](../../../packages/library-lab/entries/E06-react-markdown/library.json) | 以真实输入、状态变化和结果解释安全的 React Markdown 展示 | 源码/版本 |
| 91 | [E07 remark](../../../packages/library-lab/entries/E07-remark/library.json) | 以真实输入、状态变化和结果解释Markdown 结构化处理：真实 mdast 解析、GFM 规范化和危险链接审计 | 源码/版本 |
| 92 | [E08 rehype](../../../packages/library-lab/entries/E08-rehype/library.json) | 以真实输入、状态变化和结果解释HTML AST 转换与安全输出：rehype-sanitize 净化及沙箱预览 | 源码/版本 |
| 93 | [E09 Shiki](../../../packages/library-lab/entries/E09-shiki/library.json) | 以真实输入、状态变化和结果解释只读代码语法着色：按需 token 化，使用 React 文本节点安全渲染 | 源码/版本 |
| 94 | [E10 DOMPurify](../../../packages/library-lab/entries/E10-dompurify/library.json) | 以真实输入、状态变化和结果解释HTML 净化和输出安全 | 源码/版本 |
| 95 | [E12 assistant-ui](../../../packages/library-lab/entries/E12-assistant-ui/library.json) | 以真实输入、状态变化和结果解释真实 LocalRuntime 聊天原语、离线 Adapter、流式输出与取消 | 源码/版本 |
| 96 | [E13 PhotoSwipe](../../../packages/library-lab/entries/E13-photoswipe/library.json) | 以真实输入、状态变化和结果解释响应式图库灯箱：PhotoSwipe Lightbox、触控缩放、键盘关闭与实例销毁 | 源码/版本 |
| 97 | [E14 react-easy-crop](../../../packages/library-lab/entries/E14-react-easy-crop/library.json) | 以真实输入、状态变化和结果解释可拖拽缩放裁剪框、真实像素区域、PNG本地输出与文件资源清理 | 源码/版本 |
| 98 | [E15 pica](../../../packages/library-lab/entries/E15-pica/library.json) | 以真实输入、状态变化和结果解释浏览器本地高质量像素缩放与PNG导出：真实pica.resize/ toBlob | 源码/版本 |
| 99 | [E16 Video.js](../../../packages/library-lab/entries/E16-videojs-v10/library.json) | 以真实输入、状态变化和结果解释Video.js v10 React 真正播放器：原创WebM、本地切换、生命周期与跨版本迁移 | 宿主/资源 |
| 100 | [E17 hls.js](../../../packages/library-lab/entries/E17-hlsjs/library.json) | 以真实输入、状态变化和结果解释真实 HLS.js MSE引擎、清单与码率、致命错误与网络资源销毁 | 宿主/资源 |
| 101 | [E18 wavesurfer.js](../../../packages/library-lab/entries/E18-wavesurferjs8/library.json) | 以真实输入、状态变化和结果解释真实波形播放器与音频片段交互：本地合成WAV、播放位置、倍速缩放与销毁 | 宿主/资源 |
| 102 | [F01 Uppy](../../../packages/library-lab/entries/F01-uppy/library.json) | 以真实输入、状态变化和结果解释文件选择、限制、排队与本地预览：真实 Uppy Core，不使用假上传进度 | 源码/版本 |
| 103 | [F02 react-dropzone](../../../packages/library-lab/entries/F02-react-dropzone/library.json) | 以真实输入、状态变化和结果解释文件选择与拖放输入 | 源码/版本 |
| 104 | [F03 Papa Parse](../../../packages/library-lab/entries/F03-papaparse/library.json) | 以真实输入、状态变化和结果解释真实 CSV 解析/导出：引号换行、表头与URL验证、本地文件及公式注入防护 | 源码/版本 |
| 105 | [F04 ExcelJS](../../../packages/library-lab/entries/F04-exceljs/library.json) | 以真实输入、状态变化和结果解释Excel工作簿真实生成与读取：冻结表头、统计公式、RSS数据和不可信单元格处理 | CLI产物 |
| 106 | [F06 PDF.js](../../../packages/library-lab/entries/F06-pdfjs/library.json) | 以真实输入、状态变化和结果解释真正的 pdfjs-dist Worker、PDF 解析、Canvas 分页渲染和取消清理 | 宿主/资源 |
| 107 | [F07 react-pdf](../../../packages/library-lab/entries/F07-react-pdf/library.json) | 以真实输入、状态变化和结果解释React 组件化 PDF 阅读：本地文档、分页、TextLayer 与同版本 Worker | 宿主/资源 |
| 108 | [F08 @react-pdf/renderer](../../../packages/library-lab/entries/F08-react-pdf-renderer/library.json) | 以真实输入、状态变化和结果解释React组件声明式生成原生PDF：报告布局、分页文本、受控下载与链接生命周期 | 源码/版本 |
| 109 | [F09 pdf-lib](../../../packages/library-lab/entries/F09-pdf-lib/library.json) | 以真实输入、状态变化和结果解释浏览器真正创建、合并及标注 PDF，处理本地字节边界并释放对象 URL | 源码/版本 |
| 110 | [F10 Orval](../../../packages/library-lab/entries/F10-orval/library.json) | 以真实输入、状态变化和结果解释离线 OpenAPI 真实 Orval CLI 双次生成、React Query Hooks、标签分包与产物指纹验收 | CLI产物 |
| 111 | [F12 Vitest](../../../packages/library-lab/entries/F12-vitest/library.json) | 以真实输入、状态变化和结果解释真实 Vitest 测试配方：数据校验、可注入HTTP状态与取消竞态 | CLI产物 |
| 112 | [F13 Playwright](../../../packages/library-lab/entries/F13-playwright/library.json) | 以真实输入、状态变化和结果解释真实 Chromium E2E：语义定位、HTTP 场景矩阵与取消竞态（独立 CLI） | CLI产物 |
| 113 | [F14 Storybook](../../../packages/library-lab/entries/F14-storybook/library.json) | 以真实输入、状态变化和结果解释组件隔离开发、CSF Stories、Play交互断言与可访问性反馈 | CLI产物 |
| 114 | [F15 Knip](../../../packages/library-lab/entries/F15-knip/library.json) | 以真实输入、状态变化和结果解释检查 Monorepo 无用文件、导出及依赖：最小项目、业务入口与生产模式的真实 CLI 练习 | CLI产物 |
| 115 | [F16 dependency-cruiser](../../../packages/library-lab/entries/F16-dependency-cruiser/library.json) | 以真实输入、状态变化和结果解释源码级依赖图与架构边界约束：真实CLI检测跨层引用和循环依赖 | CLI产物 |
| 116 | [F17 axe-core](../../../packages/library-lab/entries/F17-axe-core/library.json) | 以真实输入、状态变化和结果解释真实 axe.run 局部审计，定位缺少alt/label/button-name并展示修复前后 | 源码/版本 |

## 阶段3实施细化 · F05 SheetJS

### 前置条件

已核实当前条目真实 Node 配方与已安装 xlsx；版本、原文来源、安全限制由独占工作者在本条目 local-validation.md 记录。保留 summary-only 来源，不伪造研究包原稿。

### 目标

从文章统计行数据得到 sheet、workbook、xlsx 字节，再读取字节验证业务数据；解释对象模型和导入校验的责任。

### 子任务

完整交付中文讲解、独立学习目标配方、正常源码、官方原文快照/官网状态、真实执行与六项复核；公共 CLI registry 缺口由主控评估，网页不增加 shell。

### 验收标准

运行声明的 basic/business/advanced/verify 固定配方，核对成功往返与负例的实际退出码和产物；SDK 与自建归档/验证政策分开，原文摘要与固定提交可核实；独立复核后才推进 content_done。

### 交付物

完整 F05 条目、local-validation.md、results/F05.md 及实际日志/工作簿产物。正式 SDK/build/browser 收据仍待独立授权与干净提交。

## 阶段4实施细化 · B09 shadcn/ui

### 前置条件

已读当前原创Button/CVA/Radix Slot、三场景及来源声明；锁定依赖由工作者核实。近期稳定候选期间只研究，主控释放后写独占目录。

### 目标

让工程师理解复制源码的所有权、变体类名生成与Slot组合，能定制并判断与官方分发源码的差异。

### 子任务

保留有效归档逻辑，精简重复维护反例；核实默认基座等时效断言；完整交付讲解、1–3个独立真实Demo、可迁移源码、官方原文及官网依据，独立复核。

### 验收标准

实际验证变体、class覆盖、原生disabled和Slot链接语义；归档状态可观察且资源正确清理。原文固定来源与实际自建代码分开；全部适用质量项通过才content_done。

### 交付物

完整B09条目、local-validation.md、results/B09.md及定向运行/浏览器记录；公共变更仍由主控处理。

## 阶段5实施细化 · A06 React Flow

### 前置条件

先读已有审批工作台、本地20项策略/5项浏览器及移动证据，保留全部未提交成果；核实12.12.0匹配官方资料与现有Handle/受控图接线。

### 目标

初用React Flow的工程师先掌握nodes/edges与图操作，再理解自建表单、发布快照和审批执行的职责边界。

### 子任务

补最小图编辑学习路径和官方资料，按1–3场景组织但保留现有审批入口与全部业务功能；同步讲解、源码、Agent及证据，修复后定向验证和独立复核。

### 验收标准

真实图拖动/连线与数据一致；既有表单/发布/工单及本地存储冲突功能保留。SDK与执行器不混称；README固定来源、官网状态和六项证据齐全。

### 交付物

A06增量条目、local-validation.md、results/A06.md及受影响测试；历史证据不重写，正式收据另记。

## 阶段7实施细化 · C01 React Hook Form

### 前置条件

实际7.89.0与现有register/field-array/服务端错误材料由独占工作者核实；保留field.id、输入快照、generation、AbortSignal和IME约束。共享候选期间仅研究。

### 目标

先让读者观察注册、错误和提交，再理解动态字段及异步业务错误如何保持身份对应。

### 子任务

完整整改中文讲解、独立Demo目标、真实源码、官方原文与官网依据；保持现有取消及回包身份防护，按受影响范围定向验证。

### 验收标准

真实RHF字段/错误/提交及动态行可操作；过期错误不映射新行；清理与迁移前提准确。六项独立复核和对应环境运行后才content_done。

### 交付物

完整C01条目、local-validation.md、results/C01.md及定向SDK/browser证据；正式收据另记。

## 阶段8实施细化 · D07 TanStack Query

### 前置条件

核实当前5.104.1真实QueryClient/fixture/取消与更新源码，保留本例创建的client所有权及行ID/token回滚。

### 目标

查询键如何共享缓存与请求，fresh/stale如何改变后台刷新，业务更新与取消分别由何种机制处理。

### 子任务

用1–3独立真实场景同步讲解/可迁移源码/官方固定README与官网状态，保留有效业务并定向验证及独立复核。

### 验收标准

浏览器能观察缓存/请求阶段及数据结果，取消和回滚不伤其他行；SDK与自建fixture边界准确，来源和六项真实证据齐全。

### 交付物

D07条目、local-validation.md、results/D07.md和受影响SDK/browser日志，正式记证仍待授权干净提交。

## 阶段6实施细化 · A01 ECharts

### 前置条件

已核实6.1.0、原图表与定时/可见性门禁，保留1200ms与120次上限、reduced-motion、隐藏/离屏暂停和清理。

### 目标

同一组七日指标从数据到option/轴/系列，再到真实图和表，观察同实例更新、系列移除及resize。

### 子任务

增量同步option builder、教学、独立Demo目标、固定官方原文/受限官网和真实运行；保持已有效生命周期。

### 验收标准

基础合计158，加5后163；notMerge移除旧series；容器resize不替换实例。SDK/策略与真实Canvas分别有证据，独立问题修复后才content_done。

### 交付物

A01条目、local-validation.md、results/A01.md、定向SDK及真实browser日志。

## 阶段9实施细化 · F11 MSW

### 前置条件

已核实实际Node配方及当前独立4320 session-scope runner；历史固定scope helper不冒充当前UI，公共协议/资产链由主控所有。

### 目标

追踪真实请求与handler匹配、422业务验证和恢复；区分SW控制client与handler匹配URL，明确MSW和Lab隔离宿主的职责。

### 子任务

保留真实200/422恢复/503一次性场景，整改中文主线、迁移源码与官方资料；保留ACK、preflight与本会话局部清理。

### 验收标准

真实Node及对应隔离浏览器请求执行，成功/失败/恢复可见；取消/清理不伤其他session；官方原文和六项独立证据完整，正式收据另记。

### 交付物

F11条目、local-validation.md、results/F11.md、Node/隔离浏览器证据及必要公共需求记录。

## 阶段10实施细化 · D03 p-limit

### 前置条件

7.3.3 rejectOnClear/active/pending/clearQueue真实源码已核实；保留原取消及清理。

### 目标

实际运行/排队/完成与实测峰值，再解释取消边界。

### 子任务

单库完整整改讲解、1–3独立目标、真实可迁移源码、官方固定原文/官网依据及定向检查，独立复核后验收。

### 验收标准

并发1/4真实峰值；正常6完成；失败与取消不伪装成功，旧回调不串场景；对应环境实际运行与六项证据齐全才content_done。

### 交付物

完整条目、local-validation.md、results/D03.md与对应命令/日志/产物。正式recorder另记。

## 阶段11实施细化 · B13 dnd-kit

### 前置条件

core6.3.1与sortable10.0.0分别固定来源；保留Pointer6px/Keyboard和现有锁。

### 目标

稳定身份的数组、排序和真实指针/键盘，锁与撤销。

### 子任务

单库完整整改讲解、1–3独立目标、真实可迁移源码、官方固定原文/官网依据及定向检查，独立复核后验收。

### 验收标准

隐藏尾部重复身份同样拒绝；真实排序/禁越锁/取消/撤销与完整数组一致；对应环境实际运行与六项证据齐全才content_done。

### 交付物

完整条目、local-validation.md、results/B13.md与对应命令/日志/产物。正式recorder另记。

## 阶段12实施细化 · C07 TanStack Table

### 前置条件

安装9.2.4为useTable/tableFeatures；保留rowId/selection/IME/identity+epoch与lease。

### 目标

原始数据到core/sorted/DOM，以及客户端和服务端分页职责。

### 子任务

单库完整整改讲解、1–3独立目标、真实可迁移源码、官方固定原文/官网依据及定向检查，独立复核后验收。

### 验收标准

数值排序和选择ID对应；客户端筛选6条分页5+1，服务端不二次切片，缩页/503与空态区分；对应环境实际运行与六项证据齐全才content_done。

### 交付物

完整条目、local-validation.md、results/C07.md与对应命令/日志/产物。正式recorder另记。

## 阶段13实施细化 · A10 tldraw

### 前置条件

已核实5.5.2编辑器/快照类型与正常SDK许可判定；不改环境或借用license key。

### 目标

画布编辑、自有document保存/恢复及只读边界。

### 子任务

完整单库整改中文教学、1–3独立真实目标、正常源码、官方固定原文/官网依据及分层验证；独立复核。

### 验收标准

保留原白板/下载/Blob清理，补loadSnapshot(document)并明确与会话状态不同；真实编辑/保存后改图/恢复/只读/卸载在合法本地环境验证。适用项有缺口不能content_done。

### 交付物

条目、local-validation.md、results/A10.md及实际日志/测试提案/剩余事项；正式收据另记。

## 阶段14实施细化 · B17 Floating UI

### 前置条件

核实0.27.20与旧p0焦点/IME；保留reference常挂载和浮层资源所有权。

### 目标

请求placement到真实flip/shift结果，业务浮层和键盘焦点。

### 子任务

完整单库整改中文教学、1–3独立真实目标、正常源码、官方固定原文/官网依据及分层验证；独立复核。

### 验收标准

使用真实useFloating/autoUpdate，碰撞容器/锚点变化可观察；关闭不无条件抢回已离开的焦点，清理与可迁移前提验证。适用项有缺口不能content_done。

### 交付物

条目、local-validation.md、results/B17.md及实际日志/测试提案/剩余事项；正式收据另记。

## 阶段15实施细化 · E19 ffmpeg.wasm

### 前置条件

wrapper0.12.15/core0.12.10及许可/资源门禁先核实，不设置已审标志或获取未授权核心。

### 目标

真实输入快照、转换参数、输出PCM及取消/清理。

### 子任务

完整单库整改中文教学、1–3独立真实目标、正常源码、官方固定原文/官网依据及分层验证；独立复核。

### 验收标准

可独立完成内容/官方原文及可迁移前提；核心资源未获许可供应时对应运行六项BLOCKED，类型/策略/Node不替代真实转码，记录解除条件。适用项有缺口不能content_done。

### 交付物

条目、local-validation.md、results/E19.md及实际日志/测试提案/剩余事项；正式收据另记。

## 阶段67实施细化 · C22 Moment迁移

### 前置条件

保留已实现三个实验；读取migration.mjs、现有SDK失败与补跑日志、固定Moment及替代库原文。

### 目标

让读者区分日历日、时间点和地区排程，并迁入实际依赖与插件。

### 子任务

补完整依赖、插件初始化、迁入文件与类型配置；复核既有六项SDK覆盖，补真实浏览器。

### 验收标准

有效/无效日期、回拨两个01:30、显示地区切换、春秋23/25小时与普通24小时均有对应证据；不把替代库运行称为Moment SDK PASS。

### 交付物

完整条目、local-validation.md、results/C22.md、独立复核与实际日志；正式收据按现有契约保留NOT_RUN。

## 阶段68实施细化 · D01 es-toolkit

### 前置条件

核对1.52.0实际array API、现有canonicalUrl与makeDigest、官方中文README候选。

### 目标

用一个完整RSS数据处理实验解释顺序和每步结果。

### 子任务

收敛为一个场景，展示规范化→排序→去重→分组→分页；保存官方中文原文、补迁入说明。

### 验收标准

用户能观察同URL保留最新、业务ID保留、无效输入拒绝与分页变化；源码展示来自运行源；SDK和浏览器结果对应。

### 交付物

完整条目、local-validation.md、results/D01.md、独立复核与实际日志；正式收据按现有契约保留NOT_RUN。

## 阶段69实施细化 · D02 Lodash

### 前置条件

核对固定lodash-es版本及现有集合/防抖源码；旧任务仅开始研究，不能视为已实现。

### 目标

分别理解集合处理的顺序语义和debounce生命周期。

### 子任务

拆为集合处理与防抖两个实验；外层保留提交观察结果，覆盖flush、cancel、IME与子组件卸载；官方资料与迁入指引齐全。

### 验收标准

通过真实浏览器观察取消/输入法组合/卸载后的回调数量；不以组件消失代替清理；六项完成后独立试用才推进状态。

### 交付物

完整条目、local-validation.md、results/D02.md、独立复核与实际日志；正式收据按现有契约保留NOT_RUN。

## 阶段70实施细化 · D04 p-queue

### 前置条件

读取当前metadata、guide、agent、examples、tests与verification；固定当前版本，不批量升级依赖。主控已核对当前实际实现与特殊规则。

### 目标

并发槽、严格启动窗口、暂停优先级和可结算取消；保留本地sleep fixture，不冒充外部HTTP。

### 子任务

核实API与来源；按实际独立目标保留或收敛1–3实验，补清楚的输入—处理—结果教学、完整迁入文件、固定官方原文与官网依据；实际SDK、浏览器与非作者试用。

### 验收标准

目标行为必须可操作并可观察；SDK、自建逻辑和fixture分清；六项适用门槛齐全才content_done，未跑部分保留NOT_RUN。

### 交付物

条目完整材料、local-validation.md、results/D04.md、独立复核、真实命令/日志；公共改动由主控处理。

## 阶段71实施细化 · D05 decimal.js

### 前置条件

读取当前metadata、guide、agent、examples、tests与verification；固定当前版本，不批量升级依赖。主控已核对当前实际实现与特殊规则。

### 目标

字符串金额与隔离Decimal构造器、行金额与单价舍入差异、错误及编辑后结果失效；业务税规则只为fixture。

### 子任务

核实API与来源；按实际独立目标保留或收敛1–3实验，补清楚的输入—处理—结果教学、完整迁入文件、固定官方原文与官网依据；实际SDK、浏览器与非作者试用。

### 验收标准

目标行为必须可操作并可观察；SDK、自建逻辑和fixture分清；六项适用门槛齐全才content_done，未跑部分保留NOT_RUN。

### 交付物

条目完整材料、local-validation.md、results/D05.md、独立复核、真实命令/日志；公共改动由主控处理。

## 阶段72实施细化 · D06 Immer

### 前置条件

读取当前metadata、guide、agent、examples、tests与verification；固定当前版本，不批量升级依赖。主控已核对当前实际实现与特殊规则。

### 目标

不可变更新、可观察引用共享、受控Patch回滚；保留takeUndo同步取inverse，禁止过期回滚覆盖新状态。

### 子任务

核实API与来源；按实际独立目标保留或收敛1–3实验，补清楚的输入—处理—结果教学、完整迁入文件、固定官方原文与官网依据；实际SDK、浏览器与非作者试用。

### 验收标准

目标行为必须可操作并可观察；SDK、自建逻辑和fixture分清；六项适用门槛齐全才content_done，未跑部分保留NOT_RUN。

### 交付物

条目完整材料、local-validation.md、results/D06.md、独立复核、真实命令/日志；公共改动由主控处理。

## 阶段73实施细化 · D08 Ky

### 前置条件

核对当前实际源码、特殊条目规则与固定依赖；复用有效实现，禁止修改共享依赖与宿主。

### 目标

保留真实Ky与本地可控transport，解释基本请求、取消/响应竞态、GET重试/超时/响应验证/体积边界；SDK能力和自建schema清楚区分。

### 子任务

按源码核实1–3独立实验，完善人/agent的选择、模型、完整迁入、错误和清理说明；固定官方原文与官网证据，真实SDK/浏览器与独立试用。

### 验收标准

操作与真实结果对应；六项适用门槛逐项通过；fixture、业务逻辑、SDK能力和未验证条件分开；公共验证遵守输入屏障。

### 交付物

条目材料、local-validation.md、results/D08.md、独立复核、可追溯原始日志，正式收据另记。

## 阶段74实施细化 · D09 Axios

### 前置条件

核对当前实际源码、特殊条目规则与固定依赖；复用有效实现，禁止修改共享依赖与宿主。

### 目标

真实Axios实例/拦截器与本地adapter，解释租户上下文、IME/取消竞态、有界幂等重试与409失败；不把自建重试当内建能力。

### 子任务

按源码核实1–3独立实验，完善人/agent的选择、模型、完整迁入、错误和清理说明；固定官方原文与官网证据，真实SDK/浏览器与独立试用。

### 验收标准

操作与真实结果对应；六项适用门槛逐项通过；fixture、业务逻辑、SDK能力和未验证条件分开；公共验证遵守输入屏障。

### 交付物

条目材料、local-validation.md、results/D09.md、独立复核、可追溯原始日志，正式收据另记。

## 阶段75实施细化 · D10 Zustand

### 前置条件

核对当前实际源码、特殊条目规则与固定依赖；复用有效实现，禁止修改共享依赖与宿主。

### 目标

真实vanilla store和选择性订阅，展示租户状态隔离、仅偏好persist与受控旧版本迁移；内存storage与浏览器持久化区别明确。

### 子任务

按源码核实1–3独立实验，完善人/agent的选择、模型、完整迁入、错误和清理说明；固定官方原文与官网证据，真实SDK/浏览器与独立试用。

### 验收标准

操作与真实结果对应；六项适用门槛逐项通过；fixture、业务逻辑、SDK能力和未验证条件分开；公共验证遵守输入屏障。

### 交付物

条目材料、local-validation.md、results/D10.md、独立复核、可追溯原始日志，正式收据另记。

## 阶段76实施细化 · D11 Jotai

### 前置条件

核对当前实际源码、特殊条目规则与固定依赖；复用有效实现，禁止修改共享依赖与宿主。

### 目标

原子配置与Store值的区别、派生/写atom、稳定ID与双Provider会话隔离；保留story-policy重复ID拒绝和keyed会话重建。

### 子任务

按源码核实1–3独立实验，完善人/agent的选择、模型、完整迁入、错误和清理说明；固定官方原文与官网证据，真实SDK/浏览器与独立试用。

### 验收标准

操作与真实结果对应；六项适用门槛逐项通过；fixture、业务逻辑、SDK能力和未验证条件分开；公共验证遵守输入屏障。

### 交付物

条目材料、local-validation.md、results/D11.md、独立复核、可追溯原始日志，正式收据另记。

## 阶段77实施细化 · D12 Redux Toolkit

### 前置条件

核对当前实际源码、特殊条目规则与固定依赖；复用有效实现，禁止修改共享依赖与宿主。

### 目标

真实createSlice/configureStore与React订阅，按团队隔离state、自建请求身份拒绝过期响应；明确fixture定时器不等同HTTP取消。

### 子任务

按源码核实1–3独立实验，完善人/agent的选择、模型、完整迁入、错误和清理说明；固定官方原文与官网证据，真实SDK/浏览器与独立试用。

### 验收标准

操作与真实结果对应；六项适用门槛逐项通过；fixture、业务逻辑、SDK能力和未验证条件分开；公共验证遵守输入屏障。

### 交付物

条目材料、local-validation.md、results/D12.md、独立复核、可追溯原始日志，正式收据另记。

## 阶段78实施细化 · D13 RTK Query

### 前置条件

核对当前实际源码、特殊条目规则与固定依赖；复用有效实现，禁止修改共享依赖与宿主。

### 目标

真实createApi缓存、订阅和租户标签失效；currentData避免旧参数数据、mutation取消/竞态和reset清理，内存baseQuery不冒充外部后端。

### 子任务

按源码核实1–3独立实验，完善人/agent的选择、模型、完整迁入、错误和清理说明；固定官方原文与官网证据，真实SDK/浏览器与独立试用。

### 验收标准

操作与真实结果对应；六项适用门槛逐项通过；fixture、业务逻辑、SDK能力和未验证条件分开；公共验证遵守输入屏障。

### 交付物

条目材料、local-validation.md、results/D13.md、独立复核、可追溯原始日志，正式收据另记。

## 阶段79实施细化 · D14 XState

### 前置条件

核对当前实际源码、特殊条目规则与固定依赖；复用有效实现，禁止修改共享依赖与宿主。

### 目标

真实Actor状态/context/event与guard，拒绝原因校验和重试预算，unsubscribe/stop所有权；避免仅UI禁用代替业务合法性。

### 子任务

按源码核实1–3独立实验，完善人/agent的选择、模型、完整迁入、错误和清理说明；固定官方原文与官网证据，真实SDK/浏览器与独立试用。

### 验收标准

操作与真实结果对应；六项适用门槛逐项通过；fixture、业务逻辑、SDK能力和未验证条件分开；公共验证遵守输入屏障。

### 交付物

条目材料、local-validation.md、results/D14.md、独立复核、可追溯原始日志，正式收据另记。

## 阶段80实施细化 · D16 Workbox

### 前置条件

核对当前实际源码、特殊条目规则与固定依赖；复用有效实现，禁止修改共享依赖与宿主。

### 目标

只在Node隔离目录真实生成precache/runtime规则/离线fallback产物；教学、实际CLI日志与产物对应，不注册Lab SW、不把生成证明离线运行。

### 子任务

按源码核实1–3独立实验，完善人/agent的选择、模型、完整迁入、错误和清理说明；固定官方原文与官网证据，真实SDK/浏览器与独立试用。

### 验收标准

操作与真实结果对应；六项适用门槛逐项通过；fixture、业务逻辑、SDK能力和未验证条件分开；公共验证遵守输入屏障。

### 交付物

条目材料、local-validation.md、results/D16.md、独立复核、可追溯原始日志，正式收据另记。

## 阶段81实施细化 · D17 Yjs

### 前置条件

核对当前实际源码、特殊条目规则与固定依赖；复用有效实现，禁止修改共享依赖与宿主。

### 目标

真实本地Y.Doc双副本、事务、state vector增量及重复投递/并发键收敛；生命周期destroy和自建envelope边界，不连接协作服务。

### 子任务

按源码核实1–3独立实验，完善人/agent的选择、模型、完整迁入、错误和清理说明；固定官方原文与官网证据，真实SDK/浏览器与独立试用。

### 验收标准

操作与真实结果对应；六项适用门槛逐项通过；fixture、业务逻辑、SDK能力和未验证条件分开；公共验证遵守输入屏障。

### 交付物

条目材料、local-validation.md、results/D17.md、独立复核、可追溯原始日志，正式收据另记。

## 阶段82实施细化 · D18 Comlink

### 前置条件

核对当前实际源码、特殊条目规则与固定依赖；复用有效实现，禁止修改共享依赖与宿主。

### 目标

真实Worker Comlink RPC、transfer buffer所有权、proxy回调、错误/epoch、releaseProxy与terminate清理；不得主线程伪造Worker输出。

### 子任务

按源码核实1–3独立实验，完善人/agent的选择、模型、完整迁入、错误和清理说明；固定官方原文与官网证据，真实SDK/浏览器与独立试用。

### 验收标准

操作与真实结果对应；六项适用门槛逐项通过；fixture、业务逻辑、SDK能力和未验证条件分开；公共验证遵守输入屏障。

### 交付物

条目材料、local-validation.md、results/D18.md、独立复核、可追溯原始日志，正式收据另记。

## 阶段83实施细化 · D19 Fuse.js

### 前置条件

核对当前实际源码、特殊条目规则与固定依赖；复用有效实现，禁止修改共享依赖与宿主。

### 目标

真实加权模糊检索分数/阈值、输入法与分类范围、稳定ID新增替换删除触发索引更新；分类不是ACL，文本结果不注入HTML。

### 子任务

按源码核实1–3独立实验，完善人/agent的选择、模型、完整迁入、错误和清理说明；固定官方原文与官网证据，真实SDK/浏览器与独立试用。

### 验收标准

操作与真实结果对应；六项适用门槛逐项通过；fixture、业务逻辑、SDK能力和未验证条件分开；公共验证遵守输入屏障。

### 交付物

条目材料、local-validation.md、results/D19.md、独立复核、可追溯原始日志，正式收据另记。

## 阶段84实施细化 · D20 MiniSearch

### 前置条件

核对当前实际源码、特殊条目规则与固定依赖；复用有效实现，禁止修改共享依赖与宿主。

### 目标

真实全文索引/相关分数、prefix与fuzzy、同范围autoSuggest和动态文档更新；解释中文分词限制，不将浏览器分类当授权。

### 子任务

按源码核实1–3独立实验，完善人/agent的选择、模型、完整迁入、错误和清理说明；固定官方原文与官网证据，真实SDK/浏览器与独立试用。

### 验收标准

操作与真实结果对应；六项适用门槛逐项通过；fixture、业务逻辑、SDK能力和未验证条件分开；公共验证遵守输入屏障。

### 交付物

条目材料、local-validation.md、results/D20.md、独立复核、可追溯原始日志，正式收据另记。

## 阶段85实施细化 · D21 Pagefind

### 前置条件

核对当前实际源码、特殊条目规则与固定依赖；复用有效实现，禁止修改共享依赖与宿主。

### 目标

真实Pagefind Node原生索引、公开HTML/custom record/directory和getFiles/writeFiles产物；清楚区分生成与访客search，权限在生成前，不读取私密资料。

### 子任务

按源码核实1–3独立实验，完善人/agent的选择、模型、完整迁入、错误和清理说明；固定官方原文与官网证据，真实SDK/浏览器与独立试用。

### 验收标准

操作与真实结果对应；六项适用门槛逐项通过；fixture、业务逻辑、SDK能力和未验证条件分开；公共验证遵守输入屏障。

### 交付物

条目材料、local-validation.md、results/D21.md、独立复核、可追溯原始日志，正式收据另记。

## 阶段86实施细化 · E01 Tiptap

### 前置条件

核对当前实际源码、特殊条目规则与固定依赖；复用有效实现，禁止修改共享依赖与宿主。

### 目标

真实Tiptap headless编辑/格式/撤销、结构化草稿与受控JSON恢复；完整StarterKit配置、Schema与snapshot-policy边界、存储错误和卸载订阅清理。

### 子任务

按源码核实1–3独立实验，完善人/agent的选择、模型、完整迁入、错误和清理说明；固定官方原文与官网证据，真实SDK/浏览器与独立试用。

### 验收标准

操作与真实结果对应；六项适用门槛逐项通过；fixture、业务逻辑、SDK能力和未验证条件分开；公共验证遵守输入屏障。

### 交付物

条目材料、local-validation.md、results/E01.md、独立复核、可追溯原始日志，正式收据另记。

## 阶段87实施细化 · E02 BlockNote

### 前置条件

核对当前实际源码、特殊条目规则与固定依赖；复用有效实现，禁止修改共享依赖与宿主。

### 目标

真实BlockNote块编辑/菜单、会话草稿、insertBlocks及有限安全恢复；完整Mantine/CSS字体迁入、块ID策略、IME及hook生命周期，商业扩展与上传不混入。

### 子任务

按源码核实1–3独立实验，完善人/agent的选择、模型、完整迁入、错误和清理说明；固定官方原文与官网证据，真实SDK/浏览器与独立试用。

### 验收标准

操作与真实结果对应；六项适用门槛逐项通过；fixture、业务逻辑、SDK能力和未验证条件分开；公共验证遵守输入屏障。

### 交付物

条目材料、local-validation.md、results/E02.md、独立复核、可追溯原始日志，正式收据另记。

## 阶段88实施细化 · E03 Lexical

### 前置条件

核对当前实际源码、特殊条目规则与固定依赖；复用有效实现，禁止修改共享依赖与宿主。

### 目标

真实Lexical EditorState与read/update、结构化草稿/节点恢复、选区格式和history；IME与序列化边界、插件订阅/卸载清理，拒绝恢复不覆盖当前文档。

### 子任务

按源码核实1–3独立实验，完善人/agent的选择、模型、完整迁入、错误和清理说明；固定官方原文与官网证据，真实SDK/浏览器与独立试用。

### 验收标准

操作与真实结果对应；六项适用门槛逐项通过；fixture、业务逻辑、SDK能力和未验证条件分开；公共验证遵守输入屏障。

### 交付物

条目材料、local-validation.md、results/E03.md、独立复核、可追溯原始日志，正式收据另记。

## 阶段89实施细化 · E04 CodeMirror 6

### 前置条件

核对当前实际源码、特殊条目规则与固定依赖；复用有效实现，禁止修改共享依赖与宿主。

### 目标

真实CodeMirror EditorState事务/EditorView、会话草稿、Compartment只读重配置及destroy；说明只读限制用户编辑而非程序dispatch，真实DOM与纯State分开验证。

### 子任务

按源码核实1–3独立实验，完善人/agent的选择、模型、完整迁入、错误和清理说明；固定官方原文与官网证据，真实SDK/浏览器与独立试用。

### 验收标准

操作与真实结果对应；六项适用门槛逐项通过；fixture、业务逻辑、SDK能力和未验证条件分开；公共验证遵守输入屏障。

### 交付物

条目材料、local-validation.md、results/E04.md、独立复核、可追溯原始日志，正式收据另记。

## 阶段90实施细化 · E06 react-markdown

### 前置条件

核对当前实际源码、特殊条目规则与固定依赖；复用有效实现，禁止修改共享依赖与宿主。

### 目标

真实react-markdown React元素渲染/GFM与不可信输入策略；skipHtml/urlTransform/rehype-sanitize/自定义图片占位职责明确，XSS和外链请求有浏览器证据。

### 子任务

按源码核实1–3独立实验，完善人/agent的选择、模型、完整迁入、错误和清理说明；固定官方原文与官网证据，真实SDK/浏览器与独立试用。

### 验收标准

操作与真实结果对应；六项适用门槛逐项通过；fixture、业务逻辑、SDK能力和未验证条件分开；公共验证遵守输入屏障。

### 交付物

条目材料、local-validation.md、results/E06.md、独立复核、可追溯原始日志，正式收据另记。

## 阶段91实施细化 · E07 remark

### 前置条件

核对当前实际源码、特殊条目规则与固定依赖；复用有效实现，禁止修改共享依赖与宿主。

### 目标

真实remark mdast解析/序列化、GFM与自建审计；同一AST供分析和stringify，审计不当sanitizer，字节/字符上限单位一致。

### 子任务

按源码核实1–3独立实验，完善人/agent的选择、模型、完整迁入、错误和清理说明；固定官方原文与官网证据，真实SDK/浏览器与独立试用。

### 验收标准

操作与真实结果对应；六项适用门槛逐项通过；fixture、业务逻辑、SDK能力和未验证条件分开；公共验证遵守输入屏障。

### 交付物

条目材料、local-validation.md、results/E07.md、独立复核、可追溯原始日志，正式收据另记。

## 阶段92实施细化 · E08 rehype

### 前置条件

核对当前实际源码、特殊条目规则与固定依赖；复用有效实现，禁止修改共享依赖与宿主。

### 目标

真实rehype HAST净化后序列化、严格schema与隔离iframe；消除导航/网络与脚本，SDK净化、sandbox和CSP职责分开，真实XSS网络证据。

### 子任务

按源码核实1–3独立实验，完善人/agent的选择、模型、完整迁入、错误和清理说明；固定官方原文与官网证据，真实SDK/浏览器与独立试用。

### 验收标准

操作与真实结果对应；六项适用门槛逐项通过；fixture、业务逻辑、SDK能力和未验证条件分开；公共验证遵守输入屏障。

### 交付物

条目材料、local-validation.md、results/E08.md、独立复核、可追溯原始日志，正式收据另记。

## 阶段93实施细化 · E09 Shiki

### 前置条件

核对当前实际源码、特殊条目规则与固定依赖；复用有效实现，禁止修改共享依赖与宿主。

### 目标

真实Shiki codeToTokens、语言选择与文本节点着色，异步输入竞态/160ms定时清理及不可信代码只显示；主题与可见控件描述必须一致。

### 子任务

按源码核实1–3独立实验，完善人/agent的选择、模型、完整迁入、错误和清理说明；固定官方原文与官网证据，真实SDK/浏览器与独立试用。

### 验收标准

操作与真实结果对应；六项适用门槛逐项通过；fixture、业务逻辑、SDK能力和未验证条件分开；公共验证遵守输入屏障。

### 交付物

条目材料、local-validation.md、results/E09.md、独立复核、可追溯原始日志，正式收据另记。

## 阶段94实施细化 · E10 DOMPurify

### 前置条件

核对当前实际源码、特殊条目规则与固定依赖；复用有效实现，禁止修改共享依赖与宿主。

### 目标

真实DOMPurify按受限HTML允许列表净化后插入DOM；HTML profile与ALLOW标签不互相覆盖，XSS/危险协议/远程资源行为实证，不把配置策略当SDK。

### 子任务

按源码核实1–3独立实验，完善人/agent的选择、模型、完整迁入、错误和清理说明；固定官方原文与官网证据，真实SDK/浏览器与独立试用。

### 验收标准

操作与真实结果对应；六项适用门槛逐项通过；fixture、业务逻辑、SDK能力和未验证条件分开；公共验证遵守输入屏障。

### 交付物

条目材料、local-validation.md、results/E10.md、独立复核、可追溯原始日志，正式收据另记。

## 阶段95实施细化 · E12 assistant-ui

### 前置条件

核对当前实际源码、特殊条目规则与固定依赖；复用有效实现，禁止修改共享依赖与宿主。

### 目标

真实assistant-ui local runtime与primitives，本地adapter由最近user输入驱动、累计流式yield；取消/卸载AbortSignal和timer实际清理，不冒称模型回答或云端验收。

### 子任务

按源码核实1–3独立实验，完善人/agent的选择、模型、完整迁入、错误和清理说明；固定官方原文与官网证据，真实SDK/浏览器与独立试用。

### 验收标准

操作与真实结果对应；六项适用门槛逐项通过；fixture、业务逻辑、SDK能力和未验证条件分开；公共验证遵守输入屏障。

### 交付物

条目材料、local-validation.md、results/E12.md、独立复核、可追溯原始日志，正式收据另记。

## 阶段96实施细化 · E13 PhotoSwipe

### 前置条件

核对当前实际源码、特殊条目规则与固定依赖；复用有效实现，禁止修改共享依赖与宿主。

### 目标

真实PhotoSwipe按需灯箱、显式图像尺寸、键盘焦点回归、动态撤项与destroy；原创data SVG fixture和业务policy分开，事件/实例清理实证。

### 子任务

按源码核实1–3独立实验，完善人/agent的选择、模型、完整迁入、错误和清理说明；固定官方原文与官网证据，真实SDK/浏览器与独立试用。

### 验收标准

操作与真实结果对应；六项适用门槛逐项通过；fixture、业务逻辑、SDK能力和未验证条件分开；公共验证遵守输入屏障。

### 交付物

条目材料、local-validation.md、results/E13.md、独立复核、可追溯原始日志，正式收据另记。

## 阶段97实施细化 · E14 react-easy-crop

### 前置条件

核对当前实际源码、特殊条目规则与固定依赖；复用有效实现，禁止修改共享依赖与宿主。

### 目标

真实react-easy-crop回调与像素区域/Canvas导出，方形与16:9及本地文件；修复文件检查期间拖动/缩放递增共用generation令checkingFile无法清除的竞态；解码后尺寸预算/CORS与对象URL回收，不声称取消在途编码。

### 子任务

按源码核实1–3独立实验，完善人/agent的选择、模型、完整迁入、错误和清理说明；固定官方原文与官网证据，真实SDK/浏览器与独立试用。

### 验收标准

操作与真实结果对应；六项适用门槛逐项通过；fixture、业务逻辑、SDK能力和未验证条件分开；公共验证遵守输入屏障。

### 交付物

条目材料、local-validation.md、results/E14.md、独立复核、可追溯原始日志，正式收据另记。

## 阶段98实施细化 · E15 pica

### 前置条件

核对当前实际源码、特殊条目规则与固定依赖；复用有效实现，禁止修改共享依赖与宿主。

### 目标

真实pica10工厂resize/toBlob、像素预算及原生Canvas对照，cancelToken与已开始编码的代次保护、worker/CSP和对象URL所有权。

### 子任务

按源码核实1–3独立实验，完善人/agent的选择、模型、完整迁入、错误和清理说明；固定官方原文与官网证据，真实SDK/浏览器与独立试用。

### 验收标准

操作与真实结果对应；六项适用门槛逐项通过；fixture、业务逻辑、SDK能力和未验证条件分开；公共验证遵守输入屏障。

### 交付物

条目材料、local-validation.md、results/E15.md、独立复核、可追溯原始日志，正式收据另记。

## 阶段99实施细化 · E16 Video.js

### 前置条件

核对当前实际源码、特殊条目规则与固定依赖；复用有效实现，禁止修改共享依赖与宿主。

### 目标

真实@videojs/react10播放器、原创Canvas/MediaRecorder WebM及源切换/本地导入；头部校验/代次、轨道停止/录制取消、媒体实例及Blob URL释放。

### 子任务

按源码核实1–3独立实验，完善人/agent的选择、模型、完整迁入、错误和清理说明；固定官方原文与官网证据，真实SDK/浏览器与独立试用。

### 验收标准

操作与真实结果对应；六项适用门槛逐项通过；fixture、业务逻辑、SDK能力和未验证条件分开；公共验证遵守输入屏障。

### 交付物

条目材料、local-validation.md、results/E16.md、独立复核、可追溯原始日志，正式收据另记。

## 阶段100实施细化 · E17 hls.js

### 前置条件

核对当前实际源码、特殊条目规则与固定依赖；复用有效实现，禁止修改共享依赖与宿主。

### 目标

真实hls.js1.7.3用户触发MSE清单与质量控制、外部测试源和错误边界，native fallback不是SDK；fatal/重试/stop/卸载destroy与媒体清理实证，关闭Worker不声称Worker销毁。

### 子任务

按源码核实1–3独立实验，完善人/agent的选择、模型、完整迁入、错误和清理说明；固定官方原文与官网证据，真实SDK/浏览器与独立试用。

### 验收标准

操作与真实结果对应；六项适用门槛逐项通过；fixture、业务逻辑、SDK能力和未验证条件分开；公共验证遵守输入屏障。

### 交付物

条目材料、local-validation.md、results/E17.md、独立复核、可追溯原始日志，正式收据另记。

## 阶段101实施细化 · E18 wavesurfer.js

### 前置条件

核对当前实际源码、特殊条目规则与固定依赖；复用有效实现，禁止修改共享依赖与宿主。

### 目标

真实wavesurfer8.0.3与原创1.6秒PCM WAV，decode/波形/播放/定位/倍速缩放独立目标；完整wav迁入、事件解绑、destroy/Abort与BlobURL回收，时长来源一致。

### 子任务

按源码核实1–3独立实验，完善人/agent的选择、模型、完整迁入、错误和清理说明；固定官方原文与官网证据，真实SDK/浏览器与独立试用。

### 验收标准

操作与真实结果对应；六项适用门槛逐项通过；fixture、业务逻辑、SDK能力和未验证条件分开；公共验证遵守输入屏障。

### 交付物

条目材料、local-validation.md、results/E18.md、独立复核、可追溯原始日志，正式收据另记。

## 阶段102实施细化 · F01 Uppy

### 前置条件

核对当前实际源码、特殊条目规则与固定依赖；复用有效实现，禁止修改共享依赖与宿主。

### 目标

真实Uppy6.1.0本地文件队列、限制/部分接受/重复与有界文本预览，区分core与未装上传插件；remove/clear/换层/卸载的预览代次和真实SDK事件销毁，不冒称上传。

### 子任务

按源码核实1–3独立实验，完善人/agent的选择、模型、完整迁入、错误和清理说明；固定官方原文与官网证据，真实SDK/浏览器与独立试用。

### 验收标准

操作与真实结果对应；六项适用门槛逐项通过；fixture、业务逻辑、SDK能力和未验证条件分开；公共验证遵守输入屏障。

### 交付物

条目材料、local-validation.md、results/F01.md、独立复核、可追溯原始日志，正式收据另记。

## 阶段103实施细化 · F02 react-dropzone

### 前置条件

核对当前实际源码、特殊条目规则与固定依赖；复用有效实现，禁止修改共享依赖与宿主。

### 目标

真实react-dropzone20选择/拖放/键盘及拒绝code，应用受限文本预览与epoch；稳定文件身份避免同名同size key碰撞，不冒称上传/安全扫描，清理真实浏览器验证。

### 子任务

按源码核实1–3独立实验，完善人/agent的选择、模型、完整迁入、错误和清理说明；固定官方原文与官网证据，真实SDK/浏览器与独立试用。

### 验收标准

操作与真实结果对应；六项适用门槛逐项通过；fixture、业务逻辑、SDK能力和未验证条件分开；公共验证遵守输入屏障。

### 交付物

条目材料、local-validation.md、results/F02.md、独立复核、可追溯原始日志，正式收据另记。

## 阶段104实施细化 · F03 Papa Parse

### 前置条件

核对当前实际源码、特殊条目规则与固定依赖；复用有效实现，禁止修改共享依赖与宿主。

### 目标

真实Papa Parse5.7 CSV引号/换行解析及安全unparse，重复表头/字段数/未闭合引号与业务URL去重分层；文件/文本预算、UTF8和迟到读取清理，无Worker/远程下载。

### 子任务

按源码核实1–3独立实验，完善人/agent的选择、模型、完整迁入、错误和清理说明；固定官方原文与官网证据，真实SDK/浏览器与独立试用。

### 验收标准

操作与真实结果对应；六项适用门槛逐项通过；fixture、业务逻辑、SDK能力和未验证条件分开；公共验证遵守输入屏障。

### 交付物

条目材料、local-validation.md、results/F03.md、独立复核、可追溯原始日志，正式收据另记。

## 阶段105实施细化 · F04 ExcelJS

### 前置条件

核对当前实际源码、特殊条目规则与固定依赖；复用有效实现，禁止修改共享依赖与宿主。

### 目标

真实Node ExcelJS4.4内存xlsx生成/读回，样式冻结/公式缓存与数值文本边界；policy预校验、独立consumer/CLI产物，不把缓存值称计算或浏览器命令展示称SDK执行。

### 子任务

按源码核实1–3独立实验，完善人/agent的选择、模型、完整迁入、错误和清理说明；固定官方原文与官网证据，真实SDK/浏览器与独立试用。

### 验收标准

操作与真实结果对应；六项适用门槛逐项通过；fixture、业务逻辑、SDK能力和未验证条件分开；公共验证遵守输入屏障。

### 交付物

条目材料、local-validation.md、results/F04.md、独立复核、可追溯原始日志，正式收据另记。

## 阶段106实施细化 · F06 PDF.js

### 前置条件

核对当前实际源码、特殊条目规则与固定依赖；复用有效实现，禁止修改共享依赖与宿主。

### 目标

真实PDF.js6.3.289本地Worker读取原创PDF、Canvas页码/缩放/像素预算与文字抽取非OCR；render cancel序列化/loading destroy/探测与原件保护，完整fixture/预算/gate迁入。

### 子任务

按源码核实1–3独立实验，完善人/agent的选择、模型、完整迁入、错误和清理说明；固定官方原文与官网证据，真实SDK/浏览器与独立试用。

### 验收标准

操作与真实结果对应；六项适用门槛逐项通过；fixture、业务逻辑、SDK能力和未验证条件分开；公共验证遵守输入屏障。

### 交付物

条目材料、local-validation.md、results/F06.md、独立复核、可追溯原始日志，正式收据另记。

## 阶段107实施细化 · F07 react-pdf

### 前置条件

核对当前实际源码、特殊条目规则与固定依赖；复用有效实现，禁止修改共享依赖与宿主。

### 目标

真实react-pdf11与同版本PDF.js6.3.289 Worker，React Document/Page/文字层/缩放及本地文件错误恢复；payload副本防transfer耗尽state、任务销毁与迟到读取，明确页面像素预算边界。

### 子任务

按源码核实1–3独立实验，完善人/agent的选择、模型、完整迁入、错误和清理说明；固定官方原文与官网证据，真实SDK/浏览器与独立试用。

### 验收标准

操作与真实结果对应；六项适用门槛逐项通过；fixture、业务逻辑、SDK能力和未验证条件分开；公共验证遵守输入屏障。

### 交付物

条目材料、local-validation.md、results/F07.md、独立复核、可追溯原始日志，正式收据另记。

## 阶段108实施细化 · F08 @react-pdf/renderer

### 前置条件

核对当前实际源码、特殊条目规则与固定依赖；复用有效实现，禁止修改共享依赖与宿主。

### 目标

真实react-pdf renderer4.9生成ASCII报表PDF，1页/多页与有限输入；pdf().toBlob单飞/epoch/对象URL回收、完整report/字体依赖迁入，实际PDF页数/内容和分页可视证据，不当阅读器。

### 子任务

按源码核实1–3独立实验，完善人/agent的选择、模型、完整迁入、错误和清理说明；固定官方原文与官网证据，真实SDK/浏览器与独立试用。

### 验收标准

操作与真实结果对应；六项适用门槛逐项通过；fixture、业务逻辑、SDK能力和未验证条件分开；公共验证遵守输入屏障。

### 交付物

条目材料、local-validation.md、results/F08.md、独立复核、可追溯原始日志，正式收据另记。

## 阶段109实施细化 · F09 pdf-lib

### 前置条件

核对当前实际源码、特殊条目规则与固定依赖；复用有效实现，禁止修改共享依赖与宿主。

### 目标

真实pdf-lib1.17.1创建/合并/本地PDF标注；输入页数/字节/字体边界、单飞gate和迟到字节/URL清理，原创PDF实际产物核验，区别编辑与阅读/安全净化。

### 子任务

按源码核实1–3独立实验，完善人/agent的选择、模型、完整迁入、错误和清理说明；固定官方原文与官网证据，真实SDK/浏览器与独立试用。

### 验收标准

操作与真实结果对应；六项适用门槛逐项通过；fixture、业务逻辑、SDK能力和未验证条件分开；公共验证遵守输入屏障。

### 交付物

条目材料、local-validation.md、results/F09.md、独立复核、可追溯原始日志，正式收据另记。

## 阶段110实施细化 · F10 Orval

### 前置条件

核对当前实际源码、特殊条目规则与固定依赖；复用有效实现，禁止修改共享依赖与宿主。

### 目标

真实Orval8.44.0本地OpenAPI生成Fetch/ReactQuery/tag模块，两次一致和实际tsc；完整契约/config/run/verify迁入，路径清理仅自有输出、生成类型不冒称运行时校验。

### 子任务

按源码核实1–3独立实验，完善人/agent的选择、模型、完整迁入、错误和清理说明；固定官方原文与官网证据，真实SDK/浏览器与独立试用。

### 验收标准

操作与真实结果对应；六项适用门槛逐项通过；fixture、业务逻辑、SDK能力和未验证条件分开；公共验证遵守输入屏障。

### 交付物

条目材料、local-validation.md、results/F10.md、独立复核、可追溯原始日志，正式收据另记。

## 阶段111实施细化 · F12 Vitest

### 前置条件

核对当前实际源码、特殊条目规则与固定依赖；复用有效实现，禁止修改共享依赖与宿主。

### 目标

真实Vitest5.0.5 CLI运行规范化/HTTP注入矩阵/计时取消与过期结果；完整隔离config与迁入源码，SDK runner和业务mock/fake timers边界，报告与测试数对应。

### 子任务

按源码核实1–3独立实验，完善人/agent的选择、模型、完整迁入、错误和清理说明；固定官方原文与官网证据，真实SDK/浏览器与独立试用。

### 验收标准

操作与真实结果对应；六项适用门槛逐项通过；fixture、业务逻辑、SDK能力和未验证条件分开；公共验证遵守输入屏障。

### 交付物

条目材料、local-validation.md、results/F12.md、独立复核、可追溯原始日志，正式收据另记。

## 阶段112实施细化 · F13 Playwright

### 前置条件

核对当前实际源码、特殊条目规则与固定依赖；复用有效实现，禁止修改共享依赖与宿主。

### 目标

真实Playwright1.64 Chromium交互、隔离config、route fixture成功/失败/取消/迟到及finally；区分浏览器请求模拟和真实后端，完整迁入。

### 子任务

按源码核实1–3独立实验，完善人/agent的选择、模型、完整迁入、错误和清理说明；固定官方原文与官网证据，真实SDK/浏览器与独立试用。

### 验收标准

操作与真实结果对应；六项适用门槛逐项通过；fixture、业务逻辑、SDK能力和未验证条件分开；公共验证遵守输入屏障。

### 交付物

条目材料、local-validation.md、results/F13.md、独立复核、可追溯原始日志，正式收据另记。

## 阶段113实施细化 · F14 Storybook

### 前置条件

核对当前实际源码、特殊条目规则与固定依赖；复用有效实现，禁止修改共享依赖与宿主。

### 目标

真实Storybook10.6 CSF args/异步保存交互play/a11y和静态构建；独立config/CSS/故事的迁入与错误观察，不用构建冒充play。

### 子任务

按源码核实1–3独立实验，完善人/agent的选择、模型、完整迁入、错误和清理说明；固定官方原文与官网证据，真实SDK/浏览器与独立试用。

### 验收标准

操作与真实结果对应；六项适用门槛逐项通过；fixture、业务逻辑、SDK能力和未验证条件分开；公共验证遵守输入屏障。

### 交付物

条目材料、local-validation.md、results/F14.md、独立复核、可追溯原始日志，正式收据另记。

## 阶段114实施细化 · F15 Knip

### 前置条件

核对当前实际源码、特殊条目规则与固定依赖；复用有效实现，禁止修改共享依赖与宿主。

### 目标

真实Knip6.41在隔离fixture区分文件/导出/依赖和生产检查，确切退出/报告；人工处理、补入口再诊断，切勿盲目删除业务文件。

### 子任务

按源码核实1–3独立实验，完善人/agent的选择、模型、完整迁入、错误和清理说明；固定官方原文与官网证据，真实SDK/浏览器与独立试用。

### 验收标准

操作与真实结果对应；六项适用门槛逐项通过；fixture、业务逻辑、SDK能力和未验证条件分开；公共验证遵守输入屏障。

### 交付物

条目材料、local-validation.md、results/F15.md、独立复核、可追溯原始日志，正式收据另记。

## 阶段115实施细化 · F16 dependency-cruiser

### 前置条件

核对当前实际源码、特殊条目规则与固定依赖；复用有效实现，禁止修改共享依赖与宿主。

### 目标

真实dependency-cruiser18.5隔离图、禁止层依赖和循环，JSON与 err 双报告器校核，明确静态解析限制与规则退出码。

### 子任务

按源码核实1–3独立实验，完善人/agent的选择、模型、完整迁入、错误和清理说明；固定官方原文与官网证据，真实SDK/浏览器与独立试用。

### 验收标准

操作与真实结果对应；六项适用门槛逐项通过；fixture、业务逻辑、SDK能力和未验证条件分开；公共验证遵守输入屏障。

### 交付物

条目材料、local-validation.md、results/F16.md、独立复核、可追溯原始日志，正式收据另记。

## 阶段116实施细化 · F17 axe-core

### 前置条件

核对当前实际源码、特殊条目规则与固定依赖；复用有效实现，禁止修改共享依赖与宿主。

### 目标

真实浏览器axe-core4.14只扫描当前ref和3规则，修复/复扫差异，处理同时触发/迟到结果、卸载和狭窄覆盖边界。

### 子任务

按源码核实1–3独立实验，完善人/agent的选择、模型、完整迁入、错误和清理说明；固定官方原文与官网证据，真实SDK/浏览器与独立试用。

### 验收标准

操作与真实结果对应；六项适用门槛逐项通过；fixture、业务逻辑、SDK能力和未验证条件分开；公共验证遵守输入屏障。

### 交付物

条目材料、local-validation.md、results/F17.md、独立复核、可追溯原始日志，正式收据另记。

## 调度与收尾

每次按queue选可执行候选，细化后才认领；无关阻塞不阻止其他阶段。近期任务共2个完整单库交付，远期114个保留在队列中，计划基线的116项已开始滚动实施，完成数仅以逐库独立复核及 queue.json 为准。估时待首批真实运行后决定，不将库数量换算成未经测量的天数。

公共修改先集成再验证依赖库。每库通过后更新queue与results，task-log回指阶段；每批汇报内容完成/真实运行/正式收据/阻塞，继续下一候选。最终对账119个身份，保留3个样板来源、116个逐库处置及所有未解除阻塞；有未完成项时不能宣称全部完成。
