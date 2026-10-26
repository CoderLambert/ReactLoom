# EF 通道持续开发进度

- 通道：EF，Issue #7；分支 `feat/library-lab-ef`；PR base 为 `feat/library-lab`。
- runCount：3 / 24。
- 基线：`38ed2d247bd82e4f1422b0e8904973e16bca2972`。
- 本轮日期：2026-10-27（北京时间）。
- 状态：**累计11个条目交付真实 SDK 示例/Node CLI 测试源码、Guide/Agent 文档；实际构建、SDK和浏览器验证仍未完成。**
- 写入所有权：仅 `entries/E*`、`entries/F*` 和本进度文件，公共依赖/CI/runner 未触碰。

## 首轮交付（5库，详见PR #11；不等于SDK验收）

| 条目 | basic/business/advanced | 真实依赖与源码 | 验证与限制 |
| --- | --- | --- | --- |
| E05 Monaco Editor | TS 编辑/草稿保存/JSON 诊断 | `monaco-editor@0.57.0`；Vite 5 worker 构造器、模型生命周期、ResizeObserver | Worker/CSP/生产 bundle/模型销毁需浏览器确认；Monaco 内部共享 worker 不能仅凭 model.dispose 断言已停止 |
| F11 MSW | GET 200/验证码 200+422/一次 503 后恢复 | `msw@3.0.3`；同一 handlers.mjs 被 node-runner/browser-worker 复用；新增 `tests/node-scenarios.test.mjs` 真 SDK 测试 | Node/浏览器未运行；浏览器必须由 PLATFORM 提供独立 scoped iframe + 正式 worker |
| E06 react-markdown | 基础排版/GFM验收表格/恶意 Markdown | 真实 react-markdown/remark-gfm/rehype-sanitize，严格 URL/HTML 策略 | 需要 XSS/network 真浏览器验收；依赖已经在初版 package 声明 |
| E10 DOMPurify | 简单富文本/业务公告/攻击字符串 | `dompurify@3.4.17`；HTML profile 与禁止属性，展示净化前后 | 不将静态字符串判断冒充 XSS 实测；须查浏览器最终 DOM |
| F02 react-dropzone | 格式筛选/本地文本预览/体积拒绝+竞态 | `react-dropzone@20.1.4`，真实 useDropzone/getRootProps/getInputProps，generation 避免旧读取回写 | 需要 File API/拖放/键盘 E2E，示例不上传或存储文件 |

5 个条目共 15 个独立场景，E05/E06/E10/F02 是 React 宿主可按需 import 的真实代码，F11 为真实 Node/MSW CLI 和受限 Worker 配接源码；**MSW 目前没有站内可执行的浏览器 Demo**，不可计算成 React 可运行数。所有条目 `library.json`、`guide.md`、`agent.md`、`AGENTS.md`、`verification.json` 已增补。示例源码供平台生成器展示 SHA-256；不再重复维护展示副本。

## 真实验证状态

- GitHub Git Tree 创建成功，仅代表服务器存储了源码；**不是编译或测试通过**。
- 当前容器无法解析 registry.npmjs.org/api.github.com，未安装新的目标 SDK，无法运行依赖完整的 `typecheck`、`build`、真实 `node --test` 或浏览器。
- 因此新五条目标库 SDK 均 `NOT_RUN`，浏览器均 `NOT_RUN` 或 `BLOCKED`，缺依赖构建 `BLOCKED`。没有使用目标 SDK 的 Mock 冒充通过。
- 已添加 F11 `tests/node-scenarios.test.mjs`，必须在依赖安装后实际运行；运行前不记 PASS。
- 原研究包原件未被执行，也未将历史归档报告抬升为真实 SDK 结果。
- 版本/API 来源已参照 2026-10-27 可访问的 Monaco 官方 ESM 集成、MSW v3 官方 Quick Start/Vite、DOMPurify/npm、react-dropzone 官方使用说明，根锁文件仍需 PLATFORM 核验。

## dependencyRequests（PLATFORM 唯一安装 owner）

| 包 | 建议精确版本 | 使用原因 | 类型/兼容/许可 |
| --- | --- | --- | --- |
| `monaco-editor` | `0.57.0` | E05 编辑器和 `?worker` Vite Worker 打包 | 内建 TS，MIT，浏览器/Web Worker；不复制 VS Code 扩展 |
| `msw` | `3.0.3` | F11 Node fetch 真拦截、Worker 配接 | ESM-only，Node >=22、TS >=5.9，MIT；`msw/http`、`msw/node`、`msw/browser` |
| `dompurify` | `3.4.17` | E10 HTML-only XSS 学习实验 | 内建 TS，MPL-2.0 OR Apache-2.0；旧版存在安全公告 |
| `react-dropzone` | `20.1.4` | F02 文件拖入/选择与校验 | 内建 TS，React >=18，MIT |
| `react-markdown` / `remark-gfm` / `rehype-sanitize` | 原 package 已有 10.1.0/4.0.1/6.0.0 | E06 | 不另加依赖，先完成锁文件 |

请 PLATFORM 统一修改 `packages/library-lab/package.json`、`pnpm-lock.yaml` 与测试/runner 接线，优先真实解析安装，不手工伪造锁文件 integrity。新增依赖版本若与现有 React/Vite/TypeScript peer 冲突，确认兼容替代版本并通知本通道修改条目 manifest。

## 公共运行环境请求

1. F11 Node runner：支持 `node entries/F11-msw/examples/node-runner.mjs basic|business|advanced`，或 `node --test entries/F11-msw/tests/node-scenarios.test.mjs` 的独立 test:sdk 入口。runner 内使用 `library-lab.invalid` 固定伪域名，必须由 MSW 真正拦截；未匹配时应失败，不得连真实外网。
2. F11 browser runner：单独 `/lab-runners/msw/` 文档与官方 `mockServiceWorker.js`，限定 Worker scope，不允许控制全站 root；启用/停止后核查 registration，且生产构建实际包含 runner（官方 Vite dev 插件默认不生成生产 worker）。
3. E05：构建 worker chunk、JSON/TypeScript language diagnostics，审查 CSP 的 `worker-src`；在切换、卸载和重挂后检查 model URI 与 Worker 占用，内部 Worker 缓存仍可能持续存在。
4. E06/E10：XSS 和不安全 URL 网络检查；F02：拖拽/本地文件键盘交互。当前 Lab 公共 `DemoHost` 对 Node 类型只显示源码，这应明确展示复现命令，不要伪装在线 shell。

## 第一轮原定后续（本轮部分已经完成）

- E04 CodeMirror 6：模块化编辑器及 destroy，补与 Monaco 的选型比较。
- E09 Shiki：仅用户打开高亮或源码 Tab 时加载，AST 原始文本保持一致。
- F03 Papa Parse：CSV quoted/newline/编码、导出公式注入、流式大文件边界。
- F12 Vitest：真实 CLI 示例与 Scenario Matrix 断言，避免借 Mock 测试声称真 SDK 验证。
- 后续按重用价值处理 E07 remark/E08 rehype/F13 Playwright 等，并继续推进其余 E/F 条目。

不要因为某一项 npm 安装失败就在下一轮重复浪费资源；先在其他条目连续交付有依据源码与知识，再等待 PLATFORM 统一解决环境。


## 第二轮实际交付（2026-10-27，wave2）

新分支 `feat/library-lab-ef-wave2` 基于最新已集成 `feat/library-lab@df4674d501bac029f8529ff940ba9b8c8707347c`，避免已经合并的PR #11旧基线覆盖新平台代码。该轮**六条完整垂直源码、每库三层共18个场景**，累计本通道11库33场景源码（不等于所有场景可浏览器执行）。

| 条目 | 类型与三层源码 | 核心复用/边界 |
| --- | --- | --- |
| E04 CodeMirror 6 | React：EditorState/EditorView、会话草稿、Compartment动态只读 | effect挂载/卸载destroy、IME风险、局部sessionStorage，不模拟EditorView |
| E07 remark | React：mdast标题提取、GFM表格处理、危险URL/raw HTML审计 | 真remark+GFM processor，输出仍是Markdown文本，不称sanitize |
| E08 rehype | React：HAST/HTML parse、公告净化、恶意HTML隔离预览 | 真rehype+rehype-sanitize，iframe sandbox空许可+CSP独立约束 |
| E09 Shiki | React：真实tokens/语言切换、不可信代码安全展示 | 复用已声明shiki@4.5.0，React文本token，不用innerHTML，按需启动 |
| F03 Papa Parse | React：引号跨行解析、RSS CSV导入、错误行/公式注入 | 真Papa.parse/unparse，另有3个Node真实SDK断言文件，未执行 |
| F12 Vitest | Node-CI：纯函数、200/422/503场景矩阵、fake timers取消竞态 | 真Vitest测试文件 basic/business/advanced；不提供伪造网页命令执行 |

每条新增/更新 library.json、guide.md、agent.md、AGENTS.md、examples/、verification.json（均未写入无证据PASS）。F03另含 `tests/node-scenarios.test.mjs`，F12含三份 `*.test.ts` 实际Vitest入口。源码由平台生成器以相同文件展示并计算指纹，不维护第二份展示代码。

### 第二轮新增 dependencyRequests（PLATFORM 独占package/lockfile）

这些版本来自2026-10-23官方发行基线，已查阅2026-10-27可访问的官方API文档；**最终须由PLATFORM在CI解析包版本、peer、license及锁文件后确定**：

| 包 | 请求版本 | 目标条目 | 备注 |
| --- | --- | --- | --- |
| `codemirror` | 6.0.2 | E04 | 组合汇总包，提供basicSetup/EditorView；MIT |
| `@codemirror/state` | 6.7.6 | E04 | EditorState、Compartment；MIT |
| `@codemirror/lang-javascript` | 6.2.5 | E04 | javascript({typescript:true})；MIT |
| `remark` | 15.0.1 | E07 | Markdown parse/stringify；MIT；remark-gfm 4.0.1已有 |
| `rehype` | 13.0.2 | E08 | HTML parse/stringify；MIT；rehype-sanitize 6.0.0已有 |
| `papaparse` | 5.7.0 | F03 | CSV parse/unparse；MIT |
| `@types/papaparse` | 5.5.2 (dev) | F03 | DefinitelyTyped；实际TS解析确认 |
| `vitest` | 5.0.5 (dev) | F12 | 应与Vite8/Node22/现有Vitest版本协调；MIT |
| `shiki` | 4.5.0 | E09 | **已在当前PLATFORM包声明，无需重复添加** |

PLATFORM 接入后应追加F03 Node SDK定向测试：`node --test entries/F03-papaparse/tests/node-scenarios.test.mjs`；F12独立测试：`pnpm --filter @reactloom/library-lab exec vitest run entries/F12-vitest/examples/*.test.ts`，不能将单测源文件存在当作测试PASS。

### 本轮真实验证

仅 GitHub Git Object/API 提交成功；**没有在本执行环境实际运行以上6项的目标SDK、TypeScript构建或Chromium**。运行前SDK=NOT_RUN，build=BLOCKED（公共缺依赖），browser=NOT_RUN；不得继承旧研究包的领域单测PASS。E09虽然已在package声明，但尚无本轮SDK执行证据。后续优先检查版本安装和官方SDK运行，不反复尝试已知失败的DNS操作。

### 下一批队列

优先E03 Lexical、F13 Playwright（真实CLI）、F01 Uppy、F06 PDF.js；随后E01 Tiptap、E02 BlockNote、F07 react-pdf、F14 Storybook。依赖/授权复杂的库先完成指南、版本审查和独立隔离设计，再由平台统一接线。范围剩26个条目待完整处理；E11/F05原件仍缺失，应标recreated而不伪称恢复。

### 第二轮代码复核补丁（同批提交）

- F03：文件异步读取捕获稳定 input 引用，避免 await 后访问 React event.currentTarget；对 Papa Parse 多余/缺失列及 __parsed_extra 拒绝导入；高级案例使用有效 `=2+3` 输入实际演示 escapeFormulae，并保留列数错误行。
- E07：禁止将以 `//` 开头的协议相对 URL 误判为站内路径。
- E09：新输入触发高亮时先清空旧 token，防止错误把过期视觉内容当新数据。
- F12：使用稳定的 Vitest `toHaveBeenCalledTimes` + `toHaveBeenCalledWith` 断言，避免较新matcher版本差异。
- 另新增 E04/E07/E08/E09 各2条真实SDK Node `tests/node-scenarios.test.mjs` 断言源码。只是测试文件已创建；未安装/运行，**不能标 PASS**。PLATFORM 可定向 `node --test packages/library-lab/entries/{E04-codemirror6,E07-remark,E08-rehype,E09-shiki}/tests/node-scenarios.test.mjs`（请注意shell brace-expansion需显式匹配路径）。

## 第三轮实际交付（2026-10-27，wave3）

**分支**：`feat/library-lab-ef-wave3`，从当时最新集成 `feat/library-lab@2b244ef44cbf8e216a0f39e77b763acae8f50c04` 建立，避免旧 wave2 分支覆盖平台并发改动。此前 PR #11 与 PR #15 均已核实合入集成分支。

本轮新接入 **5 库，15 个basic/business/advanced场景源码**；累计 EF **16/37 条有真实第三方SDK或CLI配方及完整指南/Agent文档，剩余21条**。该计数仅代表源码/知识接入，不表示实际浏览器验收已经PASS。

|条目|场景与原始源码|安全及真实能力边界|
|---|---|---|
| E03 Lexical | 真 lexical/@lexical/react Composer + EditorState输入 / sessionStorage JSON草稿 / 选区格式命令与撤销 | 限制草稿100KB，parser失败不覆盖；真实浏览器IME/JSON兼容性未验证；v0.52 Extension Composer需后续选型 |
| F13 Playwright | 真 @playwright/test CLI：可访问名称定位与状态 / 200、422、503浏览器route场景 / AbortController旧新请求竞态 | 测试源为Node-CI运行型，不在站内运行任意shell，不冒充真实后端请求 |
| F01 Uppy | 真 @uppy/core：File选择拖入与限制 / 本地预览删除 / 超大文件拒绝与销毁 | **只有本地Core队列**，无上传插件，不画虚假进度，不请求Transloadit/S3 |
| F06 PDF.js | 真 pdfjs-dist + `?url`同版Worker：原创有效PDF Canvas / 分页提取 / HiDPI缩放与坏字节错误恢复 | 按需启动，局部文件≤3MB，取消renderTask和loadingTask，未加载外部PDF |
| F17 axe-core | 真 axe.run 当前子树：缺图片alt / 表单label / 空名按钮3规则修复对照 | **仅选取3条规则**，不能从零违规推断所有WCAG通过；故意失败DOM仅作教学 |

**新增源文件组织**：每条均含 `library.json`、`guide.md`、`agent.md`、`AGENTS.md`、`verification.json`，3个场景定义和真实复用源文件。React场景的 `examples/demo.tsx` 只导出 `example.tsx`；F13采用独立Playwright config与3个`*.spec.ts`，不用主应用假造终端。已有来源审计未改变E11/F05未恢复的事实。

### 静态与独立检查（非SDK验收）

- GitHub Git Tree 中检查5份库manifest可解析、每份3个唯一basic/business/advanced demo、实际入口列在sourceFiles且所有源码路径已提交、agent/guide/AGENTS/verification均存在：**5/5 PASS**。这不是TS类型检查，不是DOM/SDK已运行。
- F06原创PDF fixture算法另用 Python/PyMuPDF 复刻相同xref/stream构造逻辑，验证2页文本可被独立PDF解析器读取：**结构算法预检 PASS**。未在本轮使用真正的 pdfjs-dist Worker，因此F06 SDK仍 NOT_RUN。
- 对照2026-10-27官方文档核查：Lexical 0.52.0、pdfjs-dist 6.4.299、axe-core 4.14.0、Uppy Core API及许可，以及Playwright已存在的1.64.0依赖。包具体peer/lockfile尚需平台安装时再确认。
- 不可执行的项目门禁：`pnpm --filter @reactloom/library-lab typecheck`、`build`、真SDK导入/CLI和Chromium E2E均未完成（PLATFORM统一依赖/Runner仍待就绪）；所有库验证状态仍为NOT_RUN/BLOCKED，不能冒用研究包历史PASS。
- 最近集成GitHub workflow 40395555157仍见2个Job runner_id=0/steps=[]，在正式执行前失败；不重复猜测原因或循环重跑。

### 新增 dependencyRequests（只由PLATFORM统一安装）

|依赖|请求准确版本|许可及用途|适配注意|
|---|---|---|---|
| `lexical`、`@lexical/react` | `0.52.0` 均保持同版 | MIT；E03 文档编辑器 | React19、v0.52 Composer/Extension区别；运行时确认peer |
| `@uppy/core` | `6.1.0` | MIT；F01纯本地状态/限制/事件 | 不需要XHR/Tus或@uppy/react；不能误加收费服务 |
| `pdfjs-dist` | `6.4.299` | Apache-2.0；F06解析/Worker | Vite同版`pdf.worker.min.mjs?url`、CSP与单例Worker核对 |
| `axe-core` | `4.14.0` | MPL-2.0；F17规则审计 | 区分浏览器实际DOM与jsdom模拟 |
| `@playwright/test` | **已声明1.64.0，无需重复添加** | Apache-2.0；F13 Node-CI | 独立config位于`entries/F13-playwright/examples/playwright.config.ts`，需真Chromium |

请PLATFORM把准确版本及peer验证后写入本包package.json + **真实解析的**根pnpm-lock.yaml，优先运行定向命令和构建，不能手工编造lock integrity。F13可运行：
```bash
pnpm --filter @reactloom/library-lab exec playwright install chromium
pnpm --filter @reactloom/library-lab exec playwright test --config entries/F13-playwright/examples/playwright.config.ts
```
E03/F01/F06/F17需与公共DemoHost真实浏览器验证，尤其StrictMode重挂、Worker版本/CSP和清理、axe仅局部扫描。

### 下一批（EF剩21库）

优先 E01 Tiptap / E02 BlockNote / F07 react-pdf / F15 Knip / F14 Storybook，然后 F16 dependency-cruiser / F18 rollup-plugin-visualizer / E13 PhotoSwipe 等。大型WASM/视频/远程素材仅按显式加载与合法授权实施。E11 Streamdown/F05 SheetJS归档原件缺失，不得伪称已恢复。

当前runCount=3/24。worker只改自己entries/E、entries/F和本progress；没有修改公共依赖、CI、主分支或其他组。
