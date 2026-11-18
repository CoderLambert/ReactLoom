# ReactLoom Library Lab

119 条工程知识条目；收录不代表运行验证通过。先读 agent.md，再读真实源码及验证状态。

|编号|工具库|用途|组别|目录|
|---|---|---|---|---|
|A01|Apache ECharts|用同一组七日指标理解option、坐标轴、系列更新、容器尺寸与播放门禁|图表 · 画布 · 地图|[条目](packages/library-lab/entries/A01-echarts/)|
|A02|Recharts|React 声明式 SVG 图表与可访问数据表|图表 · 画布 · 地图|[条目](packages/library-lab/entries/A02-recharts/)|
|A03|Chart.js|模块化Canvas图表：选择同步、复用实例更新，以及类型/尺寸变化时的React所有权|图表 · 画布 · 地图|[条目](packages/library-lab/entries/A03-chartjs/)|
|A04|uPlot|对齐秒级时间序列、真实更新与尺寸变化，再观察100点保留窗口、暂停和销毁|图表 · 画布 · 地图|[条目](packages/library-lab/entries/A04-uplot/)|
|A05|D3|比例尺映射、真实坐标轴和keyed数据联结：React控件与D3 SVG子树各自拥有DOM|图表 · 画布 · 地图|[条目](packages/library-lab/entries/A05-d3/)|
|A06|React Flow|从受控节点和端口连线，到表单审批、条件分支和发布快照的真实React Flow工作台|图表 · 画布 · 地图|[条目](packages/library-lab/entries/A06-react-flow/)|
|A07|AntV G6|从稳定节点与有向边到真实Canvas；观察同实例拓扑更新、选择、窄屏适配与异步销毁|图表 · 画布 · 地图|[条目](packages/library-lab/entries/A07-antv-g6/)|
|A08|Mermaid|将受控 Mermaid DSL 编译成流程图、时序图和状态图|图表 · 画布 · 地图|[条目](packages/library-lab/entries/A08-mermaid/)|
|A09|Excalidraw|手绘白板嵌入、业务流程草图、导入导出和协作边界|图表 · 画布 · 地图|[条目](packages/library-lab/entries/A09-excalidraw/)|
|A10|tldraw|从真实画布编辑到文档快照保存恢复，区分会话、只读与生产许可|图表 · 画布 · 地图|[条目](packages/library-lab/entries/A10-tldraw/)|
|A11|Konva|Canvas 2D 场景图、图元拖拽、选择与变换|图表 · 画布 · 地图|[条目](packages/library-lab/entries/A11-konva/)|
|A12|react-konva|React 19.3 声明式二维画布与编辑状态|图表 · 画布 · 地图|[条目](packages/library-lab/entries/A12-react-konva/)|
|A13|Three.js|WebGL 3D场景、动画循环、尺寸管理与显存回收的原生引擎实验|图表 · 画布 · 地图|[条目](packages/library-lab/entries/A13-threejs/)|
|A14|React Three Fiber|声明式Mesh与真实Three对象、射线交互和按需帧：划清React业务状态与useFrame所有权|图表 · 画布 · 地图|[条目](packages/library-lab/entries/A14-react-three-fiber/)|
|A15|Leaflet|无瓦片的真实地图：经纬度与GeoJSON、稳定点图层筛选、局部更新和视口/卸载所有权|图表 · 画布 · 地图|[条目](packages/library-lab/entries/A15-leaflet/)|
|A16|MapLibre GL JS|本地GeoJSON到真实WebGL点层，区分源数据、渲染结果与Worker生命周期|图表 · 画布 · 地图|[条目](packages/library-lab/entries/A16-maplibre-gl-js/)|
|A17|deck.gl|无底图的GPU地理点图层，交互拾取、数据增量更新与Deck.finalize|图表 · 画布 · 地图|[条目](packages/library-lab/entries/A17-deckgl/)|
|B01|Motion for React|真实presence退出、稳定身份列表与布局重排；业务提交、动画和焦点各自有所有者|组件 · 动画 · 交互|[条目](packages/library-lab/entries/B01-motion-for-react/)|
|B02|GSAP|从Tween缓动映射到Timeline标签/重叠/反向，观察真实样式与减少动态及context局部清理|组件 · 动画 · 交互|[条目](packages/library-lab/entries/B02-gsap/)|
|B03|react-spring|React 状态驱动弹簧、带稳定身份的安全离场与本例减少动画|组件 · 动画 · 交互|[条目](packages/library-lab/entries/B03-react-spring/)|
|B04|dotLottie 播放器|用本地原创JSON观察真实WASM播放、业务结果分离与减少动态/错误恢复|组件 · 动画 · 交互|[条目](packages/library-lab/entries/B04-dotlottie/)|
|B05|Rive React Runtime|远程Rive文件、真实播放/Layout与React业务分离，观察SDK契约和共享渲染器所有权|组件 · 动画 · 交互|[条目](packages/library-lab/entries/B05-rive-react/)|
|B06|Ant Design|局部Token与上下文反馈、Form校验到Table、一次冲突回填与撤销恢复|组件 · 动画 · 交互|[条目](packages/library-lab/entries/B06-ant-design/)|
|B07|MUI|从局部主题与slot输入到过滤表/一步撤销，再走Dialog校验、模拟冲突恢复与Portal焦点|组件 · 动画 · 交互|[条目](packages/library-lab/entries/B07-mui/)|
|B08|Mantine|局部Mantine主题、防抖同源表格、保留数字草稿的配额编辑与撤销|组件 · 动画 · 交互|[条目](packages/library-lab/entries/B08-mantine/)|
|B09|shadcn/ui|拥有组件源码：实际 class 生成、可恢复的批量归档与 Slot 链接语义|组件 · 动画 · 交互|[条目](packages/library-lab/entries/B09-shadcn-ui/)|
|B10|Base UI|无样式 Checkbox 的语义、混合态、授权禁用与真实 FormData|组件 · 动画 · 交互|[条目](packages/library-lab/entries/B10-base-ui/)|
|B11|Radix Primitives|真实DropdownMenu键盘与Portal、受控复选排序、过滤后的稳定身份与禁用守卫|组件 · 动画 · 交互|[条目](packages/library-lab/entries/B11-radix-primitives/)|
|B12|React Aria|受控文本与频道身份分离，观察键盘/禁用选择、真实FormData和竞态安全本地异步建议|组件 · 动画 · 交互|[条目](packages/library-lab/entries/B12-react-aria/)|
|B13|dnd-kit|从真实拖动到受限排序和单层撤销，观察业务ID、完整数组与DOM同步|组件 · 动画 · 交互|[条目](packages/library-lab/entries/B13-dnd-kit/)|
|B14|Pragmatic drag and drop|真实原生拖放、固定频道约束与双实例scope隔离，保留键盘回退和会话失效|组件 · 动画 · 交互|[条目](packages/library-lab/entries/B14-pragmatic-drag-and-drop/)|
|B15|react-grid-layout|容器实测到格子/像素布局，再用真实拖拽缩放与锁定/键盘替代维护宽窄两份仪表盘|组件 · 动画 · 交互|[条目](packages/library-lab/entries/B15-react-grid-layout/)|
|B16|react-resizable-panels|真实分割条驱动的双栏/三栏约束布局、键盘轴与默认复位|组件 · 动画 · 交互|[条目](packages/library-lab/entries/B16-react-resizable-panels/)|
|B17|Floating UI|从锚点和首选方向到真实flip/shift，组合非模态焦点、滚动跟随与IME安全过滤|组件 · 动画 · 交互|[条目](packages/library-lab/entries/B17-floating-ui/)|
|B18|cmdk|可访问命令菜单、搜索分组与中文输入法快捷键|组件 · 动画 · 交互|[条目](packages/library-lab/entries/B18-cmdk/)|
|B19|Embla Carousel|用真实DOM测量理解snap与卡片、受控reInit、动态ID和循环回退|组件 · 动画 · 交互|[条目](packages/library-lab/entries/B19-embla-carousel/)|
|B20|Sonner|真实Toast、最新保存的一次撤销、同id异步更新与局部取消|组件 · 动画 · 交互|[条目](packages/library-lab/entries/B20-sonner/)|
|B21|react-motion（历史迁移）|从旧react-motion描述与render-prop迁向现代Motion：真实presence、列表事务与实时减动|组件 · 动画 · 交互|[条目](packages/library-lab/entries/B21-react-motion-migration/)|
|B22|react-beautiful-dnd（历史迁移）|在React19运行@hello-pangea/dnd18.0.1，保留历史RBD列表形状并核对真实传感器与最终写入守卫|组件 · 动画 · 交互|[条目](packages/library-lab/entries/B22-react-beautiful-dnd-migration/)|
|C01|React Hook Form|从register、字段错误和提交，到动态RSS行与可取消的业务错误回填|表单 · 数据 · 日期|[条目](packages/library-lab/entries/C01-react-hook-form/)|
|C02|Zod|从unknown到订阅DTO：严格字段、判别联合、TTL转换与精确重复路径|表单 · 数据 · 日期|[条目](packages/library-lab/entries/C02-zod/)|
|C03|Valibot|用同源Schema把未知RSS输入收窄成输出，观察批量错误路径与两端真实日期/跨字段约束|表单 · 数据 · 日期|[条目](packages/library-lab/entries/C03-valibot/)|
|C04|JSON Forms|真实Schema表单、HIDE与payload分离、字段回填及可取消的本地提交快照|表单 · 数据 · 日期|[条目](packages/library-lab/entries/C04-jsonforms/)|
|C05|Ajv|真实JSON Schema编译：结构与业务分层、整对象唯一与URL身份、条件必填及不修改输入|表单 · 数据 · 日期|[条目](packages/library-lab/entries/C05-ajv/)|
|C06|IMask|真实编号/金额/日期输入，区分模型与视图、SDK值/完成与业务语义，验证自己的输入生命周期|表单 · 数据 · 日期|[条目](packages/library-lab/entries/C06-imask/)|
|C07|TanStack Table|从原始数据、行模型到真实DOM，辨清客户端与服务端排序分页及稳定选择ID|表单 · 数据 · 日期|[条目](packages/library-lab/entries/C07-tanstack-table/)|
|C08|AG Grid|企业级数据网格、稳定行身份与可控编辑|表单 · 数据 · 日期|[条目](packages/library-lab/entries/C08-ag-grid/)|
|C09|React Virtuoso|真实变高虚拟窗口、可取消本地分页与稳定消息锚点|表单 · 数据 · 日期|[条目](packages/library-lab/entries/C09-react-virtuoso/)|
|C10|TanStack Virtual|从范围模型到真实DOM：稳定业务键、统一筛选、变高测量与可重建视图|表单 · 数据 · 日期|[条目](packages/library-lab/entries/C10-tanstack-virtual/)|
|C11|react-arborist|受控订阅树：稳定ID、SDK选择与焦点、真实拖放及1807节点虚拟窗口|表单 · 数据 · 日期|[条目](packages/library-lab/entries/C11-react-arborist/)|
|C12|FullCalendar|真实React v7视图与事件模型、全天创建和改期提议，区分DST重复时刻与同步revert|表单 · 数据 · 日期|[条目](packages/library-lab/entries/C12-fullcalendar/)|
|C13|Frappe Gantt|隔离文档中的真实任务时间线、语义表格保存与权威计划边界|表单 · 数据 · 日期|[条目](packages/library-lab/entries/C13-frappe-gantt/)|
|C14|date-fns|同源日期合同：严格日历日、日历排程与明确偏移事件|表单 · 数据 · 日期|[条目](packages/library-lab/entries/C14-date-fns/)|
|C15|Day.js|真实Day.js严格日期与不可变操作、IANA中午窗口和显式偏移DST往返|表单 · 数据 · 日期|[条目](packages/library-lab/entries/C15-dayjs/)|
|C16|Luxon|显式时区与同一瞬间、23/25小时日历窗口、DST缺口拒绝与回拨偏移选择|表单 · 数据 · 日期|[条目](packages/library-lab/entries/C16-luxon/)|
|C17|i18next|核心独立实例的真实t/复数、本地namespace写入与最新意图队列；词典fixture不作机器翻译|表单 · 数据 · 日期|[条目](packages/library-lab/entries/C17-i18next/)|
|C18|react-i18next|React useTranslation、Trans 富文本与多工作区 I18nextProvider 隔离|表单 · 数据 · 日期|[条目](packages/library-lab/entries/C18-react-i18next/)|
|C19|nuqs|共享URL筛选、关联参数与真实历史：明确区分草稿/SDK状态/地址栏及当前Router兼容桥|表单 · 数据 · 日期|[条目](packages/library-lab/entries/C19-nuqs/)|
|C20|clsx|用真实输入与返回值理解条件类名，以及 full / lite 的适用边界|表单 · 数据 · 日期|[条目](packages/library-lab/entries/C20-clsx/)|
|C21|tailwind-merge|一次完整合并实验：组件基础类、条件变体与调用者覆盖到真实 className|表单 · 数据 · 日期|[条目](packages/library-lab/entries/C21-tailwind-merge/)|
|C22|Moment（历史迁移）|把旧Moment发布计划拆成日历日、明确时间点与地区排程，真实对照两套不可变API和DST语义|表单 · 数据 · 日期|[条目](packages/library-lab/entries/C22-moment-migration/)|
|D01|es-toolkit|轻量类型安全工具函数：RSS 排序、去重、分组和分页|请求 · 状态 · 工具|[条目](packages/library-lab/entries/D01-es-toolkit/)|
|D02|Lodash/lodash-es|现代集合去重、分组排序和可清理的输入防抖|请求 · 状态 · 工具|[条目](packages/library-lab/entries/D02-lodash/)|
|D03|p-limit|真实观察 Promise 并发、运行/排队/完成与实测峰值，再区分失败隔离和取消边界|请求 · 状态 · 工具|[条目](packages/library-lab/entries/D03-p-limit/)|
|D04|p-queue|并发、滑动窗口限流与任务优先级调度|请求 · 状态 · 工具|[条目](packages/library-lab/entries/D04-p-queue/)|
|D05|decimal.js|从字符串到精确金额：decimal.js 的税率、舍入和对账边界|请求 · 状态 · 工具|[条目](packages/library-lab/entries/D05-decimal-js/)|
|D06|Immer|不可变嵌套更新、结构共享、Patch / inversePatches 乐观回滚|请求 · 状态 · 工具|[条目](packages/library-lab/entries/D06-immer/)|
|D07|TanStack Query|从同键共享与fresh/stale，到后台刷新、身份分页、可取消查询和按行乐观回滚|请求 · 状态 · 工具|[条目](packages/library-lab/entries/D07-tanstack-query/)|
|D08|Ky|基于 Fetch 的 HTTP 客户端：重试、超时、响应校验与取消|请求 · 状态 · 工具|[条目](packages/library-lab/entries/D08-ky/)|
|D09|Axios|HTTP 实例拦截器、取消、幂等请求重试与 409 失败分支|请求 · 状态 · 工具|[条目](packages/library-lab/entries/D09-axios/)|
|D10|Zustand|React19 vanilla store、租户状态与受控 persist 迁移|请求 · 状态 · 工具|[条目](packages/library-lab/entries/D10-zustand/)|
|D11|Jotai|原子和派生状态、写入 atom、Provider Store 多租户隔离|请求 · 状态 · 工具|[条目](packages/library-lab/entries/D11-jotai/)|
|D12|Redux Toolkit|createSlice/configureStore、团队状态隔离和响应竞态防护|请求 · 状态 · 工具|[条目](packages/library-lab/entries/D12-redux-toolkit/)|
|D13|RTK Query|与 Redux Toolkit 集成的远端缓存、订阅和失效刷新|请求 · 状态 · 工具|[条目](packages/library-lab/entries/D13-rtk-query/)|
|D14|XState|Actor 有限状态机：审稿流程、守卫和重试预算|请求 · 状态 · 工具|[条目](packages/library-lab/entries/D14-xstate/)|
|D15|Dexie|离线 RSS 的索引筛选、数组排序、原子回滚与真实版本升级|请求 · 状态 · 工具|[条目](packages/library-lab/entries/D15-dexie/)|
|D16|Workbox|隔离目录中的真实 Workbox precache 构建、公共 RSS 网络缓存策略与离线回退|请求 · 状态 · 工具|[条目](packages/library-lab/entries/D16-workbox/)|
|D17|Yjs|Y.Doc 双副本离线编辑、状态向量和 CRDT 增量合并|请求 · 状态 · 工具|[条目](packages/library-lab/entries/D17-yjs/)|
|D18|Comlink|Web Worker RPC、Transferable 数据传递、回调代理与资源释放|请求 · 状态 · 工具|[条目](packages/library-lab/entries/D18-comlink/)|
|D19|Fuse.js|浏览器端加权模糊搜索、分组过滤、IME 与动态索引重建|请求 · 状态 · 工具|[条目](packages/library-lab/entries/D19-fusejs/)|
|D20|MiniSearch|本地全文倒排索引、前缀与拼写容错、查询建议和索引重建|请求 · 状态 · 工具|[条目](packages/library-lab/entries/D20-minisearch/)|
|D21|Pagefind|真实 Pagefind Node API 为静态文章、RSS 笔记及 HTML 生成离线可部署索引|请求 · 状态 · 工具|[条目](packages/library-lab/entries/D21-pagefind/)|
|E01|Tiptap|ProseMirror 驱动的 Headless 富文本编辑器：工具栏、JSON 草稿与安全导入|编辑 · AI · 多媒体|[条目](packages/library-lab/entries/E01-tiptap/)|
|E02|BlockNote|开箱即用的块级文档编辑器：块结构、JSON 草稿与变更生命周期|编辑 · AI · 多媒体|[条目](packages/library-lab/entries/E02-blocknote/)|
|E03|Lexical|结构化富文本编辑：真实 EditorState、React Composer、草稿 JSON 和格式命令|编辑 · AI · 多媒体|[条目](packages/library-lab/entries/E03-lexical/)|
|E04|CodeMirror 6|模块化源代码编辑器：真实 EditorState / EditorView、草稿恢复、可更新配置与卸载|编辑 · AI · 多媒体|[条目](packages/library-lab/entries/E04-codemirror6/)|
|E05|Monaco Editor|用真实模型编辑、异步 JSON 诊断与显式本地草稿理解浏览器代码编辑器|编辑 · AI · 多媒体|[条目](packages/library-lab/entries/E05-monaco-editor/)|
|E06|react-markdown|安全的 React Markdown 展示|编辑 · AI · 多媒体|[条目](packages/library-lab/entries/E06-react-markdown/)|
|E07|remark|Markdown 结构化处理：真实 mdast 解析、GFM 规范化和危险链接审计|编辑 · AI · 多媒体|[条目](packages/library-lab/entries/E07-remark/)|
|E08|rehype|HTML AST 转换与安全输出：rehype-sanitize 净化及沙箱预览|编辑 · AI · 多媒体|[条目](packages/library-lab/entries/E08-rehype/)|
|E09|Shiki|只读代码语法着色：按需 token 化，使用 React 文本节点安全渲染|编辑 · AI · 多媒体|[条目](packages/library-lab/entries/E09-shiki/)|
|E10|DOMPurify|HTML 净化和输出安全|编辑 · AI · 多媒体|[条目](packages/library-lab/entries/E10-dompurify/)|
|E11|Streamdown|从分段输入到累计正文：未闭合语法、研究摘要与受控外链的真实 Streamdown 渲染|编辑 · AI · 多媒体|[条目](packages/library-lab/entries/E11-streamdown/)|
|E12|assistant-ui|真实 LocalRuntime 聊天原语、离线 Adapter、流式输出与取消|编辑 · AI · 多媒体|[条目](packages/library-lab/entries/E12-assistant-ui/)|
|E13|PhotoSwipe|响应式图库灯箱：PhotoSwipe Lightbox、触控缩放、键盘关闭与实例销毁|编辑 · AI · 多媒体|[条目](packages/library-lab/entries/E13-photoswipe/)|
|E14|react-easy-crop|可拖拽缩放裁剪框、真实像素区域、PNG本地输出与文件资源清理|编辑 · AI · 多媒体|[条目](packages/library-lab/entries/E14-react-easy-crop/)|
|E15|pica|浏览器本地高质量像素缩放与PNG导出：真实pica.resize/ toBlob|编辑 · AI · 多媒体|[条目](packages/library-lab/entries/E15-pica/)|
|E16|Video.js|Video.js v10 React 真正播放器：原创WebM、本地切换、生命周期与跨版本迁移|编辑 · AI · 多媒体|[条目](packages/library-lab/entries/E16-videojs-v10/)|
|E17|hls.js|真实 HLS.js MSE引擎、清单与码率、致命错误与网络资源销毁|编辑 · AI · 多媒体|[条目](packages/library-lab/entries/E17-hlsjs/)|
|E18|wavesurfer.js|真实波形播放器与音频片段交互：本地合成WAV、播放位置、倍速缩放与销毁|编辑 · AI · 多媒体|[条目](packages/library-lab/entries/E18-wavesurferjs8/)|
|E19|ffmpeg.wasm|以真实 Worker 把本地小文件转为 16 kHz 单声道 PCM16 WAV，观察参数、输出、取消与重载|编辑 · AI · 多媒体|[条目](packages/library-lab/entries/E19-ffmpeg-wasm/)|
|F01|Uppy|文件选择、限制、排队与本地预览：真实 Uppy Core，不使用假上传进度|文件 · 测试 · 工程|[条目](packages/library-lab/entries/F01-uppy/)|
|F02|react-dropzone|文件选择与拖放输入|文件 · 测试 · 工程|[条目](packages/library-lab/entries/F02-react-dropzone/)|
|F03|Papa Parse|真实 CSV 解析/导出：引号换行、表头与URL验证、本地文件及公式注入防护|文件 · 测试 · 工程|[条目](packages/library-lab/entries/F03-papaparse/)|
|F04|ExcelJS|Excel工作簿真实生成与读取：冻结表头、统计公式、RSS数据和不可信单元格处理|文件 · 测试 · 工程|[条目](packages/library-lab/entries/F04-exceljs/)|
|F05|SheetJS|从行数据到工作簿字节：单表往返、分类多表报告与受限导入|文件 · 测试 · 工程|[条目](packages/library-lab/entries/F05-sheetjs/)|
|F06|PDF.js|真正的 pdfjs-dist Worker、PDF 解析、Canvas 分页渲染和取消清理|文件 · 测试 · 工程|[条目](packages/library-lab/entries/F06-pdfjs/)|
|F07|react-pdf|React 组件化 PDF 阅读：本地文档、分页、TextLayer 与同版本 Worker|文件 · 测试 · 工程|[条目](packages/library-lab/entries/F07-react-pdf/)|
|F08|@react-pdf/renderer|React组件声明式生成原生PDF：报告布局、分页文本、受控下载与链接生命周期|文件 · 测试 · 工程|[条目](packages/library-lab/entries/F08-react-pdf-renderer/)|
|F09|pdf-lib|浏览器真正创建、合并及标注 PDF，处理本地字节边界并释放对象 URL|文件 · 测试 · 工程|[条目](packages/library-lab/entries/F09-pdf-lib/)|
|F10|Orval|离线 OpenAPI 真实 Orval CLI 双次生成、React Query Hooks、标签分包与产物指纹验收|文件 · 测试 · 工程|[条目](packages/library-lab/entries/F10-orval/)|
|F11|MSW|真实请求进入共享handler：GET参数、422恢复、一次503覆盖与隔离会话清理|文件 · 测试 · 工程|[条目](packages/library-lab/entries/F11-msw/)|
|F12|Vitest|真实 Vitest 测试配方：数据校验、可注入HTTP状态与取消竞态|文件 · 测试 · 工程|[条目](packages/library-lab/entries/F12-vitest/)|
|F13|Playwright|真实 Chromium E2E：语义定位、HTTP 场景矩阵与取消竞态（独立 CLI）|文件 · 测试 · 工程|[条目](packages/library-lab/entries/F13-playwright/)|
|F14|Storybook|组件隔离开发、CSF Stories、Play交互断言与可访问性反馈|文件 · 测试 · 工程|[条目](packages/library-lab/entries/F14-storybook/)|
|F15|Knip|检查 Monorepo 无用文件、导出及依赖：最小项目、业务入口与生产模式的真实 CLI 练习|文件 · 测试 · 工程|[条目](packages/library-lab/entries/F15-knip/)|
|F16|dependency-cruiser|源码级依赖图与架构边界约束：真实CLI检测跨层引用和循环依赖|文件 · 测试 · 工程|[条目](packages/library-lab/entries/F16-dependency-cruiser/)|
|F17|axe-core|真实 axe.run 局部审计，定位缺少alt/label/button-name并展示修复前后|文件 · 测试 · 工程|[条目](packages/library-lab/entries/F17-axe-core/)|
|F18|rollup-plugin-visualizer|从模块归因到真实改动：比较静态与点击加载入口，测量首屏依赖闭包并设置构建预算|文件 · 测试 · 工程|[条目](packages/library-lab/entries/F18-rollup-plugin-visualizer/)|
