# A06 React Flow 增量质量整改：稳定检查点

日期：2026-11-10。范围仅A06条目；工作者静态自检记录，新增交互仍等待主控真实浏览器验收。本记录不能代替独立复核或verify:record。

## 基线与原成果保护

开始时HEAD为`1218066e706a90ba03fac8dff8c9b843dd2429c4`。已有用户未提交的审批工作台，已先读 `docs/library-lab/evidence/a06-low-code-local-validation.md`：2026-11-09历史20策略、5浏览器及移动截图证据，均保持其原范围与日期，不冒称覆盖本次新增小图。

写入前捕获18个原有文件，按entry-relative路径+NUL+bytes+NUL计算SHA-256为`8f8ada8455a09fedcc7308f315e20906403bd16853dece9ecadaa7a11d450473`，各文件摘要见evidence/baseline.json。主控queue初始摘要443816…使用其规划输入，不能当HEAD；本记录的entry-relative摘要另行明确算法。

本轮保留13个原业务/兼容/测试/适配文件字节完全不变：approval-model/runtime/storage/designer/workbench/CSS、graph-rules/workflow-preset、全部原测试、demo.tsx、AGENTS.md。已用初始摘要核对，见evidence/local-runs.json的preservedOriginalFiles。example.tsx在原ApprovalWorkbench出口上增加basic小图包装，三个层级继续挂载原工作台。

共享冻结期间只读调研；收到主控释放A06写入后才修改。F05稳定后未再次修改。未改公共src/scripts/tests/e2e、依赖/锁、队列/results或根索引；未提交、推送或发布。

## 阶段5细化（供主控维护roadmap）

### 前提

适用AGENTS、调度合同、Skill三份reference、A06全部源码和历史证据已读；@xyflow/react12.12.0本地安装可用。官方tag、目标包目录和匹配README可核。保留现有业务功能是硬约束。浏览器与整Lab生成/构建由主控收齐稳定输入后统一执行。

### 目标

首次接触库的工程师先理解nodes/edges、受控change、图坐标与命名Handle，再进入已有表单/发布/申请/工单。明确React Flow只负责图编辑，审批执行与本地保存属于本例自建模块。

### 完整单库任务

5.A 保留原完整审批工作台，basic新增独立两节点图入门；重组指南的概念与最小接线，保留三场景业务入口及生产边界，补固定官方README与官网证据，完成受影响的类型/格式/来源检查并交主控真实浏览器验收。

### 验收

basic拖动或键盘移动反映到node.position和同份JSON；修改data.label驱动节点；清边与真实out→in重连驱动edges并保留端口id；视口变化不改变position，重置/离开重挂恢复初始小图，不影响下方线性审批数据。business/advanced现有功能和存储key保留。源码/样式可独立迁移，官方原文与版本可追溯，六项分开给状态；新增浏览器行为未验收前不能记content_done。

### 产物

flow-primer.tsx/CSS、example适配、guide/agent/library/verification、official原文与来源证据、baseline与本地静态日志、本记录。主控维护公共browser断言、集成检查、独立复核和results/queue。

## 当前实现与三个目标

| 场景 | 变化与保留 | 运行状态 |
| --- | --- | --- |
| basic | 新增两节点入门：受控nodes/edges、Handle out/in、图坐标、data.label、JSON、清边/重连/重置；下方原线性审批入口完整保留 | 新增交互NOT_RUN，待主控浏览器 |
| business | 原金额分支/经理财务/通过驳回/历史/发布继续保留 | 本轮业务源码未改；历史本地证据保留 |
| advanced | 原JSON导入导出、发布快照、持久化和旧标签冲突防护保留 | 本轮业务源码未改；历史本地证据保留 |

小图不是第四个demo：demos仍为basic/business/advanced。它单独持有内存状态，不导入审批模型/执行器/存储；重置只重建该图数组与视口，未调用localStorage。模块级nodeTypes稳定，画布300px；显式ReactFlow id防止同时挂载的两画布共用辅助描述id。两个命名端口通过真实Handle拖线，按钮共用connect回调；未用假SVG或手写结果代替SDK。

## 官方版本与来源

- 本地package声明@xyflow/react12.12.0，repository指向xyflow/xyflow的packages/react，types和源码只读核对。
- 官方annotated tag `@xyflow/react@12.12.0`对象为`69b435b132916cc664d6e7762051f3044289cc03`，实际API解引用提交`3d35b57317576b0916c0bfeaaedd573aaacc2839`。
- 实际读取该ref根目录及packages/react清单，只发现英文README候选；选目标包的`packages/react/README.md`。
- 原文URL：`https://raw.githubusercontent.com/xyflow/xyflow/3d35b57317576b0916c0bfeaaedd573aaacc2839/packages/react/README.md`，实际HTTP200，2026-11-10T09:34:51.771877+00:00取得6610字节，SHA-256 `d61d3061725de60ee80ec9864ba1356a71a5a10bb40aeedacd8e7e7d8c3e078c`。保存原始字节、署名、上游相对链接，不用中文自译替代原文。
- 官网页 `https://reactflow.dev/` GET200、最终URL不变；响应未见X-Frame-Options/CSP frame-ancestors，未从Lab origin浏览器确认，metadata=unknown。来源/tag/响应头/候选检查见official/source-evidence.json。
- API核实：https://reactflow.dev/learn 、https://reactflow.dev/api-reference/hooks/use-nodes-state 、https://reactflow.dev/learn/customization/handles 。本地dist/esm/hooks/useNodesEdgesState.d.ts及index.mjs:4077证明useNodesState通过applyNodeChanges更新；index.mjs:3768证明显式id转为rfId。屏幕/图坐标转换按types/general.d.ts的screenToFlowPosition说明，不在本例伪造外部拖放实现。
- Context7月配额已用完，fallback为官方文档、匹配版本源码/类型与官方仓库API；未申请凭据或安装新依赖。

## 六项自检

| 维度 | 状态与证据层级 | 依据/缺口 |
| --- | --- | --- |
| 技术准确 | PASS — 官方版本/源码类型+静态 | guide先解释数据模型/受控更新/端口/坐标；SDK与自建审批执行分工明确；定向类型通过 |
| 解释清楚 | PASS — 静态内容 | 从选型、基本概念、实际接线、basic操作路径再到原业务流程；迁移最小图无需整个审批引擎 |
| Demo有用 | NOT_RUN — 新UI待真实浏览器 | 设计与源码对应，三个目标保留；拖动/真实Handle/重置/下方审批未在当前树执行，不能继承历史5项 |
| 源码可迁移 | PASS — 静态/定向类型 | 小图两个独立文件、固定SDK及CSS；无Lab内部依赖；原业务与存储所有权保留，13个文件字节未变 |
| 官方来源可靠 | PASS — 固定ref HTTP原文/摘要 | 匹配目标包与12.12.0，原文sha正确；官方英文候选核对，官网unknown不冒称allowed |
| 结果可复核 | NOT_RUN — 新运行缺口明确 | 类型/格式/metadata日志可核；新增交互需要主控对应候选browser日志/实际产物，静态PASS不替代运行 |

## 实际定向检查

cwd统一为`/home/lambert/githubRepos/lambert/ReactLoom/packages/library-lab`。完整argv/时间/退出码/log与当前条目摘要保存在evidence/local-runs.json。

| 命令 | 结果 | 原始证据 |
| --- | --- | --- |
| `pnpm exec -- tsc --ignoreConfig --noEmit --target ES2022 --lib ES2022,DOM,DOM.Iterable --module ESNext --moduleResolution Bundler --jsx react-jsx --strict --skipLibCheck --esModuleInterop --allowSyntheticDefaultImports --allowImportingTsExtensions --types vite/client,node entries/A06-react-flow/examples/example.tsx entries/A06-react-flow/examples/flow-primer.tsx` | exit0；显式文件及其导入链，无generate | evidence/typecheck.log |
| `pnpm exec -- biome check entries/A06-react-flow/examples/flow-primer.tsx entries/A06-react-flow/examples/flow-primer.css entries/A06-react-flow/examples/example.tsx entries/A06-react-flow/library.json entries/A06-react-flow/verification.json entries/A06-react-flow/official/source-evidence.json` | exit0，6文件，无更改 | evidence/biome.log |
| `node --input-type=module -e <manifest保存的完整定向脚本>` | exit0；validateEntry、1–3场景结构、全部sourceFiles、README摘要、三个原level | evidence/metadata.log |

TypeScript7直接传文件需要--ignoreConfig；首次缺该旗标仅报TS5112，按本地错误提示补旗标后上述定向检查通过。没有新增policy-only测试来伪装画布运行，也没有重跑未受影响原20策略。2026-11-09历史20策略/5浏览器保持原意义；当前新交互仍NOT_RUN。未执行全目录typecheck/build/generate。

## 交给主控的browser操作与断言

请在`/libraries/react-flow?tab=demo&example=basic`检查region **React Flow 图编辑入门**：

1. `.react-flow__node`恰好2，`.react-flow__edge`初始1；`primer-source-position`为x=0/y=40。点击“查看同一份 nodes / edges JSON”summary后，从`data-testid=primer-state-json`解析真实JSON。
2. 点“源节点向右移动 40”，source.position.x变40；再真实鼠标拖动source节点，校验position和节点style变化。缩放/平移后position不变化。
3. 填“源节点名称”如“本地订阅”，source节点strong及JSON data.label同步改变，id仍source。
4. 点“清空入门连线”，`primer-edge-count`显示0且真实edge为0；从source的`[data-handleid="out"]`拖到target的`[data-handleid="in"]`，断言edge=1且JSON sourceHandle/targetHandle=out/in。再次清空后可用“连接 source → target”按钮测试键盘替代路径。
5. 点“重置入门图”，名称/position/初始边回到基线；切换到business再回basic或停止卸载再运行，重复确认内存状态重置。不要清空整个localStorage。
6. 同页region **低代码审批工作台**仍存在3个业务节点；发布并提交样例，经理审批完成，证明原basic业务入口保留。business/advanced原5项@A06按实际影响保留/运行。
7. 390px检查新增primer与原工作台无横向溢出，无pageerror；README/website页签展示原文与unknown状态/直达入口。

主控已先在旧candidate-02真实dist运行新增primer断言，实际exit1，失败因为region“React Flow 图编辑入门”不存在，未把连接/环境错误冒充红灯；原始日志为docs/library-lab/evidence/quality-upgrade/a06-primer-red.txt。主控已写move40、真实Handle拖连、端口id、reset与原workbench保留断言，等待本次稳定源码生成/构建后运行。工作者没有在写入期间触发共享build或浏览器。

## 剩余项和正式状态

- 新primer及原basic入口当前树真实浏览器交互待主控；Demo有用/结果可复核未通过前不能content_done。
- 正式verification sdk/build/browser全部NOT_RUN；当前dirty无提交授权，不为取收据提交。
- 主控集成build、页面源码/README/官网显示及独立审查待执行；Node策略与历史CI不能代替。
- 原工作台的真实后端、身份鉴权、多设备并发仍未实现；原限制完整保留，没有扩张为生产审批平台。

## 本轮新增/修改文件

新增：examples/flow-primer.tsx、examples/flow-primer.css、official/readme.md、official/source-evidence.json、evidence/baseline.json、evidence/local-runs.json及三份.log、.gitignore、本local-validation.md。

相对任务开始的增量修改：examples/example.tsx、guide.md、agent.md、library.json、verification.json。其余初始18文件按baseline字节校对不变。
